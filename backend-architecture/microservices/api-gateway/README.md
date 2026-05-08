# api-gateway — Single Entry Point + BFF

TypeScript + Express. The only service exposed to the outside world. It does
two things and nothing else: routes by path, and aggregates one composite read
that would otherwise require two client round-trips.

## What this service teaches

- **Edge routing.** Clients shouldn't know about catalog-service vs
  orders-service. They talk to the gateway; the gateway forwards.
- **BFF aggregation.** `GET /orders/:id/full` fans out to orders + catalog and
  returns a merged response. That's what a Backend-for-Frontend earns its
  name doing.
- **Correlation-ID origination.** The gateway is where every request's
  `X-Correlation-Id` is born (or echoed back if the client sent one). Every
  downstream call carries it, so `docker compose logs | grep <cid>` shows the
  full path.

## Endpoints

| Method | Path                          | Purpose                                                  |
|--------|-------------------------------|----------------------------------------------------------|
| GET    | `/catalog/products`           | Proxy → `catalog-service:8001/products`                   |
| GET    | `/catalog/products/:id`       | Proxy → `catalog-service:8001/products/:id`               |
| POST   | `/orders`                     | Proxy → `orders-service:8002/orders` (place order, runs saga) |
| GET    | `/orders/:id`                 | Proxy → `orders-service:8002/orders/:id`                  |
| GET    | `/orders/:id/full`            | **BFF aggregate** — order + product in one response       |
| GET    | `/health`                     | Liveness                                                  |

## Run natively (no Docker)

```bash
cd backend-architecture/microservices/api-gateway
npm install
CATALOG_URL=http://localhost:8001 \
ORDERS_URL=http://localhost:8002 \
PORT=3000 \
npm run dev
```

## File map

| File                | Role                                                            |
|---------------------|-----------------------------------------------------------------|
| `src/server.ts`     | Whole gateway in one file: middleware, proxy, aggregate, listen |
| `package.json`      | express + tsx; mirrors `APIs-strategies/rest/package.json`      |
| `tsconfig.json`     | Strict TS, NodeNext modules                                     |

## Why one file

A gateway is routing logic. Splitting it into `routes/`, `middleware/`,
`controllers/` would invent layering that has no domain meaning. The repo's
sibling `APIs-strategies/rest/` makes the same call — one `server.ts`, ~30
lines. This service stretches it to ~100 lines because it has to do an
aggregate, but the principle holds: a gateway is glue, not a system.
