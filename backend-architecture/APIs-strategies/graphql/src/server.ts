import express from "express";
import { createHandler } from "graphql-http/lib/use/express";
import { ruruHTML } from "ruru/server";
import { schema } from "./schema.js";

type Task = { id: number; title: string; done: boolean };

const tasks: Task[] = [];
let nextId = 1;

const root = {
  tasks: () => tasks,

  task: ({ id }: { id: number }) => tasks.find((t) => t.id === id) ?? null,

  createTask: ({ title }: { title: string }) => {
    const trimmed = title.trim();
    if (trimmed.length === 0) throw new Error("Title required");
    const task: Task = { id: nextId++, title: trimmed, done: false };
    tasks.push(task);
    return task;
  },

  updateTask: ({ id, title, done }: { id: number; title: string; done: boolean }) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;
    const trimmed = title.trim();
    if (trimmed.length === 0) throw new Error("Title required");
    task.title = trimmed;
    task.done = done;
    return task;
  },

  patchTask: ({ id, title, done }: { id: number; title?: string; done?: boolean }) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;
    if (title !== undefined) {
      const trimmed = title.trim();
      if (trimmed.length === 0) throw new Error("Title required");
      task.title = trimmed;
    }
    if (done !== undefined) task.done = done;
    return task;
  },

  deleteTask: ({ id }: { id: number }) => {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    tasks.splice(idx, 1);
    return true;
  },
};

const app = express();
app.all("/graphql", createHandler({ schema, rootValue: root }));
app.get("/", (_req, res) => res.type("html").send(ruruHTML({ endpoint: "/graphql" })));

const port = 3000;
app.listen(port, () => {
  console.log(`GraphQL demo listening on http://localhost:${port}/graphql`);
  console.log(`Open http://localhost:${port}/ for the in-browser GraphQL IDE`);
});
