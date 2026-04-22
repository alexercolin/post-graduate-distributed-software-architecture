import type { Task } from "../models/task.model.js";

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderTaskList(tasks: Task[]): string {
  const items = tasks.length
    ? tasks.map((t) => `<li>#${t.id} — ${escape(t.title)}</li>`).join("")
    : `<li><em>No tasks yet.</em></li>`;

  return `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>MVC Tasks</title></head>
  <body>
    <h1>Tasks</h1>
    <ul>${items}</ul>
    <form method="post" action="/tasks">
      <input name="title" placeholder="New task" autofocus>
      <button type="submit">Add</button>
    </form>
  </body>
</html>`;
}

export function renderError(message: string): string {
  return `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Error</title></head>
  <body>
    <h1>Error</h1>
    <p>${escape(message)}</p>
    <p><a href="/tasks">Back</a></p>
  </body>
</html>`;
}
