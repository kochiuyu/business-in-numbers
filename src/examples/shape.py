import statistics as st


def shape(values):
    """Population moments and Excel-style corrected sample summaries."""
    n = len(values)
    if n < 4:
        raise ValueError("Use at least four observations for all four summaries.")
    mean = st.mean(values)
    m2 = sum((v - mean) ** 2 for v in values) / n
    if m2 == 0:
        raise ValueError("Shape summaries are undefined for constant data.")
    m3 = sum((v - mean) ** 3 for v in values) / n
    m4 = sum((v - mean) ** 4 for v in values) / n
    g1 = m3 / m2 ** 1.5
    g2 = m4 / m2 ** 2 - 3  # excess: subtract 3
    sample_skew = (n * (n - 1)) ** 0.5 / (n - 2) * g1
    sample_excess = (n - 1) / ((n - 2) * (n - 3)) * ((n + 1) * g2 + 6)
    return g1, sample_skew, g2, sample_excess


x = [1, 2, 3, 4, 5]
labels = ["Population skew", "Corrected sample skew",
          "Population excess", "Corrected sample excess"]
for label, value in zip(labels, shape(x)):
    print(f"{label}: {value:.4f}")
