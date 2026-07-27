// Streaming producer: publishes one OrderPlaced event roughly every second to
// the Kafka topic `orders.placed`. This models a live storefront where orders
// arrive continuously — the source of a real-time pipeline.
import { Kafka } from "kafkajs";
import { generateOrder, orderTotal } from "../shared/orders.js";

const TOPIC = "orders.placed";
const INTERVAL_MS = 1000;

const kafka = new Kafka({ clientId: "orders-producer", brokers: ["localhost:9092"] });
const producer = kafka.producer();

let running = true;

/** Create the topic if it doesn't exist yet (idempotent). */
async function ensureTopic() {
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({ topics: [{ topic: TOPIC, numPartitions: 1 }] });
  await admin.disconnect();
}

async function main() {
  await ensureTopic();
  await producer.connect();
  console.log(`[producer] connected — emitting to "${TOPIC}" every ${INTERVAL_MS}ms (Ctrl-C to stop)`);

  while (running) {
    const order = generateOrder();
    await producer.send({
      topic: TOPIC,
      // Keying by order_id keeps a single order on one partition (ordering).
      messages: [{ key: order.order_id, value: JSON.stringify(order) }],
    });
    console.log(
      `[producer] → ${order.order_id}  ${order.items.length} item(s)  $${orderTotal(order).toFixed(2)}  @ ${order.placed_at}`,
    );
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

async function shutdown() {
  running = false;
  await producer.disconnect();
  console.log("\n[producer] disconnected");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((err) => {
  console.error("[producer] fatal", err);
  process.exit(1);
});
