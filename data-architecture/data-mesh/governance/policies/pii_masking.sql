-- Federated policy: non-privileged consumers read PII through this masked view.
-- In prod, enforced via Trino SYSTEM access control + Ranger/OPA or Unity Catalog.
CREATE OR REPLACE VIEW iceberg.customers.customers_active_masked AS
SELECT
  customer_id,
  regexp_replace(email, '(^[^@]).+(@.*$)', '$1***$2') AS email,
  country,
  signup_date
FROM iceberg.customers.customers_active;
