# GraphQL — Minimal TypeScript Example

A tiny Task-list server that demonstrates the **GraphQL** API strategy: a single endpoint exposing a typed schema, where the *client* decides which fields it wants.

## What GraphQL emphasizes

- **One endpoint, many shapes.** Everything goes through `POST /graphql`. The query string in the body decides what runs.
- **Schema-first contract.** The `Task`, `Query`, and `Mutation` types are the source of truth — both server and clients are checked against them.
- **No over-fetching.** Clients ask for `{ tasks { id title } }` and get exactly those fields. Adding a field to the schema does not bloat existing queries.
- **Queries vs Mutations.** Reads go through `Query`; writes go through `Mutation`. The split is a convention, not HTTP-method-driven.

## Request flow

```
  Client                                Server
    │                                     │
    │  POST /graphql                      │
    │  { query: "{ tasks { id title } }"} │
    │ ──────────────────────────────────► │
    │                                     │  parse → validate against schema
    │                                     │  resolve fields via root resolvers
    │  200 OK + { data: { tasks: [...] }} │
    │ ◄────────────────────────────────── │
```

## Run it

```bash
npm install
npm run dev
```

- GraphQL endpoint: `http://localhost:3000/graphql`
- In-browser IDE (Ruru / GraphiQL): `http://localhost:3000/`

## The schema

```graphql
type Task { id: Int!  title: String!  done: Boolean! }

type Query {
  tasks: [Task!]!
  task(id: Int!): Task
}

type Mutation {
  createTask(title: String!): Task!
  updateTask(id: Int!, title: String!, done: Boolean!): Task
  patchTask(id: Int!, title: String, done: Boolean): Task
  deleteTask(id: Int!): Boolean!
}
```

Sample queries:

```graphql
query    { tasks { id title done } }
query    { task(id: 1) { id title done } }
mutation { createTask(title: "Buy milk") { id title } }
mutation { updateTask(id: 1, title: "Buy oat milk", done: false) { id title done } }
mutation { patchTask(id: 1, done: true) { id title done } }
mutation { deleteTask(id: 1) }
```

## File map

| File              | Role                                                            |
|-------------------|-----------------------------------------------------------------|
| `src/schema.ts`   | The typed contract: `Task`, `Query`, `Mutation`                 |
| `src/server.ts`   | Express + `graphql-http` handler + root resolvers + Ruru IDE    |

## Why this layout

GraphQL fits when clients vary (mobile, web, partners) and each wants a different slice of the same domain. In a production codebase you'd split resolvers per type, add `DataLoader` to batch DB calls, plug in auth at the resolver layer, and codegen TypeScript types from the schema — but the core idea is what you see here: **one endpoint, one schema, client-driven field selection**.
