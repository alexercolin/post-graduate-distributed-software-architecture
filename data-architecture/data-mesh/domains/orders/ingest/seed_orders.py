"""Seed the orders.orders_raw source-aligned data product."""
import random
import uuid
from datetime import datetime, timedelta, timezone

import pyarrow as pa
from pyiceberg.catalog import load_catalog
from pyiceberg.schema import Schema
from pyiceberg.types import DoubleType, NestedField, StringType, TimestamptzType

CATALOG = load_catalog(
    "rest",
    **{
        "uri": "http://localhost:8181",
        "s3.endpoint": "http://localhost:9000",
        "s3.access-key-id": "admin",
        "s3.secret-access-key": "password",
        "s3.region": "us-east-1",
        "s3.path-style-access": "true",
    },
)

NAMESPACE = "orders"
TABLE = "orders_raw"

schema = Schema(
    NestedField(1, "order_id", StringType(), required=True),
    NestedField(2, "customer_id", StringType(), required=True),
    NestedField(3, "amount", DoubleType(), required=True),
    NestedField(4, "currency", StringType(), required=True),
    NestedField(5, "order_ts", TimestamptzType(), required=True),
)

CATALOG.create_namespace_if_not_exists(NAMESPACE)
try:
    table = CATALOG.load_table(f"{NAMESPACE}.{TABLE}")
except Exception:
    table = CATALOG.create_table(f"{NAMESPACE}.{TABLE}", schema=schema)

# Must match the deterministic customer IDs produced by seed_customers.py.
CUSTOMERS = [str(uuid.UUID(int=i)) for i in range(1, 21)]

random.seed(42)
now = datetime.now(timezone.utc)
rows = [
    {
        "order_id": str(uuid.uuid4()),
        "customer_id": random.choice(CUSTOMERS),
        "amount": round(random.uniform(5, 500), 2),
        "currency": random.choice(["USD", "EUR", "BRL"]),
        "order_ts": now - timedelta(minutes=random.randint(0, 60 * 24 * 30)),
    }
    for _ in range(500)
]

arrow_table = pa.Table.from_pylist(rows, schema=table.schema().as_arrow())
table.append(arrow_table)
print(f"Inserted {len(rows)} rows into {NAMESPACE}.{TABLE}")
