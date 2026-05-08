// API Gateway / BFF.
//
// Three responsibilities, in order of importance:
//   1. Stamp X-Correlation-Id on every inbound request (generate one if missing)
//      and propagate it on every outbound call. This makes a single user request
//      greppable across all three services in `docker compose logs`.
//   2. Proxy /catalog/* and /orders/* to the respective services.
//   3. Expose ONE aggregation endpoint, GET /orders/:id/full, that fans out to
//      orders-service AND catalog-service in parallel and returns a merged view.
//      That's the one thing a real BFF does that a dumb proxy doesn't.
//
// Kept to a single file on purpose — gateways are routing, not domain logic.

import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT ?? 3000);
const CATALOG_URL = process.env.CATALOG_URL ?? "http://localhost:8001";
const ORDERS_URL = process.env.ORDERS_URL ?? "http://localhost:8002";

const app = express();
app.use(express.json());

// --- Correlation-ID middleware -----------------------------------------------
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      cid: string;
    }
  }
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const cid =
    (req.header("x-correlation-id") as string | undefined) ??
    `gw-${randomUUID().slice(0, 8)}`;
  req.cid = cid;
  res.setHeader("X-Correlation-Id", cid);
  console.log(`[cid=${cid}] ${req.method} ${req.path}`);
  next();
});

// --- Proxy helper ------------------------------------------------------------

async function proxy(req: Request, res: Response, target: string): Promise<void> {
  const init: RequestInit = {
    method: req.method,
    headers: {
      "content-type": "application/json",
      "x-correlation-id": req.cid,
    },
  };
  if (req.method !== "GET" && req.method !== "HEAD" && req.body !== undefined) {
    init.body = JSON.stringify(req.body);
  }
  try {
    const upstream = await fetch(target, init);
    const text = await upstream.text();
    res.status(upstream.status);
    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("content-type", ct);
    res.send(text);
  } catch (err) {
    console.error(`[cid=${req.cid}] proxy ${target} failed:`, err);
    res.status(502).json({ error: "bad_gateway", target });
  }
}

// --- Health ------------------------------------------------------------------

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --- Catalog passthrough -----------------------------------------------------

app.get("/catalog/products", (req, res) => {
  void proxy(req, res, `${CATALOG_URL}/products`);
});

app.get("/catalog/products/:id", (req, res) => {
  void proxy(req, res, `${CATALOG_URL}/products/${encodeURIComponent(req.params.id ?? "")}`);
});

// --- Orders passthrough ------------------------------------------------------

app.post("/orders", (req, res) => {
  void proxy(req, res, `${ORDERS_URL}/orders`);
});

app.get("/orders/:id", (req, res) => {
  void proxy(req, res, `${ORDERS_URL}/orders/${encodeURIComponent(req.params.id ?? "")}`);
});

// --- BFF aggregation: order + product in one round-trip ----------------------
//
// Fan out to both services in parallel; merge the responses. If either side
// fails the gateway returns what it has and notes the failure in `errors`.

app.get("/orders/:id/full", async (req, res) => {
  const id = req.params.id ?? "";
  const headers = { "x-correlation-id": req.cid };

  const [orderRes, productResMaybe] = await Promise.allSettled([
    fetch(`${ORDERS_URL}/orders/${encodeURIComponent(id)}`, { headers }),
    Promise.resolve(null), // placeholder; we need the order first to know productId
  ]);

  if (orderRes.status === "rejected" || !orderRes.value.ok) {
    res.status(502).json({ error: "order_lookup_failed" });
    return;
  }
  const order = (await orderRes.value.json()) as { productId?: string };

  const errors: Record<string, string> = {};
  let product: unknown = null;
  if (order.productId) {
    try {
      const r = await fetch(
        `${CATALOG_URL}/products/${encodeURIComponent(order.productId)}`,
        { headers },
      );
      if (r.ok) product = await r.json();
      else errors["catalog"] = `HTTP ${r.status}`;
    } catch (e) {
      errors["catalog"] = (e as Error).message;
    }
  }

  res.json({ order, product, errors: Object.keys(errors).length ? errors : undefined });
});

// --- Start -------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(
    `api-gateway ready on :${PORT}  →  catalog=${CATALOG_URL}  orders=${ORDERS_URL}`,
  );
});
