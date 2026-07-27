// Batch worker (the "ETL" worker).
//
// Pulls records off the RabbitMQ queue, but unlike the Kafka consumer it does
// real work BEFORE touching the database:
//   1. TRANSFORM in TypeScript — validate, drop bad records, compute revenue,
//      aggregate by (sale_date, sku).
//   2. LOAD only the clean, aggregated rows into rabbitmq_sales_daily.
// Extract → Transform → Load. The warehouse never sees a raw or invalid row.
//
// It buffers messages and flushes in bursts (every FLUSH_SIZE messages, or after
// a short idle gap), so loads happen in batches rather than row-by-row.
import amqp from "amqplib";
import { pool } from "../shared/db.js";
import type { OrderPlaced } from "../shared/orders.js";

const QUEUE = "orders.batch";
const PREFETCH = 100;   // how many unacked messages the broker will hand us
const FLUSH_SIZE = 50;  // flush once this many records are buffered
const IDLE_MS = 800;    // ...or this long after the last message arrives

type Buffered = { msg: amqp.Message; order: OrderPlaced };

// --- TRANSFORM helpers -------------------------------------------------------

/** Reject anything we wouldn't want in the warehouse. */
function isValid(o: OrderPlaced): boolean {
  return (
    Array.isArray(o.items) &&
    o.items.length > 0 &&
    o.items.every((i) => i.qty > 0 && i.unit_price > 0)
  );
}

/** Aggregate a batch of orders into (sale_date, sku) → {units, revenue}. */
function aggregate(orders: OrderPlaced[]): Map<string, { date: string; sku: string; units: number; revenue: number }> {
  const out = new Map<string, { date: string; sku: string; units: number; revenue: number }>();
  for (const o of orders) {
    const date = o.placed_at.slice(0, 10); // YYYY-MM-DD
    for (const item of o.items) {
      const key = `${date}|${item.sku}`;
      const row = out.get(key) ?? { date, sku: item.sku, units: 0, revenue: 0 };
      row.units += item.qty;
      row.revenue += item.qty * item.unit_price;
      out.set(key, row);
    }
  }
  return out;
}

// --- LOAD --------------------------------------------------------------------

async function loadAggregates(
  rows: Array<{ date: string; sku: string; units: number; revenue: number }>,
): Promise<void> {
  if (rows.length === 0) return;
  const values: string[] = [];
  const params: unknown[] = [];
  rows.forEach((r, i) => {
    const b = i * 4;
    values.push(`($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4})`);
    params.push(r.date, r.sku, r.units, r.revenue);
  });
  // Accumulate across flushes/batches into the same day+SKU totals.
  await pool.query(
    `INSERT INTO rabbitmq_sales_daily (sale_date, sku, units, revenue)
     VALUES ${values.join(", ")}
     ON CONFLICT (sale_date, sku) DO UPDATE
       SET units   = rabbitmq_sales_daily.units   + EXCLUDED.units,
           revenue = rabbitmq_sales_daily.revenue + EXCLUDED.revenue,
           loaded_at = now()`,
    params,
  );
}

// --- pump --------------------------------------------------------------------

async function main() {
  const conn = await amqp.connect("amqp://guest:guest@localhost:5672");
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE, { durable: true });
  await ch.prefetch(PREFETCH);
  console.log(`[worker] connected — draining "${QUEUE}" in batches (Ctrl-C to stop)`);

  let buffer: Buffered[] = [];
  let dropped = 0;
  let idleTimer: NodeJS.Timeout | null = null;

  async function flush() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    if (buffer.length === 0) return;

    const batch = buffer;
    buffer = [];

    const orders = batch.map((b) => b.order);
    const aggregated = [...aggregate(orders).values()];
    await loadAggregates(aggregated);

    // Ack the whole batch only after a successful load.
    for (const b of batch) ch.ack(b.msg);
    console.log(
      `[worker] ⇊ loaded batch: ${orders.length} valid orders → ${aggregated.length} (day,sku) rows` +
        (dropped ? `  (${dropped} bad records dropped so far)` : ""),
    );
  }

  ch.consume(QUEUE, (msg) => {
    if (!msg) return;
    const parsed = JSON.parse(msg.content.toString()) as OrderPlaced;

    if (!isValid(parsed)) {
      dropped++;
      ch.ack(msg); // remove the bad record from the queue; never reaches the DB
      return;
    }

    buffer.push({ msg, order: parsed });

    if (buffer.length >= FLUSH_SIZE) {
      void flush();
    } else {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => void flush(), IDLE_MS);
    }
  });

  async function shutdown() {
    await flush();
    await ch.close();
    await conn.close();
    await pool.end();
    console.log("\n[worker] disconnected");
    process.exit(0);
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[worker] fatal", err);
  process.exit(1);
});
