"""Data quality checks for the orders data product (enforces declared SLOs)."""
import sys
import trino

conn = trino.dbapi.connect(host="localhost", port=8080, user="quality", catalog="iceberg")
cur = conn.cursor()

failures = []

def check(name, sql, predicate):
    cur.execute(sql)
    value = cur.fetchone()[0]
    ok = predicate(value)
    print(f"[{'OK' if ok else 'FAIL'}] {name}: {value}")
    if not ok:
        failures.append(name)

check(
    "orders_raw row_count > 0",
    "SELECT count(*) FROM iceberg.orders.orders_raw",
    lambda v: v > 0,
)
check(
    "orders_raw amount non-negative",
    "SELECT count(*) FROM iceberg.orders.orders_raw WHERE amount < 0",
    lambda v: v == 0,
)
check(
    "orders_raw currency in allowed set",
    "SELECT count(*) FROM iceberg.orders.orders_raw "
    "WHERE currency NOT IN ('USD','EUR','BRL')",
    lambda v: v == 0,
)

sys.exit(1 if failures else 0)
