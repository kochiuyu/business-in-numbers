"""Run with Python 3.10+: checked outputs plus independent probability tests."""
from fractions import Fraction
from itertools import combinations, permutations, product
from math import isclose
from pathlib import Path
import runpy
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parent
EXAMPLES = ROOT / "src" / "probability-examples"
BAYES = runpy.run_path(str(EXAMPLES / "bayes.py"))
EVENTS = runpy.run_path(str(EXAMPLES / "events.py"))
COUNTING = runpy.run_path(str(EXAMPLES / "counting.py"))


class ProbabilityExamples(unittest.TestCase):
    def close(self, actual, expected):
        self.assertTrue(isclose(actual, float(expected), rel_tol=1e-12, abs_tol=1e-12), (actual, expected))

    def test_checked_outputs(self):
        for name in ("bayes", "events", "counting"):
            with self.subTest(example=name):
                actual = subprocess.check_output([sys.executable, str(EXAMPLES / f"{name}.py")])
                self.assertEqual(actual, (EXAMPLES / f"{name}.txt").read_bytes())

    def test_bayes_expected_counts(self):
        # Independent exact arithmetic constructs the full joint distribution.
        prior, sensitivity, fp_rate = Fraction(1, 100), Fraction(9, 10), Fraction(1, 20)
        counts = [10000 * prior * sensitivity, 10000 * (1-prior) * fp_rate,
                  10000 * prior * (1-sensitivity), 10000 * (1-prior) * (1-fp_rate)]
        self.assertEqual(counts, [90, 495, 10, 9405])
        p = BAYES["posterior"]
        self.close(p(.01, .9, .05), counts[0] / (counts[0] + counts[1]))
        self.close(p(.01, .9, .05, positive=False), counts[2] / (counts[2] + counts[3]))

    def test_sequential_update(self):
        p = BAYES["posterior"]
        first = p(.4, .8, .4)
        self.close(first, Fraction(4, 7))
        second = p(first, .8, .4)
        self.close(second, Fraction(8, 11))
        # Joint likelihood uses two conditionally independent tests.
        joint_yes = Fraction(2, 5) * Fraction(4, 5) ** 2
        joint_no = Fraction(3, 5) * Fraction(2, 5) ** 2
        self.close(second, joint_yes / (joint_yes + joint_no))
        self.close(p(first, .8, .4, positive=False), Fraction(4, 13))

    def test_bayes_zero_and_invalid_cases(self):
        p = BAYES["posterior"]
        for prior, sensitivity, fp_rate, positive in [(0, .9, 0, True), (1, 0, .2, True),
                                                      (.5, 1, 1, False), (.5, 0, 0, True)]:
            with self.subTest(prior=prior, sensitivity=sensitivity, positive=positive):
                with self.assertRaises(ValueError):
                    p(prior, sensitivity, fp_rate, positive=positive)
        self.close(p(0, .9, .2), 0)
        self.close(p(1, .9, .2), 1)
        self.close(p(.4, 0, .2), 0)
        self.close(p(.4, .9, 0), 1)
        self.close(p(.4, 1, .2, positive=False), 0)
        self.close(p(.4, .9, 1, positive=False), 1)
        for bad in (-.1, 1.1, float("nan"), float("inf"), "0.5", None, True):
            for index in range(3):
                args = [.4, .8, .4]
                args[index] = bad
                with self.assertRaises(ValueError):
                    p(*args)
        with self.assertRaises(ValueError):
            p(.4, .8, .4, positive="yes")

    def test_order_events_by_enumeration(self):
        # Label individual orders to obtain independent set-based answers.
        express = set(range(40))
        on_time = set(range(15)) | set(range(40, 60))
        values = EVENTS["summarize"]([[15, 25], [20, 20]])
        self.assertEqual(values["total"], 80)
        self.close(values["union"], Fraction(len(express | on_time), 80))
        self.close(values["union"], Fraction(3, 4))
        self.close(values["intersection"], Fraction(len(express & on_time), 80))
        self.close(values["neither"], Fraction(1, 4))
        self.close(EVENTS["conditional"](15, 40), Fraction(3, 8))
        self.close(EVENTS["conditional"](15, 35), Fraction(3, 7))

    def test_event_zero_and_invalid_cases(self):
        summary, conditional = EVENTS["summarize"], EVENTS["conditional"]
        self.close(conditional(0, 40), 0)
        self.close(conditional(40, 40), 1)
        self.close(summary([[0, 0], [0, 5]])["union"], 0)
        self.close(summary([[5, 0], [0, 0]])["union"], 1)
        self.close(summary([[0, 4], [6, 0]])["intersection"], 0)
        for args in [(0, 0), (1, 0), (2, 1), (-1, 2), (1, -1), (1.5, 2), (1, True)]:
            with self.assertRaises(ValueError):
                conditional(*args)
        for bad in ([[0, 0], [0, 0]], [[1, 2]], [[1, 2], [3]], [[1, -2], [3, 4]],
                    [[True, 2], [3, 4]], [[1.5, 2], [3, 4]], [[float("nan"), 2], [3, 4]], None):
            with self.assertRaises(ValueError):
                summary(bad)

    def test_counting_by_enumeration(self):
        self.assertEqual(COUNTING["factorial"](5), len(list(permutations(range(5)))))
        self.assertEqual(COUNTING["factorial"](5), 120)
        self.assertEqual(COUNTING["perm"](5, 3), len(list(permutations(range(5), 3))))
        self.assertEqual(COUNTING["perm"](5, 3), 60)
        self.assertEqual(COUNTING["comb"](5, 3), len(list(combinations(range(5), 3))))
        self.assertEqual(COUNTING["comb"](5, 3), 10)
        self.assertEqual(len(list(product(range(2), range(3), range(3)))), 18)
        self.assertEqual(3 * COUNTING["perm"](6, 2), 90)
        self.assertEqual(3 * COUNTING["comb"](6, 2), 45)
        outcomes = list(product("HT", repeat=4))
        self.close(COUNTING["exactly_tails"](4, 2), Fraction(sum(x.count("T") == 2 for x in outcomes), len(outcomes)))
        self.close(COUNTING["exactly_tails"](4, 2), Fraction(3, 8))

    def test_counting_zero_and_invalid_cases(self):
        tails = COUNTING["exactly_tails"]
        self.close(tails(0, 0), 1)
        self.close(tails(0, 1), 0)
        self.close(tails(4, 5), 0)
        self.close(tails(4, 0), Fraction(1, 16))
        self.close(tails(4, 4), Fraction(1, 16))
        self.assertEqual(COUNTING["factorial"](0), 1)
        self.assertEqual(COUNTING["comb"](5, 0), 1)
        self.assertEqual(COUNTING["perm"](5, 0), 1)
        for args in [(-1, 0), (4, -1), (4.5, 2), (4, 2.5), (True, 0), (4, None)]:
            with self.assertRaises(ValueError):
                tails(*args)


if __name__ == "__main__":
    if sys.version_info < (3, 10):
        raise SystemExit("Python 3.10+ required.")
    unittest.main(verbosity=2)
