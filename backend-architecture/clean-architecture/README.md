# Minimal Clean Architecture Example (TypeScript, Express)

A tiny Clean Architecture demo. Three concentric layers, one domain
(`Conta`: consultar, creditar, debitar, definirLimiteCredito).
Purpose: read the whole repo in 10 minutes and understand how the
**Dependency Rule** keeps the domain free of frameworks and I/O.

## Run

```
npm install
npm run serve     # HTTP server on http://localhost:3000
```

## HTTP endpoints

| Method | Path                              | Body              |
|--------|-----------------------------------|-------------------|
| GET    | `/accounts/:id`                   | —                 |
| POST   | `/accounts/:id/credit`            | `{ "valor": n }`  |
| POST   | `/accounts/:id/debit`             | `{ "valor": n }`  |
| PUT    | `/accounts/:id/credit-limit`      | `{ "limite": n }` |

A demo conta is seeded on startup: `acc-1`, saldo `200`, limite `100`.

```
curl http://localhost:3000/accounts/acc-1
curl -X POST -H 'content-type: application/json' -d '{"valor":100}' http://localhost:3000/accounts/acc-1/credit
curl -X POST -H 'content-type: application/json' -d '{"valor":50}'  http://localhost:3000/accounts/acc-1/debit
curl -X PUT  -H 'content-type: application/json' -d '{"limite":500}' http://localhost:3000/accounts/acc-1/credit-limit
```

Domain-rule violations (saldo + limite excedido, valor negativo) return
`400` with `{ "error": "..." }`.

## Layer map and dependency direction

```
        ┌────────────────────────────────────────────┐
        │  infrastructure/                           │
        │  controllers, presenters, repositories,    │
        │  server  (Express, in-memory store)        │
        │   │                                        │
        │   ▼                                        │
        │  ┌──────────────────────────────────────┐  │
        │  │  app/usecases/                       │  │
        │  │  consultar, creditar, debitar,       │  │
        │  │  definirLimiteCredito                │  │
        │  │   │                                  │  │
        │  │   ▼                                  │  │
        │  │  ┌────────────────────────────────┐  │  │
        │  │  │  domain/                       │  │  │
        │  │  │  entities, value-objects,      │  │  │
        │  │  │  repositories (interfaces)     │  │  │
        │  │  └────────────────────────────────┘  │  │
        │  └──────────────────────────────────────┘  │
        └────────────────────────────────────────────┘

      Dependencies always point INWARD.
```

**The rule:**

- `domain/` imports nothing outside `domain/`. No Express, no Map, no HTTP.
- `app/` imports from `domain/` only. Use cases orchestrate entities through
  the repository interface — they never see Express or any concrete repo.
- `infrastructure/` imports from `app/` and `domain/`. It implements the
  repository contract, exposes HTTP, and wires everything together.

The `infrastructure/repositories/InMemoryContaRepository` implements the
`domain/repositories/ContaRepository` interface — that interface inversion
is the keystone of Clean Architecture: the domain owns the contract, the
outer layer obeys it.

## Use case shape

Each use case folder splits its contract into three files:

```
app/usecases/consultar/
  ConsultarContaInput.ts      ← what the caller passes in
  ConsultarContaOutput.ts     ← what the use case returns (carries the entity)
  ConsultarContaUseCase.ts    ← orchestration
```

The Output carries the domain `Conta` entity directly (`{ conta: Conta }`)
rather than a flattened DTO. Serialization to HTTP/JSON is the presenter's
job, not the use case's — the use case stays focused on the business flow.

## File map

| Layer | File | Role |
|---|---|---|
| Domain | `domain/value-objects/Money.ts` | Immutable, non-negative |
| Domain | `domain/value-objects/ContaId.ts` | Identity wrapper |
| Domain | `domain/entities/Conta.ts` | Entity + invariants (saldo + limite) |
| Domain | `domain/repositories/ContaRepository.ts` | Repository **interface** |
| App | `app/usecases/consultar/Consultar{Conta}{Input,Output,UseCase}.ts` | Read |
| App | `app/usecases/creditar/Creditar{Conta}{Input,Output,UseCase}.ts` | Credit a value |
| App | `app/usecases/debitar/Debitar{Conta}{Input,Output,UseCase}.ts` | Debit (enforces limit) |
| App | `app/usecases/definirLimiteCredito/DefinirLimiteCredito{Input,Output,UseCase}.ts` | Set limit |
| Infra | `infrastructure/repositories/InMemoryContaRepository.ts` | Concrete repo (Map) |
| Infra | `infrastructure/presenters/ContaPresenter.ts` | `Conta` → HTTP JSON |
| Infra | `infrastructure/controllers/ContaController.ts` | Express handlers |
| Infra | `infrastructure/server/server.ts` | Composition root + `app.listen` |

## Why this layout

A use case like `DebitarContaUseCase` does not import Express, does not
import the in-memory store. It receives a `ContaRepository` through its
constructor. To swap `InMemoryContaRepository` for a Postgres one, you
edit a single file (the composition root). That is the practical payoff
of obeying the Dependency Rule.
