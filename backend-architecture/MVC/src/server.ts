import express from "express";
import { TaskModel } from "./models/task.model.js";
import { TaskController } from "./controllers/task.controller.js";

const app = express();
app.use(express.urlencoded({ extended: false }));

const model = new TaskModel();
const controller = new TaskController(model);

app.get("/", (_req, res) => res.redirect(303, "/tasks"));
app.get("/tasks", controller.list);
app.post("/tasks", controller.create);

const port = 3000;
app.listen(port, () => {
  console.log(`MVC demo listening on http://localhost:${port}`);
});
