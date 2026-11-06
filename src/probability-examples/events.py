"""Synthetic orders; rows Express/Standard, columns On time/Late."""


def count(value):
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ValueError("Counts must be nonnegative integers.")
    return value


def conditional(joint_count, given_count):
    joint_count, given_count = count(joint_count), count(given_count)
    if given_count == 0:
        raise ValueError("Cannot condition on an event with count zero.")
    if joint_count > given_count:
        raise ValueError("The joint count cannot exceed the given-event count.")
    return joint_count / given_count


def summarize(table):
    if not isinstance(table, (list, tuple)) or len(table) != 2:
        raise ValueError("Expected a 2-by-2 count table.")
    if any(not isinstance(row, (list, tuple)) or len(row) != 2 for row in table):
        raise ValueError("Expected a 2-by-2 count table.")
    a, b, c, d = [count(value) for row in table for value in row]
    total = a + b + c + d
    if total == 0:
        raise ValueError("The sample space must contain at least one order.")
    express, on_time = a + b, a + c
    return {
        "total": total,
        "express": express / total,
        "on_time": on_time / total,
        "intersection": a / total,
        "union": (express + on_time - a) / total,
        "neither": d / total,
    }


def main():
    table = [[15, 25], [20, 20]]
    values = summarize(table)
    print("Synthetic orders (80 total)")
    print("          On time  Late")
    print("Express        15    25")
    print("Standard       20    20")
    print(f"P(express) = 40/80 = {values['express']:.6f}")
    print(f"P(on time) = 35/80 = {values['on_time']:.6f}")
    print(f"P(express and on time) = 15/80 = {values['intersection']:.6f}")
    print(f"P(express or on time) = (40 + 35 - 15)/80 = {values['union']:.6f}")
    print(f"P(on time | express) = 15/40 = {conditional(15, 40):.6f}")
    print(f"P(express | on time) = 15/35 = {conditional(15, 35):.6f}")
    print("The conditioning event determines the denominator.")


if __name__ == "__main__":
    main()
