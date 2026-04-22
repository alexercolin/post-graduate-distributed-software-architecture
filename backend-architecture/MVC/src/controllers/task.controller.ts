import type { Request, Response } from "express";
import { TaskModel, EmptyTitleError } from "../models/task.model.js";
import { renderTaskList, renderError } from "../views/task.view.js";

export class TaskController {
  constructor(private readonly model: TaskModel) {}

  list = (_req: Request, res: Response): void => {
    const tasks = this.model.getAll();
    res.type("html").send(renderTaskList(tasks));
  };

  create = (req: Request, res: Response): void => {
    const title = typeof req.body?.title === "string" ? req.body.title : "";
    try {
      this.model.add(title);
      res.redirect(303, "/tasks");
    } catch (err) {
      if (err instanceof EmptyTitleError) {
        res.status(400).type("html").send(renderError(err.message));
        return;
      }
      throw err;
    }
  };
}
