# Minimal DDD Example (TypeScript, OOP)

A tiny Domain-Driven Design demo. Four layers, one domain (bank accounts + transfers).
Purpose: read the whole repo in 10 minutes and understand how DDD layers communicate.

## Run

```
npm install
npm start         # CLI demo: exercises the layers via main.ts
npm run serve     # HTTP server on http://localhost:3000
```

## HTTP endpoints (serve mode)

| Method | Path | Body |
|---|---|---|
| POST | `/api/accounts` | `{ "id", "ownerName", "currency" }` |
| POST | `/api/accounts/:id/deposits` | `{ "amount", "currency" }` |
| POST | `/api/transfers` | `{ "fromId", "toId", "amount", "currency" }` |

Domain-rule violations (insufficient funds, currency mismatch, etc.) return `400` with `{ "error": "..." }`.

## Layer map and dependency direction

```
Interfaces ──► Application ──► Domain
(controllers)   (use cases)    (entities, VOs, domain service, repo interface)
                                       ▲
                                       │ implements
                               Infrastructure
                           (repository implementations)

Composition root (main.ts) wires infrastructure → application → interfaces.
```

Rule: **dependencies always point inward toward the domain.** The domain
imports from nothing. Application imports only domain. Interfaces import
application (and domain types for display). Infrastructure implements domain
contracts and is wired in at the composition root.

## The two kinds of "service"

| Kind | Example | Lives in | Knows about I/O? |
|---|---|---|---|
| **Domain service** | `TransferService` | `domain/` | No. Pure business rule spanning multiple entities. |
| **Application service** (use case) | `TransferMoneyService` | `application/services/` | Yes. Loads entities from repo, calls domain, saves. |

`TransferMoneyService` receives a `TransferService` instance and delegates the
actual rule enforcement to it — you can read both side-by-side to see where the
boundary is.

## File map

| Layer | File | Role |
|---|---|---|
| Domain | `domain/value-objects/Money.ts` | Immutable value object |
| Domain | `domain/entities/BankAccount.ts` | Entity with identity + invariants |
| Domain | `domain/repositories/IAccountRepository.ts` | Repository contract |
| Domain | `domain/TransferService.ts` | Domain service |
| Application | `application/services/OpenAccountService.ts` | Use case |
| Application | `application/services/DepositService.ts` | Use case |
| Application | `application/services/TransferMoneyService.ts` | Use case |
| Infrastructure | `infrastructure/repositories/InMemoryAccountRepository.ts` | Concrete repo |
| Interfaces | `interfaces/controllers/AccountController.ts` | CLI adapter |
| Interfaces | `interfaces/controllers/HttpAccountController.ts` | Express HTTP adapter |
| — | `src/main.ts` | CLI composition root |
| — | `src/server.ts` | HTTP composition root |
