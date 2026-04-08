import type { Product } from "@/types/product";

type Props = {
  product: Product;
};

// Pure presentational component — receives fully-formed Product data.
// The same card renders in all four strategy pages for visual consistency.
export default function ProductCard({ product }: Props) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
          {product.category}
        </span>
      </div>
      <p className="text-2xl font-bold text-green-700">
        ${product.price.toFixed(2)}
      </p>
      {/* The timestamp is intentionally prominent — it's the educational proof
          of WHEN this data was fetched (build time vs request time). */}
      <p className="text-xs text-gray-400 mt-3">
        Data fetched at:{" "}
        <span className="font-mono">{product.generatedAt}</span>
      </p>
    </div>
  );
}
