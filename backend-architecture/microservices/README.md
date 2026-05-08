# Minimal Polyglot Microservices Demo (Catalog + Orders)

A tiny microservices sample inspired by [`dotnet/eShop`](https://github.com/dotnet/eShop), shrunk
to a size you can read end-to-end in 15 minutes. Three services, three languages, one Redis broker.
Purpose: **show every microservices pattern from the syllabus in exactly one place each**, so the
mapping `concept → file` is one hop.

## At-a-glance

| Service          | Language              | Port  | Owns the concept of                           |
|------------------|-----------------------|-------|-----------------------------------------------|
| `api-gateway`    | TypeScript + Express  | 3000  | Edge routing, request fan-out, correlation-ID |
| `catalog-service`| Python 3.12 + FastAPI | 8001  | Bounded context, **CQRS** (write/read split)  |
| `orders-service` | .NET 8 minimal API    | 8002  | **Saga**, **circuit breaker**, **bulkhead**   |
| `redis`          | Redis 7 (Streams)     | 6379  | Async event transport (persistent + replay)   |

The languages are chosen to fit the pattern, not the reverse:
- **Polly** (.NET) is the de-facto resilience library — using anything else for circuit breaker / bulkhead would teach against the industry idiom.
- **CQRS** reads cleanest in Python: the file names `commands.py` and `queries.py` *are* the lesson.
- **TypeScript** matches every other folder in this repo, so the gateway is the most familiar service for newcomers.

## System diagram

```
   Client
      │
      ▼
  ┌───────────────┐  stamps X-Correlation-Id on every request
  │  api-gateway  │  (TypeScript + Express, :3000)
  └─┬───────────┬─┘
    │           │
    │           │  GET /orders/:id/full → fan-out to orders + catalog, merged
    │           │
    │           ▼
    │  ┌──────────────────┐                ┌──────────────────────┐
    │  │  orders-service  │ ──── sync ───▶ │  catalog-service     │
    │  │  (.NET 8, Polly) │   HTTP + breaker│  (Python, FastAPI)  │
    │  └────┬─────────────┘   + bulkhead   │   own in-memory DB   │
    │       │                              │   CQRS write / read  │
    │       │  Saga (2 compensable steps)  └──────────┬───────────┘
    │       │   1. reserveStock (HTTP)                │
    │       │   2. authorizePayment (in-process fake) │
    │       │   on failure: compensations run         │
    │       │   in REVERSE order                      │
    │       │                                         │
    │       │  publishes OrderConfirmed ┐             │ consumes OrderConfirmed
    │       │                           ▼             ▼
    │       └──────────────────▶  ┌──────────────┐ ────┐ updates "sold" projection
    │                             │  Redis 7     │     │   on the read side
    │                             │  Streams     │ ────┘
    │                             └──────────────┘
    │
    └──────────────────────▶  GET /catalog/products/:id  →  catalog-service (proxy)
```

## Wire contracts

### HTTP

| Caller         | Method | URL                                | Purpose                                   |
|----------------|--------|------------------------------------|-------------------------------------------|
| client         | POST   | `gateway:3000/orders`              | Place an order                            |
| client         | GET    | `gateway:3000/orders/:id`          | Read order state                          |
| client         | GET    | `gateway:3000/orders/:id/full`     | Aggregated view (order + product)         |
| client         | GET    | `gateway:3000/catalog/products/:id`| Read product view                         |
| orders-service | POST   | `catalog-service:8001/products/:id/reserve` | `{qty}` — wrapped in CircuitBreaker + Bulkhead |
| orders-service | POST   | `catalog-service:8001/products/:id/release` | `{qty}` — saga compensation               |

All requests propagate `X-Correlation-Id` end-to-end. Gateway generates one if absent.

### Events (Redis Stream `microservices:events`)

| Event              | Producer       | Consumer       | Payload                                       |
|--------------------|----------------|----------------|-----------------------------------------------|
| `OrderConfirmed`   | orders-service | catalog-service| `{ orderId, productId, qty, correlationId }`  |

Streams (not pub/sub) — events persist, can be replayed, and consumer groups give `XACK`-based
delivery semantics. See `catalog-service/app/events.py`.

## Run

### One command (everything)

```bash
cd backend-architecture/microservices
docker compose up
# wait for "ready" lines from all 3 services
```

If host ports `3000`, `8001`, or `8002` are already in use, override on the command line:

```bash
GATEWAY_HOST_PORT=3010 CATALOG_HOST_PORT=8011 ORDERS_HOST_PORT=8012 docker compose up
# then curl http://localhost:3010/... instead
```

### Per-service native dev

Each service folder runs natively too. Start `redis` first (`docker run -p 6379:6379 redis:7`), then
follow the run command in each service's `README.md`.

## Try it

### A. Happy path

```bash
# Place an order
curl -X POST http://localhost:3000/orders \
  -H 'content-type: application/json' \
  -H 'x-correlation-id: demo-1' \
  -d '{"productId":"p-1","qty":2}'

# Aggregated read (gateway fans out to orders + catalog)
curl http://localhost:3000/orders/<id>/full -H 'x-correlation-id: demo-1'

# Trace one request across three services
docker compose logs | grep demo-1
```

### B. Saga compensation (force payment failure)

```bash
# Stop the stack, restart with payment guaranteed to fail
docker compose down
PAYMENT_FAIL_RATE=1.0 docker compose up

curl -X POST http://localhost:3000/orders \
  -H 'content-type: application/json' \
  -H 'x-correlation-id: demo-fail' \
  -d '{"productId":"p-1","qty":2}'

# Order ends in CANCELLED with reason="payment_failed".
# Stock for p-1 is restored: catalog ran ReleaseStock as compensation.
docker compose logs catalog-service | grep ReleaseStock
docker compose logs orders-service  | grep compensating
```

### C. Circuit breaker (Polly)

```bash
docker compose stop catalog-service
for i in 1 2 3 4 5 6; do
  curl -X POST http://localhost:3000/orders \
    -H 'content-type: application/json' \
    -H "x-correlation-id: brk-$i" \
    -d '{"productId":"p-1","qty":1}'
done
docker compose logs orders-service | grep -E 'circuit|breaker'
# Expect: first attempts time out; once Polly opens the breaker, later calls fail fast.
```

## File map

```
microservices/
├── README.md                 you are here
├── docker-compose.yml        redis + 3 services, official base images, bind mounts
│
├── api-gateway/              TypeScript + Express
│   ├── README.md             role, endpoints, correlation-id contract
│   ├── package.json
│   ├── tsconfig.json
│   └── src/server.ts         ~50 lines — proxy + aggregation + correlation-id
│
├── catalog-service/          Python 3.12 + FastAPI — owns CQRS
│   ├── README.md
│   ├── pyproject.toml
│   └── app/
│       ├── main.py           routes, FastAPI app, Redis Streams consumer
│       ├── commands.py       WRITE side: Product, DecrementStock, ReleaseStock
│       ├── queries.py        READ side:  ProductView + GetProductView
│       └── events.py         Streams XADD / XREADGROUP / XACK helpers
│
└── orders-service/           .NET 8 minimal API — owns saga + resilience
    ├── README.md
    ├── OrdersService.csproj  references Polly, StackExchange.Redis
    ├── Program.cs            composition root + endpoints + hosted services
    ├── Saga.cs               THE centerpiece — 2 compensable steps, reverse-order undo
    └── Domain.cs             Order aggregate + states + in-memory store
```

If you only have time to read three files: `orders-service/Saga.cs`, `catalog-service/app/commands.py`,
and `catalog-service/app/queries.py`. They each carry one of the headline patterns.

## Production gaps (intentionally not implemented)

This is a teaching demo. A production microservices stack would add at least:

- **Idempotency keys** on every event consumer (Redis Streams plus a `processed_events` set).
  Today, replaying the same `OrderConfirmed` event would double-count "sold" in the projection.
- **Retries with exponential backoff** on the sync HTTP call (Polly `RetryPolicy` wrapping `CircuitBreaker`).
- **Distributed tracing** (OpenTelemetry → Jaeger). The correlation-ID plumbing here is a stepping stone toward this.
- **Schema versioning** for events (e.g. `OrderConfirmed.v1`) so consumers can evolve independently.
- **Outbox pattern** to atomically commit a domain change *and* its event (otherwise `OrderConfirmed` can be lost between DB commit and Stream publish).
- **Tests** — contract tests for the HTTP API, integration tests that drive the saga end-to-end through Redis.

Each of these is a deliberate omission, not an oversight. Adding them is the natural next set of demos.
