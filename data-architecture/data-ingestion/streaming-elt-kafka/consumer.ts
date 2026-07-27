// Streaming consumer (the "EL" of ELT).
//
// It does the bare minimum: read each event off Kafka and LOAD it into the raw
// landing table EXACTLY as received — the payload goes in as JSONB, untouched.
// There is deliberately NO business logic here. All shaping/aggregation happens
// later, inside Postgres, via sql/elt_transform.sql. That separation is what
// makes this ELT rather than ETL.
import { Kafka } from "kafkajs";
import { pool } from "../shared/db.js";
import type { OrderPlaced } from "../shared/orders.js";

const TOPIC = "orders.placed";

const kafka = new Kafka({ clientId: "orders-loader", brokers: ["localhost:9092"] });
const consumer = kafka.consumer({ groupId: "kafka-elt-loader" });

/** Make sure the topic exists before subscribing (idempotent). */
async function ensureTopic() {
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({ topics: [{ topic: TOPIC, numPartitions: 1 }] });
  await admin.disconnect();
}

async function main() {
  await ensureTopic();
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
  console.log(`[consumer] connected — loading "${TOPIC}" into kafka_orders_raw (Ctrl-C to stop)`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const order = JSON.parse(message.value.toString()) as OrderPlaced;

      // Load raw. ON CONFLICT makes redelivery safe (idempotent by order_id).
      await pool.query(
        `INSERT INTO kafka_orders_raw (order_id, payload, placed_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (order_id) DO NOTHING`,
        [order.order_id, order, order.placed_at],
      );

      const lagMs = Date.now() - new Date(order.placed_at).getTime();
      console.log(`[consumer] ← loaded ${order.order_id}  lag ${lagMs}ms`);
    },
  });
}

async function shutdown() {
  await consumer.disconnect();
  await pool.end();
  console.log("\n[consumer] disconnected");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((err) => {
  console.error("[consumer] fatal", err);
  process.exit(1);
});
