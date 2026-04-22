import { TaskModel, EmptyTitleError } from "../models/task.model.js";

export type TaskListItem = {
  id: number;
  label: string;
};

export class TaskListViewModel {
  private error: string | null = null;

  constructor(private readonly model: TaskModel) {}

  get items(): TaskListItem[] {
    return this.model.getAll().map((t) => ({
      id: t.id,
      label: `#${t.id} — ${t.title}`,
    }));
  }

  get isEmpty(): boolean {
    return this.model.getAll().length === 0;
  }

  get errorMessage(): string | null {
    return this.error;
  }

  addTask(title: string): void {
    try {
      this.model.add(title);
      this.error = null;
    } catch (err) {
      if (err instanceof EmptyTitleError) {
        this.error = err.message;
        return;
      }
      throw err;
    }
  }
}
