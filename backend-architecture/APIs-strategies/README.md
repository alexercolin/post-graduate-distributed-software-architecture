# API Strategies — Five Ways to Expose the Same Domain

Five minimal Node.js + TypeScript demos, each solving the **same trivial problem** — full CRUD on `Task { id, title, done }` items in an in-memory store — using a different API strategy. Every demo supports list, get-by-id, create, full update, partial update, and delete. The shared domain is deliberate: the *only* thing that changes between folders is the API style.

| Folder        | Strategy        | Endpoint                          | Best for                                       |
|---------------|-----------------|-----------------------------------|------------------------------------------------|
| [`rest/`](./rest)           | REST            | `http://localhost:3000/tasks`     | Public APIs, resource-shaped domains, caching  |
| [`graphql/`](./graphql)     | GraphQL         | `http://localhost:3000/graphql`   | Multiple clients wanting different field sets  |
| [`grpc/`](./grpc)           | gRPC            | `0.0.0.0:50051` (HTTP/2)          | Internal service-to-service, polyglot, perf    |
| [`rpc/`](./rpc)             | JSON-RPC 2.0    | `http://localhost:3000/rpc`       | Verb-shaped domains, simple one-endpoint APIs  |
| [`websocket/`](./websocket) | WebSocket       | `ws://localhost:3000/ws`          | Server push, real-time, bidirectional flows    |

## How to read these demos

Each folder is self-contained:

```bash
cd <folder>
npm install
npm run dev
```

Each `README.md` follows the same structure: what the strategy emphasizes, a request-flow diagram, how to run it, the contract (endpoints / methods / schema), the file map, and *why* this layout is what production looks like.

## At-a-glance contrast

| Dimension          | REST       | GraphQL          | gRPC             | JSON-RPC          | WebSocket           |
|--------------------|------------|------------------|------------------|-------------------|---------------------|
| Transport          | HTTP/1.1+  | HTTP/1.1+        | HTTP/2           | HTTP (any)        | WS (over HTTP)      |
| Encoding           | JSON       | JSON             | Protobuf (binary)| JSON              | JSON / binary frames|
| Endpoints          | Many (URL) | One (`/graphql`) | One service, N methods | One (`/rpc`) | One (`/ws`)         |
| Contract           | Convention / OpenAPI | SDL schema | `.proto`        | None / docs      | None / docs         |
| Direction          | Client → server | Client → server | Client → server (+streaming) | Client → server | **Both**            |
| Status semantics   | HTTP codes | Always `200` + `errors` | gRPC status codes | Numeric error codes | App-defined messages |
| Strongest when     | Resource CRUD | Selective fields, many clients | Internal RPC | Method dispatch | Real-time push      |
