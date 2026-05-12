import * as grpc from "@grpc/grpc-js";
import {
  TaskServiceService,
  type TaskServiceServer,
  type Assignee,
} from "./generated/tasks.js";

type StoredTask = { id: number; title: string; done: boolean; assignee: Assignee | undefined };

const tasks: StoredTask[] = [];
let nextId = 1;

const handlers: TaskServiceServer = {
  listTasks(_call, callback) {
    callback(null, { tasks });
  },

  getTask(call, callback) {
    const task = tasks.find((t) => t.id === call.request.id);
    if (!task) {
      callback({ code: grpc.status.NOT_FOUND, message: "Task not found" });
      return;
    }
    callback(null, task);
  },

  createTask(call, callback) {
    const title = (call.request.title ?? "").trim();
    if (title.length === 0) {
      callback({ code: grpc.status.INVALID_ARGUMENT, message: "Title required" });
      return;
    }
    const task: StoredTask = {
      id: nextId++,
      title,
      done: false,
      assignee: call.request.assignee,
    };
    tasks.push(task);
    callback(null, task);
  },

  updateTask(call, callback) {
    const task = tasks.find((t) => t.id === call.request.id);
    if (!task) {
      callback({ code: grpc.status.NOT_FOUND, message: "Task not found" });
      return;
    }
    const title = (call.request.title ?? "").trim();
    if (title.length === 0) {
      callback({ code: grpc.status.INVALID_ARGUMENT, message: "Title required" });
      return;
    }
    task.title = title;
    task.done = call.request.done;
    task.assignee = call.request.assignee;
    callback(null, task);
  },

  patchTask(call, callback) {
    const task = tasks.find((t) => t.id === call.request.id);
    if (!task) {
      callback({ code: grpc.status.NOT_FOUND, message: "Task not found" });
      return;
    }
    if (call.request.title !== undefined && call.request.title !== "") {
      const title = call.request.title.trim();
      if (title.length === 0) {
        callback({ code: grpc.status.INVALID_ARGUMENT, message: "Title required" });
        return;
      }
      task.title = title;
    }
    if (call.request.done !== undefined) task.done = call.request.done;
    if (call.request.assignee !== undefined) task.assignee = call.request.assignee;
    callback(null, task);
  },

  deleteTask(call, callback) {
    const idx = tasks.findIndex((t) => t.id === call.request.id);
    if (idx === -1) {
      callback({ code: grpc.status.NOT_FOUND, message: "Task not found" });
      return;
    }
    tasks.splice(idx, 1);
    callback(null, { deleted: true });
  },
};

const server = new grpc.Server();
server.addService(TaskServiceService, handlers);

const port = 50051;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`gRPC server listening on 0.0.0.0:${port}`);
});
