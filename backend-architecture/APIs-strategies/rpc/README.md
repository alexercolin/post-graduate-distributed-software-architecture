# JSON-RPC 2.0 — Minimal TypeScript Example

A tiny Task-list server that demonstrates the **JSON-RPC 2.0** API strategy: a single endpoint that dispatches *named methods* against a fixed envelope, instead of mapping verbs to URLs like REST.

## What JSON-RPC emphasizes

- **Methods, not resources.** The contract is `tasks.list`, `tasks.get`, `tasks.create`, etc. — the URL is just a transport detail.
- **One endpoint, one envelope.** Every request is `POST /rpc` with `{ jsonrpc: "2.0", method, params, id }`. Every response is `{ jsonrpc: "2.0", result | error, id }`.
- **Transport-agnostic.** The same envelope works over HTTP, WebSocket, raw TCP, or stdio — only the body matters.
- **Standard error codes.** `-32600` Invalid Request, `-32601` Method not found, `-32602` Invalid params, `-32603` Internal, plus a free range for application errors.

## Request flow

```
  Client                                                       Server
    │                                                            │
    │  POST /rpc                                                 │
    │  { jsonrpc:"2.0", method:"tasks.create",                   │
    │    params:{title:"Buy milk"}, id:1 }                       │
    │ ─────────────────────────────────────────────────────────► │
    │                                                            │  dispatch by method name
    │  { jsonrpc:"2.0", result:{id:1,title:"Buy milk",...}, id:1}│
    │ ◄───────────────────────────────────────────────────────── │
```

## Run it

```bash
npm install
npm run dev
```

The server listens on `http://localhost:3000/rpc`.

## Methods

| Method          | Params                                    | Result             | Error                    |
|-----------------|-------------------------------------------|--------------------|--------------------------|
| `tasks.list`    | —                                         | `Task[]`           | —                        |
| `tasks.get`     | `{ id: number }`                          | `Task`             | `-32602` not found       |
| `tasks.create`  | `{ title: string }`                       | `Task`             | `-32602` on empty title  |
| `tasks.update`  | `{ id: number, title: string, done: bool }`| `Task`            | `-32602` not found/empty |
| `tasks.patch`   | `{ id: number, title?: string, done?: bool }`| `Task`          | `-32602` not found/empty |
| `tasks.delete`  | `{ id: number }`                          | `{ deleted: true }`| `-32602` not found       |

## Sample request / response

Request:
```json
{ "jsonrpc": "2.0", "method": "tasks.create", "params": { "title": "Buy milk" }, "id": 1 }
```

Response:
```json
{ "jsonrpc": "2.0", "result": { "id": 1, "title": "Buy milk", "done": false }, "id": 1 }
```

## File map

| File              | Role                                                                |
|-------------------|---------------------------------------------------------------------|
| `src/server.ts`   | Single `POST /rpc` handler, method registry, error envelope mapping |

## Why this layout

JSON-RPC is the simplest "RPC over HTTP" you can ship: no schema language, no codegen, no protobuf — just a JSON envelope and a method registry. It's the natural fit when the domain is verb-shaped (`recalculatePricing`, `sendInvitation`) rather than resource-shaped, and it's the protocol behind tools like the Language Server Protocol and Ethereum's node API. In a production codebase you'd add input validation per method (Zod / JSON Schema), a method namespace boundary check for auth, batching support (`[req, req, req]` → `[res, res, res]`), and per-method rate limiting — but the core idea is what you see here: **one endpoint, one envelope, methods dispatched by name**.
