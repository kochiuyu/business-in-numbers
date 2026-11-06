"""Synthetic screening data; Python 3.10+, standard library only."""
from math import isfinite


def probability(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("A probability must be a finite number in [0, 1].")
    if not isfinite(value) or not 0 <= value <= 1:
        raise ValueError("A probability must be a finite number in [0, 1].")
    return value


def posterior(prior, sensitivity, false_positive, *, positive=True):
    """Return P(condition | result); reject an impossible result."""
    prior, sensitivity, false_positive = map(
        probability, (prior, sensitivity, false_positive)
    )
    if not isinstance(positive, bool):
        raise ValueError("positive must be True or False.")
    if not positive:
        sensitivity, false_positive = 1 - sensitivity, 1 - false_positive
    condition_weight = prior * sensitivity
    other_weight = (1 - prior) * false_positive
    evidence = condition_weight + other_weight
    if evidence == 0:
        raise ValueError("Cannot condition on a result with probability zero.")
    return condition_weight / evidence


def main():
    prior, sensitivity, false_positive = 0.01, 0.90, 0.05
    population = 10_000
    # Expected counts, not a random simulation or observed patient records.
    tp = population * prior * sensitivity
    fp = population * (1 - prior) * false_positive
    fn = population * prior * (1 - sensitivity)
    tn = population * (1 - prior) * (1 - false_positive)
    print("Synthetic expected counts per 10,000")
    print("                    Positive  Negative")
    print(f"Condition present   {tp:8.0f}  {fn:8.0f}")
    print(f"Condition absent    {fp:8.0f}  {tn:8.0f}")
    print(f"P(condition | positive) = 90/585 = {posterior(prior, sensitivity, false_positive):.6f}")
    print(f"P(condition | negative) = 10/9415 = {posterior(prior, sensitivity, false_positive, positive=False):.6f}")
    # Reusing these likelihoods requires tests independent given condition
    # AND independent given no condition. Marginal independence is not assumed.
    first = posterior(0.4, 0.8, 0.4)
    second = posterior(first, 0.8, 0.4)
    print("Sequential example: prior 0.4, sensitivity 0.8, false-positive rate 0.4")
    print(f"After first positive: 4/7 = {first:.6f}")
    print(f"After second positive: 8/11 = {second:.6f}")
    print("Second update assumes conditional independence in both groups.")


if __name__ == "__main__":
    main()
