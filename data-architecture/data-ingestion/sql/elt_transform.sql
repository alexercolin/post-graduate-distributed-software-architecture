-- ELT — the "T", run INSIDE the database (Postgres) AFTER the raw events have
-- already been loaded into kafka_orders_raw by the consumer.
--
-- This is what makes the Kafka side ELT and not ETL: the consumer did zero
-- business logic; all shaping happens here, in SQL, on data that already lives
-- in the warehouse. In a real stack this same idea scales to dbt models running
-- on Snowflake / BigQuery / Redshift.
--
-- Idempotent: re-run it any time to recompute the rollup from the latest raw rows.

INSERT INTO kafka_revenue_by_minute (minute, order_count, revenue)
SELECT
    date_trunc('minute', r.placed_at)                            AS minute,
    count(DISTINCT r.order_id)                                   AS order_count,
    sum((item->>'qty')::int * (item->>'unit_price')::numeric)    AS revenue
FROM kafka_orders_raw r,
     LATERAL jsonb_array_elements(r.payload->'items') AS item
GROUP BY date_trunc('minute', r.placed_at)
ON CONFLICT (minute) DO UPDATE
    SET order_count = EXCLUDED.order_count,
        revenue     = EXCLUDED.revenue;

-- Show the result so `npm run transform` is self-explanatory.
SELECT * FROM kafka_revenue_by_minute ORDER BY minute DESC LIMIT 10;
