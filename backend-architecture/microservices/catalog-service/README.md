# catalog-service — Bounded Context with CQRS

Python 3.12 + FastAPI. This service owns products and stock; it serves the read
view (denormalized, for queries) and accepts write commands (reserve / release).

## What this service teaches

- **Bounded context.** Catalog has its own in-memory store. Nothing outside this
  service can read or write the product table directly — the only way in is HTTP
  (commands + queries) or events (`OrderConfirmed`).
- **CQRS.** The lesson is structural: open `app/` and you see `commands.py` and
  `queries.py` side by side. They share an aggregate but otherwise don't know
  about each other — the write side calls `queries.project()` after each
  successful command, and that's the only coupling.

```
                        Catalog bounded context
   ┌──────────────────────────────────────────────────────────┐
   │                                                          │
   │   commands.py  ───── project() ─────▶  queries.py        │
   │   (write store)                        (read store)      │
   │   Product                              ProductView       │
   │   id, name, price,                     id, name, price,  │
   │   stock_on_hand                        stock_level,      │
   │                                        sold_count,       │
   │                                        last_updated      │
   │                                                          │
   └──────────────────────────────────────────────────────────┘
            ▲                                       ▲
            │ POST /products/:id/reserve            │ GET /products/:id
            │ POST /products/:id/release            │ GET /products
            │  (orders-service calls this)          │
            │                                       │
            │              ┌─────────────────┐      │
            │              │  events.py      │      │
            └──────────────┤  Redis Streams  │      │
            consume        │  consumer       │      │
            OrderConfirmed │                 │      │
                           └─────────────────┘      │
                                                    │
```

## Endpoints

| Method | Path                         | Side  | Body                  | Purpose                           |
|--------|------------------------------|-------|-----------------------|-----------------------------------|
| GET    | `/products`                  | read  | —                     | List ProductView                   |
| GET    | `/products/:id`              | read  | —                     | Get ProductView                    |
| POST   | `/products/:id/reserve`      | write | `{ "qty": n }`        | Decrement stock — 409 if low      |
| POST   | `/products/:id/release`      | write | `{ "qty": n }`        | Compensating return of stock      |
| GET    | `/health`                    | —     | —                     | Liveness                           |

The service also runs a background task that consumes `OrderConfirmed` events
from Redis Streams and bumps the read-side `sold_count`.

## Run natively (no Docker)

```bash
cd backend-architecture/microservices/catalog-service
python -m venv .venv && source .venv/bin/activate
pip install -e .
REDIS_URL=redis://localhost:6379 uvicorn app.main:app --port 8001 --reload
```

Two products are seeded on startup: `p-1 Widget @ $19.99 stock=10` and
`p-2 Gizmo @ $9.99 stock=3`.

```bash
curl http://localhost:8001/products/p-1
curl -X POST http://localhost:8001/products/p-1/reserve \
  -H 'content-type: application/json' -d '{"qty":2}'
curl -X POST http://localhost:8001/products/p-1/release \
  -H 'content-type: application/json' -d '{"qty":2}'
```

## File map

| File             | Role                                                                      |
|------------------|---------------------------------------------------------------------------|
| `app/main.py`    | FastAPI app, routes, lifespan: seed + Redis Streams consumer task         |
| `app/commands.py`| **Write side.** Product aggregate, `decrement_stock`, `release_stock`     |
| `app/queries.py` | **Read side.** ProductView, `project`, `get_product_view`                 |
| `app/events.py`  | Redis Streams transport — `consume` (XREADGROUP/XACK), `OrderConfirmed`   |

## Why CQRS here

The write side enforces invariants ("you can't reserve more than `stock_on_hand`").
The read side serves *answers* ("what does this product look like to a buyer?").
Those are different shapes. CQRS lets each side stay small and clear: the write
side has no `sold_count` field to maintain, and the read side has no validation
to do. In a production system, the read store could be a different database
entirely (e.g. Elasticsearch for search, Postgres for the aggregate); we use one
process here because the lesson is about the *split*, not the deployment.
