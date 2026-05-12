import * as grpc from "@grpc/grpc-js";
import { TaskServiceClient, type ListTasksResponse } from "./generated/tasks.js";
import type { ServiceError } from "@grpc/grpc-js";

const client = new TaskServiceClient(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

function promisify<TReq, TRes>(
  method: (req: TReq, cb: (err: ServiceError | null, res: TRes) => void) => void,
  request: TReq
): Promise<TRes> {
  return new Promise((resolve, reject) => {
    method.call(client, request, (err: ServiceError | null, res: TRes) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

async function main() {
  console.log("--- CreateTask (com assignee) ---");
  const created = await promisify(client.createTask, {
    title: "Estudar gRPC",
    assignee: { id: 1, name: "Alex", email: "alex@example.com" },
  });
  console.log(created);

  console.log("\n--- CreateTask (sem assignee) ---");
  const created2 = await promisify(client.createTask, {
    title: "Revisar PR",
    assignee: undefined,
  });
  console.log(created2);

  console.log("\n--- ListTasks ---");
  const list = await promisify<{}, ListTasksResponse>(client.listTasks, {});
  console.log(list.tasks);

  console.log("\n--- GetTask (id=1) ---");
  const fetched = await promisify(client.getTask, { id: 1 });
  console.log(fetched);

  console.log("\n--- UpdateTask (id=1) ---");
  const updated = await promisify(client.updateTask, {
    id: 1,
    title: "Estudar gRPC (feito)",
    done: true,
    assignee: { id: 2, name: "Maria", email: "maria@example.com" },
  });
  console.log(updated);

  console.log("\n--- PatchTask (id=2, apenas done) ---");
  const patched = await promisify(client.patchTask, {
    id: 2,
    done: true,
  });
  console.log(patched);

  console.log("\n--- DeleteTask (id=2) ---");
  const deleted = await promisify(client.deleteTask, { id: 2 });
  console.log(deleted);

  console.log("\n--- ListTasks (final) ---");
  const finalList = await promisify<{}, ListTasksResponse>(client.listTasks, {});
  console.log(finalList.tasks);

  client.close();
}

main().catch(console.error);
