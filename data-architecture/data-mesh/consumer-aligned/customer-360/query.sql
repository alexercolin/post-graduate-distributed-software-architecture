-- Consumer-aligned data product: joins two domain aggregates into a marketing view.
-- Owner: analytics-team. Depends on: orders.orders_daily, customers.customers_active.
CREATE SCHEMA IF NOT EXISTS iceberg.consumer;

DROP TABLE IF EXISTS iceberg.consumer.customer_360;

CREATE TABLE iceberg.consumer.customer_360 AS
SELECT
  c.customer_id,
  c.email,
  c.country,
  COALESCE(SUM(o.order_count), 0)  AS lifetime_orders,
  COALESCE(SUM(o.total_amount), 0) AS lifetime_value,
  MAX(o.order_date)                AS last_order_date
FROM iceberg.customers.customers_active c
LEFT JOIN iceberg.orders.orders_daily o
  ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.email, c.country;
