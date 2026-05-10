import express from "express";

type Task = { id: number; title: string; done: boolean };

const tasks: Task[] = [];
let nextId = 1;

const app = express();
app.use(express.json());

app.get("/tasks", (_req, res) => {
  res.json(tasks);
});

app.get("/tasks/:id", (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

app.post("/tasks", (req, res) => {
  const title = String(req.body?.title ?? "").trim();
  if (title.length === 0) {
    return res.status(400).json({ error: "Title required" });
  }
  const task: Task = { id: nextId++, title, done: false };
  tasks.push(task);
  res.status(201).json(task);
});

app.put("/tasks/:id", (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: "Task not found" });
  const title = String(req.body?.title ?? "").trim();
  if (title.length === 0) return res.status(400).json({ error: "Title required" });
  task.title = title;
  task.done = Boolean(req.body?.done ?? false);
  res.json(task);
});

app.patch("/tasks/:id", (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: "Task not found" });
  if (req.body?.title !== undefined) {
    const title = String(req.body.title).trim();
    if (title.length === 0) return res.status(400).json({ error: "Title required" });
    task.title = title;
  }
  if (req.body?.done !== undefined) task.done = Boolean(req.body.done);
  res.json(task);
});

app.delete("/tasks/:id", (req, res) => {
  const idx = tasks.findIndex((t) => t.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Task not found" });
  tasks.splice(idx, 1);
  res.status(204).end();
});

const port = 3000;
app.listen(port, () => {
  console.log(`REST demo listening on http://localhost:${port}`);
});
