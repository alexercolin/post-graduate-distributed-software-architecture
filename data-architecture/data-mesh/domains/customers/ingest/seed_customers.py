"""Seed the customers.customers_raw source-aligned data product."""
import random
import uuid
from datetime import date, timedelta

import pyarrow as pa
from pyiceberg.catalog import load_catalog
from pyiceberg.schema import Schema
from pyiceberg.types import BooleanType, DateType, NestedField, StringType

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

NAMESPACE = "customers"
TABLE = "customers_raw"

schema = Schema(
    NestedField(1, "customer_id", StringType(), required=True),
    NestedField(2, "email", StringType(), required=True),
    NestedField(3, "country", StringType(), required=True),
    NestedField(4, "signup_date", DateType(), required=True),
    NestedField(5, "is_active", BooleanType(), required=True),
)

CATALOG.create_namespace_if_not_exists(NAMESPACE)
try:
    table = CATALOG.load_table(f"{NAMESPACE}.{TABLE}")
except Exception:
    table = CATALOG.create_table(f"{NAMESPACE}.{TABLE}", schema=schema)

COUNTRIES = ["US", "BR", "DE", "FR", "JP"]

random.seed(7)
today = date.today()
rows = []
for i in range(1, 21):  # IDs 1..20 mirror seed_orders.py
    cid = str(uuid.UUID(int=i))
    rows.append({
        "customer_id": cid,
        "email": f"customer{i:02d}@example.com",
        "country": random.choice(COUNTRIES),
        "signup_date": today - timedelta(days=random.randint(0, 365 * 3)),
        "is_active": random.random() > 0.2,
    })

arrow_table = pa.Table.from_pylist(rows, schema=table.schema().as_arrow())
table.append(arrow_table)
print(f"Inserted {len(rows)} rows into {NAMESPACE}.{TABLE}")
