"""Synthetic Class 1 charts. Requires Python 3.10+ and Matplotlib."""
import statistics as st
import matplotlib.pyplot as plt

channels = ["Online", "In store", "Phone"]
counts = [50, 30, 20]
times = [4, 6, 7, 9, 10, 11, 12, 12, 13, 14,
         14, 15, 15, 16, 17, 18, 19, 22, 26, 38]
edges = [0, 10, 20, 30, 40]
months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
revenue = [40, 48, 44, 58, 64, 60]
advertising = [1, 2, 3, 4, 5]
sales = [4, 7, 6, 4, 9]
orders = [18, 22, 24, 25, 28, 30, 32, 35, 38, 42, 46, 200]

fig, axes = plt.subplots(2, 3, figsize=(15, 9), layout="constrained")
a, b, c, d, e, f = axes.flat
a.bar(channels, counts, color="#173f36")
a.set(title="100 orders by channel", ylabel="Number of orders", ylim=(0, 60))
b.pie(counts, labels=channels, autopct="%1.0f%%",
      colors=["#173f36", "#bc4f24", "#eddba6"],
      textprops={"color": "black"}, pctdistance=1.18, labeldistance=1.4)
b.set_title("Share of the same 100 orders", pad=35)

frequencies, _, _ = c.hist(times, bins=edges, color="#b2c4ae",
                          edgecolor="#173f36")
midpoints = [(lo + hi) / 2 for lo, hi in zip(edges[:-1], edges[1:])]
c.plot(midpoints, frequencies, marker="o", color="#bc4f24")
c.set(title="20 delivery times + frequency polygon",
      xlabel="Delivery time (minutes)", ylabel="Number of deliveries",
      xlim=(0, 40), ylim=(0, 20))
d.plot(months, revenue, marker="o", color="#173f36")
d.set(title="Monthly revenue", xlabel="Month",
      ylabel="Revenue ($ thousands)", ylim=(0, 80))
e.scatter(advertising, sales, color="#bc4f24")
e.set(title="Five branches: association, not causation",
      xlabel="Advertising ($ thousands)", ylabel="Sales ($ thousands)",
      xlim=(0, 6), ylim=(0, 10))

# Specify the quartile convention instead of relying on chart defaults.
q1, median, q3 = st.quantiles(orders, n=4, method="exclusive")
iqr = q3 - q1
lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
inside = [v for v in orders if lower <= v <= upper]
flagged = [v for v in orders if v < lower or v > upper]
f.bxp([dict(q1=q1, med=median, q3=q3,
            whislo=min(inside), whishi=max(inside), fliers=flagged)],
      vert=False, showfliers=True)
f.set(title="12 orders: exclusive-quartile boxplot",
      xlabel="Order value ($)", xlim=(0, 220), yticks=[])

fig.suptitle("Synthetic business examples · Class 1", fontsize=16)
fig.savefig("class1-charts.png", dpi=160)
plt.close(fig)
print("Histogram counts:", [int(v) for v in frequencies])
print("Quartiles:", q1, median, q3)
print("Whiskers:", min(inside), max(inside))
print("Flagged values:", flagged)
print("Saved class1-charts.png")
