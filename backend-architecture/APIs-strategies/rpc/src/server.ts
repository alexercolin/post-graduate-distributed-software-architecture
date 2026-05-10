import express from "express";

type Task = { id: number; title: string; done: boolean };

const tasks: Task[] = [];
let nextId = 1;

const methods: Record<string, (params: any) => unknown> = {
  "tasks.list": () => tasks,

  "tasks.get": (params: { id?: number }) => {
    const task = tasks.find((t) => t.id === params?.id);
    if (!task) throw new RpcError(-32602, "Invalid params: task not found");
    return task;
  },

  "tasks.create": (params: { title?: string }) => {
    const title = (params?.title ?? "").trim();
    if (title.length === 0) throw new RpcError(-32602, "Invalid params: title required");
    const task: Task = { id: nextId++, title, done: false };
    tasks.push(task);
    return task;
  },

  "tasks.update": (params: { id?: number; title?: string; done?: boolean }) => {
    const task = tasks.find((t) => t.id === params?.id);
    if (!task) throw new RpcError(-32602, "Invalid params: task not found");
    const title = (params?.title ?? "").trim();
    if (title.length === 0) throw new RpcError(-32602, "Invalid params: title required");
    task.title = title;
    task.done = Boolean(params?.done ?? false);
    return task;
  },

  "tasks.patch": (params: { id?: number; title?: string; done?: boolean }) => {
    const task = tasks.find((t) => t.id === params?.id);
    if (!task) throw new RpcError(-32602, "Invalid params: task not found");
    if (params?.title !== undefined) {
      const title = params.title.trim();
      if (title.length === 0) throw new RpcError(-32602, "Invalid params: title required");
      task.title = title;
    }
    if (params?.done !== undefined) task.done = Boolean(params.done);
    return task;
  },

  "tasks.delete": (params: { id?: number }) => {
    const idx = tasks.findIndex((t) => t.id === params?.id);
    if (idx === -1) throw new RpcError(-32602, "Invalid params: task not found");
    tasks.splice(idx, 1);
    return { deleted: true };
  },
};

class RpcError extends Error {
  constructor(public code: number, message: string) {
    super(message);
  }
}

const app = express();
app.use(express.json());

app.post("/rpc", (req, res) => {
  const { jsonrpc, method, params, id } = req.body ?? {};

  // JSON-RPC 2.0 requires this exact envelope shape on every request.
  if (jsonrpc !== "2.0" || typeof method !== "string") {
    return res.json({ jsonrpc: "2.0", error: { code: -32600, message: "Invalid Request" }, id: id ?? null });
  }

  const fn = methods[method];
  if (!fn) {
    return res.json({ jsonrpc: "2.0", error: { code: -32601, message: "Method not found" }, id: id ?? null });
  }

  try {
    const result = fn(params);
    res.json({ jsonrpc: "2.0", result, id: id ?? null });
  } catch (err) {
    const code = err instanceof RpcError ? err.code : -32000;
    const message = err instanceof Error ? err.message : "Server error";
    res.json({ jsonrpc: "2.0", error: { code, message }, id: id ?? null });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`JSON-RPC demo listening on http://localhost:${port}/rpc`);
});
