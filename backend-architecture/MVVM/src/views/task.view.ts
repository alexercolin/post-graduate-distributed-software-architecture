import type { TaskListViewModel } from "../viewmodels/task.viewmodel.js";

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderTaskList(vm: TaskListViewModel): string {
  const items = vm.isEmpty
    ? `<li><em>No tasks yet.</em></li>`
    : vm.items.map((i) => `<li>${escape(i.label)}</li>`).join("");

  const errorBanner = vm.errorMessage
    ? `<p style="color:crimson">${escape(vm.errorMessage)}</p>`
    : "";

  return `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>MVVM Tasks</title></head>
  <body>
    <h1>Tasks</h1>
    ${errorBanner}
    <ul>${items}</ul>
    <form method="post" action="/tasks">
      <input name="title" placeholder="New task" autofocus>
      <button type="submit">Add</button>
    </form>
  </body>
</html>`;
}
