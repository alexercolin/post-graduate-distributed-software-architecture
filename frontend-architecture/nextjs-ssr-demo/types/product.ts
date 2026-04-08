// Shared type for the mock product data used across all rendering strategies.
// A single source of truth prevents type drift between API and consumers.

export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  generatedAt: string; // ISO timestamp — the key proof of WHEN data was fetched
};
