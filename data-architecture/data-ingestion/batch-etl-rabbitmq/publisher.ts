// Batch publisher: models a scheduled job (e.g. a nightly export) that hands a
// whole batch of orders to a worker queue in one run, then exits. Contrast with
// the Kafka producer, which runs forever emitting one event at a time.
import amqp from "amqplib";
import { generateOrder, type OrderPlaced } from "../shared/orders.js";

const QUEUE = "orders.batch";
const BATCH_SIZE = 200;
// Sprinkle in a few malformed records so the worker's TRANSFORM step has
// something to validate and drop — real batch files are never perfectly clean.
const BAD_RATE = 0.05;

function maybeCorrupt(order: OrderPlaced): unknown {
  if (Math.random() >= BAD_RATE) return order;
  // Return an order with an empty/invalid line — the worker must reject it.
  return { ...order, items: [{ sku: "BROKEN", qty: 0, unit_price: -1 }] };
}

async function main() {
  const conn = await amqp.connect("amqp://guest:guest@localhost:5672");
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE, { durable: true });

  for (let i = 0; i < BATCH_SIZE; i++) {
    const record = maybeCorrupt(generateOrder());
    ch.sendToQueue(QUEUE, Buffer.from(JSON.stringify(record)), { persistent: true });
  }

  await ch.close();
  await conn.close();
  console.log(`[publisher] published a batch of ${BATCH_SIZE} orders to "${QUEUE}" and exited`);
}

main().catch((err) => {
  console.error("[publisher] fatal", err);
  process.exit(1);
});
