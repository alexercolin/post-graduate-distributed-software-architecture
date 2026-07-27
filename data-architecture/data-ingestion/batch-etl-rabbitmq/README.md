# Batch ingestion + ETL (RabbitMQ → Postgres)

Batch side of the demo. A scheduled job hands a whole batch of orders to a work
queue; a worker validates and aggregates them **in application code** and only
then writes clean rows to Postgres. This is **ETL** (Extract, Transform, _then_
Load).

```
publisher.ts ──publish 200 orders, then exit──▶  RabbitMQ queue `orders.batch`
                                                        │
                                                        ▼
                                                   worker.ts
                                                   ├─ Extract  (consume messages)
                                                   ├─ Transform (validate, drop bad,
                                                   │             sum revenue, aggregate
                                                   │             by day + SKU)   ← in TypeScript
                                                   └─ Load     (bulk UPSERT) ──▶ rabbitmq_sales_daily
```

## Why this is ETL (not ELT)

`worker.ts` does all the work **before** the database: it rejects malformed
records (the publisher injects ~5% on purpose), computes line-item revenue, and
rolls everything up to `(sale_date, sku)`. Only the finished aggregates are
loaded. Postgres never sees a raw or invalid row — the transform happened in
flight. That is classic ETL, the model behind nightly warehouse loads.

## Why RabbitMQ here

RabbitMQ is a **work queue**: each message is delivered to exactly one worker,
removed once acked, and redelivered on failure. That fits "process this batch of
units of work" — you can scale out by adding workers and the queue load-balances
across them. (Contrast Kafka, where every consumer group sees every message.)

## Run it

Infra must be up first (`docker compose up -d` in the parent folder).

```bash
# terminal 1 — worker drains the queue in batches
npm run rmq:worker

# terminal 2 — drop one batch onto the queue (this command exits immediately)
npm run rmq:publish
```

## What to watch

The worker logs **bursts** — it buffers messages and flushes ~50 at a time, so
loads land in chunks, not per-row. Then the curated table appears all at once,
already aggregated:

```bash
npm run observe
# rabbitmq_sales_daily has pre-aggregated rows; every row in a batch shares
# roughly the same loaded_at. No raw landing table exists on this side.
```

Run `npm run rmq:publish` again to see totals accumulate. Stop the worker with `Ctrl-C`.
