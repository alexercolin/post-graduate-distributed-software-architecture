-- Side-by-side observation queries. Run `npm run observe` repeatedly while the
-- pipelines are going to SEE the difference between real-time and batch.

\echo '== STREAMING / ELT (Kafka) =========================================='

-- Raw rows grow continuously, one per event, as the producer emits them.
\echo '-- raw landing zone: row count + how fresh the newest row is'
SELECT
    count(*)                                            AS raw_rows,
    max(ingested_at)                                    AS newest_load,
    round(extract(epoch FROM (now() - max(ingested_at)))::numeric, 1) AS seconds_since_last_load
FROM kafka_orders_raw;

-- End-to-end ingest latency: how long between the event happening (placed_at)
-- and us loading it (ingested_at). Real-time pipelines keep this small.
\echo '-- per-event ingest latency (seconds) — should be low for real-time'
SELECT
    round(avg(extract(epoch FROM (ingested_at - placed_at)))::numeric, 3) AS avg_latency_s,
    round(max(extract(epoch FROM (ingested_at - placed_at)))::numeric, 3) AS max_latency_s
FROM kafka_orders_raw;

-- The curated rollup only has data AFTER you run `npm run transform`.
\echo '-- curated rollup (populated on demand by elt_transform.sql)'
SELECT * FROM kafka_revenue_by_minute ORDER BY minute DESC LIMIT 5;


\echo ''
\echo '== BATCH / ETL (RabbitMQ) ==========================================='

-- These rows appear all at once, already aggregated, after a batch run.
-- Note loaded_at: every row in a batch shares (roughly) the same timestamp.
\echo '-- curated daily sales: pre-aggregated rows loaded in bursts'
SELECT
    count(*)        AS curated_rows,
    sum(units)      AS total_units,
    sum(revenue)    AS total_revenue,
    max(loaded_at)  AS newest_load
FROM rabbitmq_sales_daily;

\echo '-- top SKUs by revenue (transformed in the worker, not in SQL)'
SELECT sku, sum(units) AS units, sum(revenue) AS revenue
FROM rabbitmq_sales_daily
GROUP BY sku
ORDER BY revenue DESC
LIMIT 5;
