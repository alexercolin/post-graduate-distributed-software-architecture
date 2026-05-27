"""Data quality checks for the customers data product."""
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
    "customers_raw row_count > 0",
    "SELECT count(*) FROM iceberg.customers.customers_raw",
    lambda v: v > 0,
)
check(
    "customers_raw customer_id unique",
    "SELECT count(*) - count(DISTINCT customer_id) "
    "FROM iceberg.customers.customers_raw",
    lambda v: v == 0,
)
check(
    "customers_raw email looks like an email",
    "SELECT count(*) FROM iceberg.customers.customers_raw "
    "WHERE NOT regexp_like(email, '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$')",
    lambda v: v == 0,
)

sys.exit(1 if failures else 0)
