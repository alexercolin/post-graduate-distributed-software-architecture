import express from "express";
import { TaskModel } from "./models/task.model.js";
import { TaskListViewModel } from "./viewmodels/task.viewmodel.js";
import { renderTaskList } from "./views/task.view.js";

const app = express();
app.use(express.urlencoded({ extended: false }));

const model = new TaskModel();

app.get("/", (_req, res) => res.redirect(303, "/tasks"));

app.get("/tasks", (_req, res) => {
  const vm = new TaskListViewModel(model);
  res.type("html").send(renderTaskList(vm));
});

app.post("/tasks", (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title : "";
  const vm = new TaskListViewModel(model);
  vm.addTask(title);
  if (vm.errorMessage) {
    res.status(400).type("html").send(renderTaskList(vm));
    return;
  }
  res.redirect(303, "/tasks");
});

const port = 3000;
app.listen(port, () => {
  console.log(`MVVM demo listening on http://localhost:${port}`);
});
