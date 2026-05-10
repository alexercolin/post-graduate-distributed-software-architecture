import express from "express";
import { createServer } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";

type Task = { id: number; title: string; done: boolean };
type ClientMessage =
  | { type: "list" }
  | { type: "get"; id: number }
  | { type: "create"; title: string }
  | { type: "update"; id: number; title: string; done: boolean }
  | { type: "patch"; id: number; title?: string; done?: boolean }
  | { type: "delete"; id: number };

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

    if (msg.type === "get") {
      const task = tasks.find((t) => t.id === msg.id);
      if (!task) {
        socket.send(JSON.stringify({ type: "error", message: "Task not found" }));
        return;
      }
      socket.send(JSON.stringify({ type: "task", task }));
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
      broadcast({ type: "task_created", task });
      return;
    }

    if (msg.type === "update") {
      const task = tasks.find((t) => t.id === msg.id);
      if (!task) {
        socket.send(JSON.stringify({ type: "error", message: "Task not found" }));
        return;
      }
      const title = (msg.title ?? "").trim();
      if (title.length === 0) {
        socket.send(JSON.stringify({ type: "error", message: "Title required" }));
        return;
      }
      task.title = title;
      task.done = Boolean(msg.done);
      broadcast({ type: "task_updated", task });
      return;
    }

    if (msg.type === "patch") {
      const task = tasks.find((t) => t.id === msg.id);
      if (!task) {
        socket.send(JSON.stringify({ type: "error", message: "Task not found" }));
        return;
      }
      if (msg.title !== undefined) {
        const title = msg.title.trim();
        if (title.length === 0) {
          socket.send(JSON.stringify({ type: "error", message: "Title required" }));
          return;
        }
        task.title = title;
      }
      if (msg.done !== undefined) task.done = Boolean(msg.done);
      broadcast({ type: "task_updated", task });
      return;
    }

    if (msg.type === "delete") {
      const idx = tasks.findIndex((t) => t.id === msg.id);
      if (idx === -1) {
        socket.send(JSON.stringify({ type: "error", message: "Task not found" }));
        return;
      }
      tasks.splice(idx, 1);
      broadcast({ type: "task_deleted", id: msg.id });
      return;
    }
  });

  socket.on("close", () => clients.delete(socket));
});

const port = 3000;
httpServer.listen(port, () => {
  console.log(`WebSocket demo listening on ws://localhost:${port}/ws`);
});
