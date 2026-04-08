// =============================================================================
// SERVER SIDE RENDERING (SSR) DEMO
// =============================================================================
// COMO FUNCIONA:
//   1. Usuário faz request para /ssr
//   2. Next.js executa este componente NO SERVIDOR para aquele request específico
//   3. fetch() é chamado com cache: "no-store" — ignora qualquer cache
//   4. A API responde com dados frescos (novo timestamp generatedAt)
//   5. Next.js monta o HTML completo e envia para o browser
//   6. O browser recebe um documento HTML completo e pronto para SEO
//
// OBSERVAÇÃO CHAVE:
//   Recarregue esta página várias vezes. O timestamp "Data fetched at"
//   muda a CADA reload — prova de que o servidor buscou dados frescos
//   especificamente para o seu request.
//
// ESTE ARQUIVO É UM SERVER COMPONENT (sem diretiva "use client").
// Server Components podem ser async. Eles NUNCA enviam JavaScript ao browser.
// =============================================================================

import type { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";
import RenderingBadge from "@/components/RenderingBadge";

// Esta função async roda exclusivamente no servidor.
// Nenhum JavaScript deste arquivo é enviado ao cliente.
async function getProducts(): Promise<Product[]> {
  // cache: "no-store" é a forma Next.js de optar pelo comportamento SSR.
  // Diz para a camada de fetch: "nunca faça cache — busque dados frescos sempre."
  // Sem isso, Next.js faria cache e se comportaria como SSG.
  const res = await fetch("http://localhost:3000/api/products", {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export default async function SSRPage() {
  // Este await acontece no servidor durante o ciclo de vida do request.
  // O HTML da página NÃO é enviado ao browser até que isso resolva.
  const products = await getProducts();

  // generatedAt é idêntico em todos os produtos de um único request —
  // todos foram buscados no mesmo momento. Recarregue para ver mudar.
  const fetchedAt = products[0]?.generatedAt ?? "unknown";

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <RenderingBadge strategy="SSR" />
        <h1 className="text-3xl font-bold text-gray-900">
          Server Side Rendering
        </h1>
      </div>

      {/* Caixa de explicação — sempre visível para que o demo seja autodocumentado */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-sm text-red-900">
        <strong>O que está acontecendo:</strong> Esta página foi renderizada no
        servidor no momento exato do seu request HTTP. O{" "}
        <code className="bg-red-100 px-1 rounded">fetch()</code> usou{" "}
        <code className="bg-red-100 px-1 rounded">cache: &quot;no-store&quot;</code>,
        forçando uma nova chamada à API em cada request.{" "}
        <strong>Recarregue a página</strong> — o timestamp abaixo muda toda vez,
        provando que dados frescos foram buscados para o seu request.
      </div>

      <div className="bg-gray-800 text-green-400 font-mono text-sm rounded-lg p-4 mb-8">
        <span className="text-gray-500">// Opção de fetch usada (Server Component):</span>
        <br />
        fetch(url,{" "}
        <span className="text-yellow-300">{"{ cache: 'no-store' }"}</span>)
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Página renderizada em request time.{" "}
        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
          API respondeu em: {fetchedAt}
        </span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
