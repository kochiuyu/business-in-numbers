import statistics as st

x = [1, 2, 3, 4, 5]
y = [4, 7, 6, 4, 9]  # Excel B2:B6; keep pairs in the same order.
n = len(x)
sample_cov = st.covariance(x, y)
print(f"Sample covariance: {sample_cov:.4f}")
print(f"Population covariance: {sample_cov * (n - 1) / n:.4f}")
print(f"Pearson correlation: {st.correlation(x, y):.4f}")
