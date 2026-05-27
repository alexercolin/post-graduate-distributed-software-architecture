-- Aggregate data product: active customers only (drops inactive accounts).
-- Owner: customers-team. Depends on: iceberg.customers.customers_raw.
DROP TABLE IF EXISTS iceberg.customers.customers_active;

CREATE TABLE iceberg.customers.customers_active AS
SELECT
  customer_id,
  email,         -- PII; consumers should read via customers_active_masked view
  country,
  signup_date
FROM iceberg.customers.customers_raw
WHERE is_active = true;
