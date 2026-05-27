# customers domain

Source-aligned domain owned by **customers-team**. Models customer identities and lifecycle. Holds PII (`email`).

## Data products

| Product             | Type            | Output port                                       |
|---------------------|-----------------|---------------------------------------------------|
| `customers_raw`     | source-aligned  | `iceberg.customers.customers_raw`                 |
| `customers_active`  | aggregate       | `iceberg.customers.customers_active` (raw email)  |
|                     |                 | `iceberg.customers.customers_active_masked` (PII-masked view, see `governance/policies/pii_masking.sql`) |

See [`data_product.yaml`](data_product.yaml) for the full contract.
