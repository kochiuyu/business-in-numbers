import statistics as st

# The original synthetic order book, before any slider or custom-data changes.
x = [18, 22, 24, 25, 28, 30, 32, 35, 38, 42, 46, 200]
print(f"Mean: {st.mean(x):.2f}")
print(f"Median: {st.median(x):.2f}")
print(f"Population SD: {st.pstdev(x):.2f}")
print(f"Sample SD: {st.stdev(x):.2f}")
