export type Task = {
  id: number;
  title: string;
  done: boolean;
};

export class TaskModel {
  private tasks: Task[] = [];
  private nextId = 1;

  getAll(): Task[] {
    return this.tasks;
  }

  add(title: string): Task {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      throw new EmptyTitleError();
    }
    const task: Task = { id: this.nextId++, title: trimmed, done: false };
    this.tasks.push(task);
    return task;
  }
}

export class EmptyTitleError extends Error {
  constructor() {
    super("Task title must not be empty");
    this.name = "EmptyTitleError";
  }
}
