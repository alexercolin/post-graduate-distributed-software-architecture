# orders-service — Saga + Resilience

.NET 8 minimal API. This service owns the order placement workflow. It runs a
two-step saga, talks synchronously to `catalog-service` through a Polly
**CircuitBreaker** + **ConcurrencyLimiter (bulkhead)** pipeline, and publishes
`OrderConfirmed` to Redis Streams when the saga completes.

## What this service teaches

- **Saga (orchestration, two compensable steps).** The saga is a list of `(do, compensate)` pairs.
  Steps run forward; on failure, completed steps' compensations run in **reverse order**.
  Read `Saga.cs` once — that's the whole pattern.
- **Circuit breaker.** When `catalog-service` fails repeatedly, Polly opens the
  breaker so further calls fail fast instead of piling up timeouts.
- **Bulkhead (ConcurrencyLimiter in Polly v8).** Caps in-flight calls to catalog
  to 4 (queue 8); a slow downstream cannot exhaust orders-service's capacity.
- **Sync REST + correlation-ID propagation.** The saga calls catalog over HTTP
  with `X-Correlation-Id` echoed end-to-end, so a single order is greppable
  across all three services.

## Saga state diagram

```
   POST /orders                       saga.Run(productId, qty, correlationId)
        │
        ▼
   ┌─────────┐
   │ Pending │
   └────┬────┘
        │  step 1: reserveStock
        │  HTTP POST catalog/products/:id/reserve  (Polly breaker + bulkhead)
        │
        ├── success ──▶  ┌────────────────┐
        │                │ StockReserved  │
        │                └────────┬───────┘
        │                         │  step 2: authorizePayment (in-process fake)
        │                         │
        │                         ├── success ──▶ ┌──────────────────────┐
        │                         │               │ PaymentAuthorized    │
        │                         │               └──────────┬───────────┘
        │                         │                          │ publish OrderConfirmed
        │                         │                          ▼  to Redis Streams
        │                         │                  ┌──────────────┐
        │                         │                  │  Confirmed   │
        │                         │                  └──────────────┘
        │                         │
        │                         └── failure ──▶ COMPENSATE in reverse:
        │                                         release stock (HTTP /release)
        │                                         then ┌────────────┐
        │                                              │ Cancelled  │
        │                                              └────────────┘
        │
        └── failure ──▶                            ┌────────────┐
                                                   │ Cancelled  │
                                                   └────────────┘
                                                   (nothing to compensate yet)
```

## Endpoints

| Method | Path             | Body                          | Purpose                       |
|--------|------------------|-------------------------------|-------------------------------|
| POST   | `/orders`        | `{ "productId":..., "qty":n }`| Place order — runs saga       |
| GET    | `/orders/:id`    | —                             | Read order state              |
| GET    | `/orders`        | —                             | List all orders               |
| GET    | `/health`        | —                             | Liveness                      |

## Run natively (no Docker)

```bash
cd backend-architecture/microservices/orders-service
REDIS_URL=localhost:6379 \
CATALOG_URL=http://localhost:8001 \
ASPNETCORE_URLS=http://localhost:8002 \
PAYMENT_FAIL_RATE=0.0 \
dotnet watch run
```

## File map

| File                | Role                                                                           |
|---------------------|--------------------------------------------------------------------------------|
| `Program.cs`        | Composition root — Polly pipeline, Redis multiplexer, endpoints, middleware    |
| `Saga.cs`           | **The saga.** `(Do, Compensate, PostState)` triples + reverse-order undo loop  |
| `Domain.cs`         | Order aggregate, `OrderStatus` lifecycle, in-memory store                      |
| `OrdersService.csproj` | Targets net8.0; references `Microsoft.Extensions.Http.Resilience` (Polly v8) and `StackExchange.Redis` |

## Why two compensable steps, not one

A one-step "reserve stock" workflow is a try/catch across services, not a saga.
With two steps, the second step's failure (`authorizePayment`) **forces a
compensating action against the first step's side effects** (release the
reserved stock back to catalog). That's the saga pattern's whole reason to
exist: there's no distributed transaction, so we apologize after the fact.

The payment step is a knob (`PAYMENT_FAIL_RATE` env var, 0..1) so you can run
the demo with `1.0` and watch the compensation chain fire on every request.

## Polly pipeline order

```
client call
   │
   ▼
┌──────────────────────┐
│ ConcurrencyLimiter   │   permitLimit=4, queueLimit=8 (bulkhead)
│ — drops overflow     │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ CircuitBreaker       │   FailureRatio=0.5, MinThroughput=3,
│ — fails fast when    │   SamplingDuration=10s, BreakDuration=5s
│   the catalog is sad │
└──────────┬───────────┘
           ▼
   actual HttpClient call
```

The bulkhead is **outermost** so we shed load before attempting the call. The
breaker is **innermost** so it observes actual call outcomes.
