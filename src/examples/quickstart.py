import statistics as st

# The same five values as Excel cells A2:A6.
x = [1, 2, 3, 4, 5]

print("Count:", len(x))
print("Total:", sum(x))
print("Mean:", st.mean(x))
print("Median:", st.median(x))
print("Population variance:", st.pvariance(x))
print("Sample variance:", st.variance(x))
print(f"Population SD: {st.pstdev(x):.4f}")
print(f"Sample SD: {st.stdev(x):.4f}")

# quantiles returns three cut points: Q1, median, Q3.
q1, _, q3 = st.quantiles(x, n=4, method="exclusive")
print("Exclusive Q1, Q3, IQR:", q1, q3, q3 - q1)
q1, _, q3 = st.quantiles(x, n=4, method="inclusive")
print("Inclusive Q1, Q3, IQR:", q1, q3, q3 - q1)
