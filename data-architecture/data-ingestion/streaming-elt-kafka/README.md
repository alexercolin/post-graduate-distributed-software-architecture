# Streaming ingestion + ELT (Apache Kafka → Postgres)

Real-time side of the demo. Orders are published to a Kafka topic as they happen
and loaded into Postgres event-by-event. Transformation happens **later, in the
database** — this is **ELT** (Extract, Load, _then_ Transform).

```
producer.ts ──emit OrderPlaced──▶  Kafka topic `orders.placed`
                                          │
                                          ▼
                                    consumer.ts  ── INSERT raw JSON ──▶  kafka_orders_raw   (E + L)
                                                                              │
                                              sql/elt_transform.sql ──────────┘  (T, in Postgres, on demand)
                                                                              ▼
                                                                     kafka_revenue_by_minute
```

## Why this is ELT (not ETL)

`consumer.ts` runs **zero** business logic. It drops the event into `kafka_orders_raw`
as a `JSONB` blob, untouched. The shaping — flattening line items, summing revenue,
bucketing by minute — is done by `sql/elt_transform.sql`, which runs **inside Postgres**
against data that has already landed. Load first, transform in-warehouse later.

This is how modern cloud stacks work (raw → dbt/SQL models on Snowflake/BigQuery):
land everything cheaply, transform on demand, keep the raw history.

## Why Kafka here

Kafka is a **pub/sub log**: the producer doesn't know who consumes, messages are
retained and replayable, and you can add more consumer groups later (fraud, search
indexing, ...) without touching the producer. That fits a real-time event stream.

## Run it

Infra must be up first (`docker compose up -d` in the parent folder).

```bash
# terminal 1 — load events as they arrive
npm run kafka:consumer

# terminal 2 — start the live order stream
npm run kafka:producer
```

## What to watch

Rows appear **continuously**, one per event, with low latency:

```bash
# run a few times — raw_rows keeps climbing, latency stays small
npm run observe
```

Then materialize the curated rollup (the "T") and inspect it:

```bash
npm run transform   # runs sql/elt_transform.sql inside Postgres
```

Stop either process with `Ctrl-C`.
