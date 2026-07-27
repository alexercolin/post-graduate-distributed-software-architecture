-- Tables for both ingestion pipelines. Created automatically on first Postgres boot.
--
-- Naming convention: tables are prefixed by the pipeline that owns them so a single
-- `\dt` makes the two strategies obvious side by side.

-- ============================================================================
-- Streaming / ELT (Kafka)
-- ============================================================================

-- Landing zone. The Kafka consumer writes the event JSON here UNCHANGED.
-- This is the "E" (extract from Kafka) and "L" (load) of ELT — no transform yet.
CREATE TABLE IF NOT EXISTS kafka_orders_raw (
    order_id     UUID        PRIMARY KEY,
    payload      JSONB       NOT NULL,         -- full event, exactly as received
    placed_at    TIMESTAMPTZ NOT NULL,         -- business event time (from producer)
    ingested_at  TIMESTAMPTZ NOT NULL DEFAULT now()  -- when WE loaded it
);

-- Curated target, built by sql/elt_transform.sql — the "T" of ELT, run IN the
-- database after the data has already landed in kafka_orders_raw.
CREATE TABLE IF NOT EXISTS kafka_revenue_by_minute (
    minute       TIMESTAMPTZ PRIMARY KEY,
    order_count  INTEGER     NOT NULL,
    revenue      NUMERIC(12,2) NOT NULL
);

-- ============================================================================
-- Batch / ETL (RabbitMQ)
-- ============================================================================

-- Curated target. The worker TRANSFORMS records in TypeScript (validate, compute
-- totals, aggregate by day+SKU) and only then LOADS the clean rows here.
-- There is no raw landing table on this side — that is the whole point of ETL:
-- the warehouse only ever sees transformed data.
CREATE TABLE IF NOT EXISTS rabbitmq_sales_daily (
    sale_date  DATE          NOT NULL,
    sku        TEXT          NOT NULL,
    units      INTEGER       NOT NULL,
    revenue    NUMERIC(12,2) NOT NULL,
    loaded_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    PRIMARY KEY (sale_date, sku)
);
