-- Aggregate data product: per-customer daily order metrics.
-- Owner: orders-team. Depends on: iceberg.orders.orders_raw.
DROP TABLE IF EXISTS iceberg.orders.orders_daily;

CREATE TABLE iceberg.orders.orders_daily AS
SELECT
  customer_id,
  date(order_ts)                       AS order_date,
  count(*)                             AS order_count,
  sum(amount)                          AS total_amount,
  array_agg(DISTINCT currency)         AS currencies
FROM iceberg.orders.orders_raw
GROUP BY customer_id, date(order_ts);
