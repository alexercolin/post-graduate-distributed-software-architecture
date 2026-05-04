# WebSocket — Minimal TypeScript Example

A tiny Task-list server that demonstrates the **WebSocket** API strategy: a persistent, bidirectional connection where the server can push to the client without being asked.

## What WebSocket emphasizes

- **Persistent connection.** A single TCP/TLS connection stays open for the life of the session. No polling, no reconnect-per-message.
- **Bidirectional.** Either side can send at any time. The server pushes; it doesn't wait for a request.
- **Message-based, not request/response.** You define your own message *types* (`list`, `create`, `task_created`, `error`) — there's no `200`/`404`, no `GET`/`POST`.
- **Stateful by nature.** The server tracks which clients are connected so it can fan out updates (here: `broadcast`).

## Request / event flow

```
  Client A         Server                  Client B
    │                │                        │
    │  open ws ────► │ ◄──── open ws          │
    │                │                        │
    │ ◄ snapshot     │      snapshot ───────► │   (initial state push)
    │                │                        │
    │  create ─────► │                        │
    │                │  push task_created     │
    │ ◄────────────  │  ──────────────────►   │   (server-initiated fan-out)
```

## Run it

```bash
npm install
npm run dev
```

The WebSocket endpoint is `ws://localhost:3000/ws`.

## Message protocol

Client → Server:
```json
{ "type": "list" }
{ "type": "create", "title": "Buy milk" }
```

Server → Client:
```json
{ "type": "snapshot",     "tasks": [ ... ] }
{ "type": "task_created", "task":  { "id": 1, "title": "Buy milk", "done": false } }
{ "type": "error",        "message": "Title required" }
```

## File map

| File              | Role                                                            |
|-------------------|-----------------------------------------------------------------|
| `src/server.ts`   | Express + `ws` upgrade on `/ws`, message router, broadcast loop |

## Why this layout

WebSocket is the right tool when the *server* needs to tell the *client* something happened — chat messages, live prices, collaborative document edits, multiplayer game state. With REST you'd be polling. In a production codebase you'd add heartbeats / ping-pong, per-connection auth at the upgrade step, room-based fan-out instead of a global `clients` set, and a higher-level protocol on top (Socket.IO, Phoenix Channels, GraphQL Subscriptions) — but the core idea is what you see here: **persistent connection, message types, server-initiated pushes**.
