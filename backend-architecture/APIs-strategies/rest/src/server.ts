import express from "express";

type Task = { id: number; title: string; done: boolean };

const tasks: Task[] = [];
let nextId = 1;

const app = express();
app.use(express.json());

app.get("/tasks", (_req, res) => {
  res.json(tasks);
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

const port = 3000;
app.listen(port, () => {
  console.log(`REST demo listening on http://localhost:${port}`);
});
