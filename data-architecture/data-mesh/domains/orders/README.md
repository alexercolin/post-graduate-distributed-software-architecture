# orders domain

Source-aligned domain owned by **orders-team**. Models the customer ordering process — the system of record for every order placed.

## Data products

| Product        | Type            | Output port                      |
|----------------|-----------------|----------------------------------|
| `orders_raw`   | source-aligned  | `iceberg.orders.orders_raw`      |
| `orders_daily` | aggregate       | `iceberg.orders.orders_daily`    |

See [`data_product.yaml`](data_product.yaml) for the full contract (SLOs, schema, ports).

## Layout

- `contracts/` — JSON Schema. Single source of truth for downstream consumers.
- `ingest/`    — producer-owned scripts that publish `orders_raw`.
- `transform/` — producer-owned SQL that builds the `orders_daily` aggregate from `orders_raw`.
- `quality/`   — runnable checks that enforce the SLOs declared in `data_product.yaml`.
