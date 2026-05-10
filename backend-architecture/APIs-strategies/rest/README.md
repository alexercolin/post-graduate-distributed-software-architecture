# REST — Minimal TypeScript Example

A tiny Task-list server that demonstrates the **REST** API strategy: resources identified by URLs, operated on with HTTP verbs, exchanging JSON.

## What REST emphasizes

- **Resources, not actions.** `/tasks` is a noun. The verb is the HTTP method (`GET`, `POST`, `PUT`, `DELETE`).
- **Stateless.** Each request carries everything the server needs; no per-client session on the server.
- **HTTP semantics carry meaning.** `200`, `201`, `400`, `404` are part of the contract — clients branch on status codes, not just response bodies.
- **Cacheable & scalable.** `GET` requests can be cached by browsers, CDNs, and proxies without the server doing anything special.

## Request flow

```
  Client                             Server
    │                                  │
    │  GET /tasks                      │
    │ ───────────────────────────────► │  read list
    │  200 OK + JSON array             │
    │ ◄─────────────────────────────── │
    │                                  │
    │  GET /tasks/1                    │
    │ ───────────────────────────────► │  find by id
    │  200 OK + JSON task (or 404)     │
    │ ◄─────────────────────────────── │
    │                                  │
    │  POST /tasks {title:"..."}       │
    │ ───────────────────────────────► │  validate + append
    │  201 Created + JSON task         │
    │ ◄─────────────────────────────── │
    │                                  │
    │  PUT /tasks/1 {title,done}       │
    │ ───────────────────────────────► │  full replace
    │  200 OK + JSON task (or 404)     │
    │ ◄─────────────────────────────── │
    │                                  │
    │  PATCH /tasks/1 {done:true}      │
    │ ───────────────────────────────► │  partial update
    │  200 OK + JSON task (or 404)     │
    │ ◄─────────────────────────────── │
    │                                  │
    │  DELETE /tasks/1                  │
    │ ───────────────────────────────► │  remove
    │  204 No Content (or 404)         │
    │ ◄─────────────────────────────── │
```

## Run it

```bash
npm install
npm run dev
```

The server listens on `http://localhost:3000`.

## Endpoints

| Method   | Path          | Body                              | Response                          |
|----------|---------------|------------------------------------|-----------------------------------|
| GET      | `/tasks`      | —                                  | `200` + `Task[]`                  |
| GET      | `/tasks/:id`  | —                                  | `200` + `Task`, or `404`          |
| POST     | `/tasks`      | `{ "title": "..." }`              | `201` + `Task`, or `400` on empty |
| PUT      | `/tasks/:id`  | `{ "title": "...", "done": bool }` | `200` + `Task`, or `404`/`400`    |
| PATCH    | `/tasks/:id`  | `{ "title"?: "...", "done"?: bool}`| `200` + `Task`, or `404`/`400`    |
| DELETE   | `/tasks/:id`  | —                                  | `204`, or `404`                   |

## File map

| File                  | Role                                                      |
|-----------------------|-----------------------------------------------------------|
| `src/server.ts`       | Express app, route definitions, in-memory store           |
| `package.json`        | `npm run dev` runs the server with `tsx`                  |

## Why this layout

REST shines when the domain maps cleanly to resources and the standard HTTP methods cover what you need to do to them. Notice how each verb carries a specific semantic: `PUT` replaces the entire resource (you must send all fields), while `PATCH` updates only the fields you include. In a production codebase you'd split routes into routers, push storage behind a repository, add OpenAPI for the contract, and version the URL (`/v1/tasks`) — but the core idea is what you see here: **URL = resource, verb = operation, status code = outcome**.
