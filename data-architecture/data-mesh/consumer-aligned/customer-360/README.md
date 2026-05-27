# customer-360 (consumer-aligned)

Consumer-aligned data product owned by **analytics-team**. Joins aggregates from two source-aligned domains (`orders`, `customers`) into a single row per active customer for the marketing dashboard.

This product is the *consumer*; it does not own any source data. It depends on the contracts published by `orders` and `customers`.

See [`data_product.yaml`](data_product.yaml) for the full contract.
