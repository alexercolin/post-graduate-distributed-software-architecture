import express from "express";

type Task = { id: number; title: string; done: boolean };

const tasks: Task[] = [];
let nextId = 1;

const methods: Record<string, (params: any) => unknown> = {
  "tasks.list": () => tasks,
  "tasks.create": (params: { title?: string }) => {
    const title = (params?.title ?? "").trim();
    if (title.length === 0) {
      // Thrown errors are caught below and returned in the JSON-RPC error envelope.
      throw new RpcError(-32602, "Invalid params: title required");
    }
    const task: Task = { id: nextId++, title, done: false };
    tasks.push(task);
    return task;
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
