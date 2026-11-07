import statistics as st

# Separate files: purchases, supplier deliveries, and paired branches.
orders = [18, 22, 24, 25, 28, 30, 32, 35, 38, 42, 46, 200]
suppliers = {"A": [4, 5, 5, 5, 6], "B": [1, 2, 5, 8, 9]}
advertising = [1, 2, 3, 4, 5]  # $ thousands, same period
sales = [4, 7, 6, 4, 9]        # Same branches in the same order

print(f"Orders: n={len(orders)}, total=${sum(orders)}, "
      f"mean=${st.mean(orders):.2f}, median=${st.median(orders):.2f}")
for name, days in suppliers.items():
    misses = sum(day > 6 for day in days)  # Day six meets the target.
    print(f"Supplier {name}: mean={st.mean(days):.2f} days, "
          f"observed SD={st.pstdev(days):.4f} days, "
          f"later than six days={misses}/{len(days)} ({misses / len(days):.0%})")
print(f"Branches: r={st.correlation(advertising, sales):.4f}")
print("These summaries describe observed records, not future guarantees or causal effects.")
