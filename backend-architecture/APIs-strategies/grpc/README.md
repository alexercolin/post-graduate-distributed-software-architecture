# gRPC — Minimal TypeScript Example

A tiny Task-list service that demonstrates the **gRPC** API strategy: a contract-first RPC framework using Protocol Buffers as the schema and HTTP/2 as the transport.

## What gRPC emphasizes

- **Contract-first.** The `.proto` file is the single source of truth — every client and server in every language is generated from it.
- **Strong typing across the wire.** Messages are typed, fields are numbered, and unknown fields are skipped — making forward/backward compatibility a first-class concern.
- **Binary, not JSON.** Protobuf encoding is compact and fast; HTTP/2 multiplexes many calls over one connection.
- **Streaming built in.** Beyond unary calls (used here), gRPC supports server-streaming, client-streaming, and bidirectional streaming on the same primitive.

## Request flow

```
  Client                              Server
    │                                   │
    │  TaskService.ListTasks({})        │
    │  ─── HTTP/2 + protobuf ─────────► │
    │                                   │  decode → handler → encode
    │  ListTasksResponse{ tasks: [...]} │
    │  ◄─────────────────────────────── │
```

## Run it

```bash
npm install
npm run dev
```

The gRPC server listens on `0.0.0.0:50051` (insecure credentials — TLS would be added in production).

A real client would generate stubs from `src/tasks.proto`. For an ad-hoc poke, [`grpcurl`](https://github.com/fullstorydev/grpcurl) is the typical equivalent of `curl` for gRPC.

## The contract (`src/tasks.proto`)

```proto
service TaskService {
  rpc ListTasks  (ListTasksRequest)  returns (ListTasksResponse);
  rpc CreateTask (CreateTaskRequest) returns (Task);
}

message Task {
  int32  id    = 1;
  string title = 2;
  bool   done  = 3;
}
```

## File map

| File                | Role                                                              |
|---------------------|-------------------------------------------------------------------|
| `src/tasks.proto`   | The contract: service, methods, message shapes, field numbers     |
| `src/server.ts`     | Loads the proto at runtime, wires handlers, starts the gRPC server |

## Why this layout

gRPC dominates internal service-to-service traffic in polyglot environments: the `.proto` ensures a Go service and a TypeScript service stay in lockstep without anyone hand-writing a JSON contract. In a production codebase you'd codegen typed stubs at build time (instead of `proto-loader` at runtime), turn on TLS, and add interceptors for auth/tracing — but the core idea is what you see here: **the proto is the API; everything else is generated or wired around it**.
