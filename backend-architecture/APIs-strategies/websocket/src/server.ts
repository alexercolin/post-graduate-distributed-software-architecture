import express from "express";
import { createServer } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";

type Task = { id: number; title: string; done: boolean };
type ClientMessage =
  | { type: "list" }
  | { type: "create"; title: string };

const tasks: Task[] = [];
let nextId = 1;

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

const clients = new Set<WebSocket>();

function broadcast(message: object) {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === client.OPEN) client.send(payload);
  }
}

wss.on("connection", (socket) => {
  clients.add(socket);
  socket.send(JSON.stringify({ type: "snapshot", tasks }));

  socket.on("message", (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      socket.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }

    if (msg.type === "list") {
      socket.send(JSON.stringify({ type: "snapshot", tasks }));
      return;
    }

    if (msg.type === "create") {
      const title = (msg.title ?? "").trim();
      if (title.length === 0) {
        socket.send(JSON.stringify({ type: "error", message: "Title required" }));
        return;
      }
      const task: Task = { id: nextId++, title, done: false };
      tasks.push(task);
      // Server-initiated push: every connected client learns about the new task.
      broadcast({ type: "task_created", task });
      return;
    }
  });

  socket.on("close", () => clients.delete(socket));
});

const port = 3000;
httpServer.listen(port, () => {
  console.log(`WebSocket demo listening on ws://localhost:${port}/ws`);
});
