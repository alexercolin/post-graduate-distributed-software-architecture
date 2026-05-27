# Data Mesh — minimal teaching demo

A runnable, two-domain data mesh built on an OSS lakehouse stack (MinIO + Apache Iceberg + Trino). Designed for pedagogical minimalism: every folder maps to a concept from the data mesh literature.

## The 4 principles → where to find them

| Principle                                | Folder / file                                          |
|------------------------------------------|--------------------------------------------------------|
| 1. Domain-oriented decentralized ownership | `domains/orders/`, `domains/customers/`              |
| 2. Data as a product                       | `data_product.yaml` + `contracts/` in each domain    |
| 3. Self-serve data platform                | `docker-compose.yml`, `scripts/bootstrap.sh`         |
| 4. Federated computational governance      | `governance/catalog.yaml`, `governance/policies/`    |

## The 3 data product types → where to find them

| Type             | Example                                                        |
|------------------|----------------------------------------------------------------|
| Source-aligned   | `domains/orders/ingest/seed_orders.py` → `orders.orders_raw`   |
| Aggregate        | `domains/orders/transform/orders_daily.sql`                    |
| Consumer-aligned | `consumer-aligned/customer-360/query.sql`                      |

## DATSIS data product attributes

| Attribute       | Shown by                                                                 |
|-----------------|--------------------------------------------------------------------------|
| Discoverable    | `scripts/discover.py` walks every `data_product.yaml`                    |
| Addressable     | `output_ports:` field on every product (Iceberg table, Trino SQL)        |
| Trustworthy     | `quality/checks.py` per domain enforces declared SLOs                    |
| Self-describing | JSON Schema in `contracts/`                                              |
| Interoperable   | Open table format (Iceberg) + open query engine (Trino)                  |
| Secure          | `governance/policies/pii_masking.sql` provides a masked view for PII     |

## Tech stack (all OSS, all in docker-compose)

- **MinIO** — S3-compatible object storage (the "lake")
- **Apache Iceberg** + **tabulario/iceberg-rest** — open table format with a REST catalog
- **Trino** — federated query engine; lets the consumer-aligned product query across domains
- **PyIceberg** — Python writer used by the producer `ingest/` scripts (no Spark needed)

## Cloud equivalents (real-world stacks)

This local stack is intentionally a stand-in for managed lakehouses. The same architecture maps to:

| Component        | Local (this repo)     | AWS                       | Databricks            | Snowflake             |
|------------------|-----------------------|---------------------------|-----------------------|-----------------------|
| Storage          | MinIO                 | S3                        | S3 / ADLS / GCS       | Snowflake internal    |
| Table format     | Apache Iceberg        | Iceberg / Delta           | Delta Lake / Iceberg  | Snowflake / Iceberg   |
| Catalog          | `iceberg-rest`        | Glue / S3 Tables          | Unity Catalog         | Horizon / Polaris     |
| Query engine     | Trino                 | Athena / EMR              | Databricks SQL        | Snowflake             |
| Governance       | `governance/`         | Lake Formation / Ranger   | Unity Catalog         | Horizon               |

## Layout

```
data-mesh/
├── docker-compose.yml                # principle: self-serve platform
├── trino/catalog/iceberg.properties
├── lineage.yaml                      # mesh-wide DAG (derived from depends_on)
├── governance/                       # principle: federated computational governance
│   ├── catalog.yaml
│   └── policies/pii_masking.sql
├── domains/                          # principle: domain ownership
│   ├── orders/
│   │   ├── data_product.yaml         # principle: data as a product
│   │   ├── contracts/orders.schema.json
│   │   ├── ingest/seed_orders.py     # source-aligned product
│   │   ├── transform/orders_daily.sql # aggregate product
│   │   └── quality/checks.py
│   └── customers/                    # same shape, holds PII
├── consumer-aligned/
│   └── customer-360/                 # joins both domain aggregates
│       ├── data_product.yaml
│       ├── query.sql
│       └── consume.py
└── scripts/
    ├── bootstrap.sh                  # one-shot: start stack, seed, transform, check
    ├── discover.py                   # DATSIS: discoverability
    └── teardown.sh
```

## Run it

```bash
cd data-architecture/data-mesh
./scripts/bootstrap.sh          # ~2 min on first run (pulls images)
python3 scripts/discover.py     # browse the mesh catalog
./scripts/teardown.sh           # stop + delete volumes
```

UIs once the stack is up:
- MinIO console: <http://localhost:9001> (admin / password)
- Trino UI:      <http://localhost:8080>

## What this demo intentionally skips

- **Eventing / async output ports** — real meshes often publish a Kafka topic alongside the Iceberg table. Add a `kafka` service to `docker-compose.yml` and an extra `output_ports:` entry to demonstrate.
- **Real RBAC** — Trino supports SYSTEM access control with Ranger/OPA. Here it's narrative-only in `governance/`.
- **Mesh experience plane / marketplace UI** — DataHub, OpenMetadata, Atlan. The `discover.py` script is a one-screen stand-in.
- **Orchestration** — Airflow/Dagster/Prefect would schedule the transforms. Here `bootstrap.sh` runs them once, top-to-bottom.
