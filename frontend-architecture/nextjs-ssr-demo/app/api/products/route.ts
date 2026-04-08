import { NextResponse } from "next/server";
import type { Product } from "@/types/product";

// Mock data store — no database needed.
// The key insight for demos: generatedAt changes on every call,
// making it easy to see WHEN the server actually fetched data.
const MOCK_PRODUCTS: Omit<Product, "generatedAt">[] = [
  { id: 1, name: "Mechanical Keyboard", price: 149.99, category: "Electronics" },
  { id: 2, name: "Ergonomic Mouse",     price: 79.99,  category: "Electronics" },
  { id: 3, name: "Monitor Stand",       price: 49.99,  category: "Furniture"   },
  { id: 4, name: "Desk Lamp",           price: 34.99,  category: "Furniture"   },
  { id: 5, name: "USB-C Hub",           price: 59.99,  category: "Electronics" },
];

export async function GET() {
  // Artificial delay simulates a real network round-trip.
  // This makes the difference between SSR and SSG dramatically visible.
  await new Promise((resolve) => setTimeout(resolve, 300));

  const products: Product[] = MOCK_PRODUCTS.map((p) => ({
    ...p,
    // This timestamp is the core educational element:
    // Each fetch() call with cache:"no-store" generates a NEW timestamp.
    // Compare what you see in /ssr vs /ssg to understand the difference.
    generatedAt: new Date().toISOString(),
  }));

  return NextResponse.json(products);
}
