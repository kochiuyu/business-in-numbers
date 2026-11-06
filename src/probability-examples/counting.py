"""Synthetic choices and fair, independent coin flips; no dependencies."""
from math import comb, factorial, perm


def exactly_tails(flips, tails):
    """Probability of exactly tails in flips fair, independent coin flips."""
    for value in (flips, tails):
        if isinstance(value, bool) or not isinstance(value, int) or value < 0:
            raise ValueError("Flip and tail counts must be nonnegative integers.")
    if tails > flips:
        return 0.0  # Impossible event, not an undefined conditional probability.
    return comb(flips, tails) / 2 ** flips


def main():
    print(f"Arrange all 5 distinct items: 5! = {factorial(5)}")
    print(f"Choose and order 3 of 5: P(5, 3) = {perm(5, 3)}")
    print(f"Choose 3 of 5, ignoring order: C(5, 3) = {comb(5, 3)}")
    print(f"Meal choices: 2 mains x 3 sides x 3 drinks = {2 * 3 * 3}")
    print(f"3 breads, 2 distinct fillings from 6, order matters: 3 x P(6, 2) = {3 * perm(6, 2)}")
    print(f"3 breads, 2 distinct fillings from 6, order ignored: 3 x C(6, 2) = {3 * comb(6, 2)}")
    print(f"Exactly 2 tails in 4 fair independent flips: C(4, 2)/2^4 = {exactly_tails(4, 2):.6f}")
    print("Counting ratios require equally likely elementary outcomes.")


if __name__ == "__main__":
    main()
