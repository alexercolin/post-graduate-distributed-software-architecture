import express from "express";
import { createHandler } from "graphql-http/lib/use/express";
import { ruruHTML } from "ruru/server";
import { schema } from "./schema.js";

type Task = { id: number; title: string; done: boolean };

const tasks: Task[] = [];
let nextId = 1;

const root = {
  tasks: () => tasks,
  createTask: ({ title }: { title: string }) => {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      throw new Error("Title required");
    }
    const task: Task = { id: nextId++, title: trimmed, done: false };
    tasks.push(task);
    return task;
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
