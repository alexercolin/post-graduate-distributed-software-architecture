// Shared domain model + a tiny faker, used by all four entry points so both
// pipelines ingest the exact same shape of e-commerce event.
import { randomUUID } from "node:crypto";

export interface OrderItem {
  sku: string;
  qty: number;
  unit_price: number;
}

export interface OrderPlaced {
  order_id: string;
  customer_id: string;
  items: OrderItem[];
  currency: "USD";
  channel: "web" | "mobile";
  placed_at: string; // ISO-8601, business event time
}

// A small fixed catalog keeps the SKU set readable in query output.
const CATALOG: Array<{ sku: string; price: number }> = [
  { sku: "BOOK-001", price: 12.99 },
  { sku: "MUG-007", price: 8.5 },
  { sku: "TEE-100", price: 19.0 },
  { sku: "CABLE-USB", price: 6.25 },
  { sku: "HDPHONE-X", price: 79.99 },
];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/** Build one realistic OrderPlaced event with 1–4 line items. */
export function generateOrder(): OrderPlaced {
  const itemCount = randInt(1, 4);
  const items: OrderItem[] = Array.from({ length: itemCount }, () => {
    const product = pick(CATALOG);
    return { sku: product.sku, qty: randInt(1, 3), unit_price: product.price };
  });

  return {
    order_id: randomUUID(),
    customer_id: `cust-${randInt(1, 50).toString().padStart(3, "0")}`,
    items,
    currency: "USD",
    channel: pick(["web", "mobile"] as const),
    placed_at: new Date().toISOString(),
  };
}

/** Order total in the order's currency. Handy for transforms/logging. */
export function orderTotal(order: OrderPlaced): number {
  return order.items.reduce((sum, i) => sum + i.qty * i.unit_price, 0);
}
