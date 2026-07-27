# Data Ingestion — ETL vs ELT, real-time vs batch

A runnable, two-pipeline demo of how a large e-commerce company gets order data
*into* its analytics database. Where [`../data-mesh`](../data-mesh) shows how data
is **organized and governed**, this folder shows how data is **ingested** — and
contrasts the two axes every data team has to choose along:

- **When** does data move? — **real-time** (per event) vs **batch** (scheduled bursts)
- **Where** does transformation happen? — **ELT** (load raw, transform in the DB)
  vs **ETL** (transform first, load clean)

Both pipelines emit the *same* `OrderPlaced` event and write to the *same*
Postgres, so you can run them side by side and watch the behaviour differ.

## The scenario

A retailer like Amazon/Shopify processes orders two ways at once:

| Pipeline | Real company analogue | Broker | Timing | Transform | This folder |
|----------|-----------------------|--------|--------|-----------|-------------|
| Live order stream feeding dashboards & fraud checks | Kafka-based event bus | **Apache Kafka** (pub/sub) | **real-time** | **ELT** | [`streaming-elt-kafka/`](./streaming-elt-kafka) |
| Nightly sales rollup feeding finance & reporting | scheduled job + work queue | **RabbitMQ** (queue) | **batch** | **ETL** | [`batch-etl-rabbitmq/`](./batch-etl-rabbitmq) |

## Architecture

```
                          ┌─────────────────────────────────────────────┐
   real-time path         │                 Apache Kafka                 │
   ───────────────        │              topic: orders.placed            │
   producer.ts  ─────────▶│  (pub/sub log, retained, replayable)         │
   (emits 1 order/sec)    └───────────────────────┬─────────────────────┘
                                                  │
                                       consumer.ts │  load raw, NO transform
                                                  ▼
                                         kafka_orders_raw  (JSONB) ──┐
                                                                     │ elt_transform.sql
                          ┌──────────────────────┐                  │ (transform in-DB)
                          │      PostgreSQL       │◀─────────────────┘
                          │   (relational sink)   │           kafka_revenue_by_minute
                          │                       │◀─────────────────┐
                          └──────────────────────┘                   │ bulk UPSERT
                                                  ▲                   │ (clean aggregates)
                                       worker.ts   │  transform THEN load
   batch path             ┌───────────────────────┴─────────────────┐
   ──────────             │                  RabbitMQ                 │
   publisher.ts ─────────▶│              queue: orders.batch          │
   (200 orders, exits)    │  (work queue, one consumer per message)   │
                          └──────────────────────────────────────────┘
```

## ETL vs ELT — the difference, made concrete

| | ELT (Kafka side) | ETL (RabbitMQ side) |
|---|---|---|
| Order of steps | Extract → **Load** → **Transform** | Extract → **Transform** → **Load** |
| Where transform runs | inside Postgres (`elt_transform.sql`) | inside the worker (TypeScript) |
| What the DB stores | raw JSON **and** curated rollups | only clean, aggregated rows |
| Bad records | land raw, filtered later | dropped before they ever reach the DB |
| Real-world stack | raw lake + dbt/SQL on Snowflake/BigQuery | nightly warehouse load jobs |

## real-time vs batch — the difference, made concrete

| | Real-time (Kafka) | Batch (RabbitMQ) |
|---|---|---|
| Trigger | every event, immediately | a scheduled run |
| Latency | seconds | until the next batch |
| Throughput shape | steady trickle | bursts |
| Row arrival | one at a time | many at once |
| Good for | dashboards, alerting, fraud | reporting, billing, reconciliation |

## Run it

Requires Docker and Node 20+.

```bash
cd data-architecture/data-ingestion
docker compose up -d        # Postgres + Kafka + RabbitMQ (wait until healthy)
npm install
```

Then follow the two example READMEs. A typical side-by-side session:

```bash
# --- real-time / ELT ---
npm run kafka:consumer      # terminal 1: loads raw events as they arrive
npm run kafka:producer      # terminal 2: live order stream (Ctrl-C to stop)
npm run transform           # build the curated rollup inside Postgres

# --- batch / ETL ---
npm run rmq:worker          # terminal 3: drains the queue in batches
npm run rmq:publish         # terminal 4: drop one batch (exits immediately)

# --- compare ---
npm run observe             # run a few times; watch the two tables behave differently
```

`docker compose down -v` tears everything down (and wipes the data).

> **Useful URLs:** RabbitMQ management UI at http://localhost:15672 (guest/guest).
> Postgres at `localhost:5432` (`shop`/`shop`/`shop`).

## What you should see

- `kafka_orders_raw` grows **row-by-row, continuously**, with low per-event
  ingest latency — and stores the untouched event JSON (raw, ELT).
- `rabbitmq_sales_daily` appears **all at once, already aggregated**, after a
  batch run — with no raw table behind it (clean, ETL).

That contrast *is* the lesson.

## What this intentionally skips

To stay teachable, this demo omits production concerns: a schema registry
(Avro/Protobuf), exactly-once / transactional delivery, dead-letter queues and
retries, partitioning/scaling beyond one node, and an orchestrator (Airflow /
Dagster) to actually *schedule* the batch job. Each is a natural next step.
