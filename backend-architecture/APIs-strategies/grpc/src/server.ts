import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

type Task = { id: number; title: string; done: boolean };

const tasks: Task[] = [];
let nextId = 1;

const __dirname = dirname(fileURLToPath(import.meta.url));
const protoPath = resolve(__dirname, "tasks.proto");

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition) as any;

const handlers = {
  ListTasks: (
    _call: grpc.ServerUnaryCall<unknown, { tasks: Task[] }>,
    callback: grpc.sendUnaryData<{ tasks: Task[] }>
  ) => {
    callback(null, { tasks });
  },

  CreateTask: (
    call: grpc.ServerUnaryCall<{ title: string }, Task>,
    callback: grpc.sendUnaryData<Task>
  ) => {
    const title = (call.request.title ?? "").trim();
    if (title.length === 0) {
      callback({ code: grpc.status.INVALID_ARGUMENT, message: "Title required" });
      return;
    }
    const task: Task = { id: nextId++, title, done: false };
    tasks.push(task);
    callback(null, task);
  },
};

const server = new grpc.Server();
server.addService(proto.tasks.TaskService.service, handlers);

const port = 50051;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`gRPC demo listening on 0.0.0.0:${port}`);
});
