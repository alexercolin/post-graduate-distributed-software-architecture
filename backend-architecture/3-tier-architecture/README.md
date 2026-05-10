# 3-Tier Architecture — Library Management Example

A minimal Express + TypeScript project demonstrating the **3-tier (N-tier) architecture** pattern, where code is organized into three distinct layers: Presentation, Business Logic, and Data Access.

## The Three Tiers

```
┌───────────────────────────────────────────────────┐
│  PRESENTATION TIER                                │
│  routes/       → URL-to-controller mapping        │
│  controllers/  → parse HTTP, delegate, respond    │
│  middleware/   → cross-cutting HTTP concerns       │
├───────────────────────────────────────────────────┤
│  BUSINESS LOGIC TIER                              │
│  services/     → validation, rules, orchestration │
│  models/       → entity type definitions          │
├───────────────────────────────────────────────────┤
│  DATA ACCESS TIER                                 │
│  repositories/ → CRUD over storage (in-memory)    │
│  base.repository → generic interface + base class │
└───────────────────────────────────────────────────┘
```

**Request flow:**

```
HTTP Request
  → [request-logger]
    → [routes] → [controllers] → [services] → [IRepository<T>] → InMemoryRepository → Map<>
  → [error-handler]
HTTP Response
```

## Run it

```bash
npm install
npm run dev
```

The server starts on `http://localhost:3000` with pre-seeded books and members.

## Database-Agnostic Repository Layer

The data access tier is built around a generic `IRepository<T>` interface that any storage backend can implement:

```
IRepository<T>              ← generic contract (findAll, findById, save, delete)
  ├── IBookRepository       ← adds findByIsbn, findByGenre
  ├── IMemberRepository     ← adds findByEmail, findByStatus
  └── ILoanRepository       ← adds findByMemberId, findActiveByBookId, ...

InMemoryRepository<T>       ← base class using Map<string, T>
  ├── InMemoryBookRepository
  ├── InMemoryMemberRepository
  └── InMemoryLoanRepository
```

To integrate a real database, create a new implementation (e.g. `PostgresBookRepository implements IBookRepository`) and swap it in `server.ts` — services remain untouched.

## Models

All entities extend `BaseEntity` which provides `id`, `createdAt`, and `updatedAt`:

| Entity | Fields |
|--------|--------|
| **Book** | title, author, isbn, genre, publishedYear, availableCopies, totalCopies, status |
| **Member** | name, email, phone, memberSince, maxLoans, status |
| **Loan** | bookId, memberId, loanDate, dueDate, returnDate, status |

## Endpoints

### Books (`/api/books`)

```bash
# List all books
curl http://localhost:3000/api/books

# Create a book
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title": "Refactoring", "author": "Martin Fowler", "isbn": "978-0134757599", "genre": "Software Engineering", "publishedYear": 2018, "totalCopies": 2}'

# Get / Update / Delete
curl http://localhost:3000/api/books/:id
curl -X PUT http://localhost:3000/api/books/:id -H "Content-Type: application/json" -d '{"title": "New Title"}'
curl -X DELETE http://localhost:3000/api/books/:id
```

### Members (`/api/members`)

```bash
# List all members
curl http://localhost:3000/api/members

# Register a member
curl -X POST http://localhost:3000/api/members \
  -H "Content-Type: application/json" \
  -d '{"name": "Carol Davis", "email": "carol@example.com", "phone": "+1-555-0103"}'
```

### Loans (`/api/loans`)

```bash
# Borrow a book (use IDs from seed data printed at startup)
curl -X POST http://localhost:3000/api/loans/borrow \
  -H "Content-Type: application/json" \
  -d '{"bookId": "<book-id>", "memberId": "<member-id>"}'

# Return a book
curl -X POST http://localhost:3000/api/loans/<loan-id>/return

# List all loans / Get loans for a member
curl http://localhost:3000/api/loans
curl http://localhost:3000/api/loans/member/<member-id>
```

## Cross-Module Coordination

The `LoanService` receives **three repository interfaces** via constructor injection:

```
LoanService(ILoanRepository, IBookRepository, IMemberRepository)
```

When a member borrows a book, the service:
1. Validates the book exists and has available copies
2. Validates the member exists and is active
3. Checks the member hasn't exceeded their borrowing limit
4. Decrements `book.availableCopies` and updates book status
5. Creates a new `Loan` record with status `"active"`

This is how 3-tier handles cross-module operations: the **service layer orchestrates multiple repositories**.

## Shared / Cross-Cutting Concerns

| File | Purpose |
|------|---------|
| `shared/errors.ts` | `AppError` → `NotFoundError`, `ValidationError` with HTTP status codes |
| `shared/middleware/error-handler.ts` | Catches all `AppError` instances and returns uniform JSON errors |
| `shared/middleware/request-logger.ts` | Logs `METHOD /path STATUS elapsed` for every request |
| `shared/utils/id-generator.ts` | `generateId()` wrapping `crypto.randomUUID()` |

## File Map

| Layer | File | Role |
|-------|------|------|
| Models | `models/base.model.ts` | `BaseEntity` (id, createdAt, updatedAt) |
| Models | `models/book.model.ts` | `Book` extends BaseEntity |
| Models | `models/member.model.ts` | `Member` extends BaseEntity |
| Models | `models/loan.model.ts` | `Loan` extends BaseEntity |
| Data Access | `repositories/base.repository.ts` | `IRepository<T>` interface + `InMemoryRepository<T>` base |
| Data Access | `repositories/book.repository.ts` | `IBookRepository` + `InMemoryBookRepository` |
| Data Access | `repositories/member.repository.ts` | `IMemberRepository` + `InMemoryMemberRepository` |
| Data Access | `repositories/loan.repository.ts` | `ILoanRepository` + `InMemoryLoanRepository` |
| Business Logic | `services/book.service.ts` | Book validation + CRUD |
| Business Logic | `services/member.service.ts` | Member validation + CRUD |
| Business Logic | `services/loan.service.ts` | Borrow/return orchestration |
| Presentation | `controllers/book.controller.ts` | Book HTTP handlers |
| Presentation | `controllers/member.controller.ts` | Member HTTP handlers |
| Presentation | `controllers/loan.controller.ts` | Loan HTTP handlers |
| Presentation | `routes/book.routes.ts` | Book route definitions |
| Presentation | `routes/member.routes.ts` | Member route definitions |
| Presentation | `routes/loan.routes.ts` | Loan route definitions |
| Shared | `shared/errors.ts` | Error hierarchy |
| Shared | `shared/middleware/error-handler.ts` | Centralized error handling |
| Shared | `shared/middleware/request-logger.ts` | Request logging |
| Shared | `shared/utils/id-generator.ts` | UUID generator |
| Root | `server.ts` | Composition root |

## Why This Layout

- **Layer-first** organization (`controllers/`, `services/`, `repositories/`) is the traditional N-tier style — each directory maps to an architectural tier. This contrasts with DDD's module-first layout.
- **Anemic model**: entities are plain `type` aliases, and all business logic lives in the service layer. This is intentionally different from DDD's rich domain model where entities carry behavior.
- **Repository interfaces**: services depend on `IBookRepository` (interface), not `InMemoryBookRepository` (concrete class). This makes the data access tier swappable — you can introduce PostgreSQL, MongoDB, or any other storage without changing a single line in the services or controllers.
- **BaseEntity + timestamps**: every entity carries `id`, `createdAt`, and `updatedAt`, just like a production ORM would generate — the in-memory base repository auto-updates `updatedAt` on every save.
