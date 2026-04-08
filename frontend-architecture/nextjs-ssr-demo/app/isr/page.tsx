// =============================================================================
// INCREMENTAL STATIC REGENERATION (ISR) DEMO
// =============================================================================
// COMO FUNCIONA:
//   1. No build time: a página é renderizada e cacheada (como SSG)
//   2. Um usuário faz request DENTRO da janela de revalidação (30s): servido do cache
//   3. Um usuário faz request APÓS 30s expirarem:
//      a. A página cacheada (stale) é servida IMEDIATAMENTE (sem espera!)
//      b. Em background, o Next.js dispara uma nova renderização no servidor
//      c. O cache é atualizado — o PRÓXIMO visitante recebe a página fresca
//   Esse é o padrão de cache HTTP "stale-while-revalidate" (SWR).
//
// OBSERVAÇÃO CHAVE:
//   Após `npm run build && npm start`:
//   1. Visite /isr — anote o timestamp.
//   2. Aguarde 30+ segundos.
//   3. Recarregue — você recebe a página VELHA (stale) imediatamente.
//   4. Recarregue NOVAMENTE — agora você recebe a página recém-regenerada.
//   O timestamp avança em incrementos de 30s+, não a cada request.
//
// ISR oferece a performance do SSG com a quase-frescura do SSR.
// O trade-off: um usuário sempre recebe dados stale (quem dispara a regenaração).
// =============================================================================

import type { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";
import RenderingBadge from "@/components/RenderingBadge";

// Exportar revalidate do arquivo de página é a forma App Router de configurar ISR.
// Equivalente a getStaticProps({ revalidate: 30 }) no Pages Router.
export const revalidate = 30; // segundos

async function getProducts(): Promise<Product[]> {
  // next.revalidate aqui faz a mesma coisa que o `revalidate` exportado acima —
  // ambos funcionam juntos. O export de nível de página é a forma canônica;
  // a opção de nível de fetch permite granularidade por-fetch quando necessário.
  const res = await fetch("http://localhost:3000/api/products", {
    next: { revalidate: 30 },
  });

  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export default async function ISRPage() {
  const products = await getProducts();
  const fetchedAt = products[0]?.generatedAt ?? "unknown";

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <RenderingBadge strategy="ISR" />
        <h1 className="text-3xl font-bold text-gray-900">
          Incremental Static Regeneration
        </h1>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-8 text-sm text-purple-900">
        <strong>O que está acontecendo:</strong> Esta página se regenera a cada{" "}
        <strong>30 segundos</strong> usando o padrão stale-while-revalidate.
        Após a janela expirar, o próximo visitante recebe a página cacheada
        (stale) enquanto o Next.js a regenera em background. O visitante{" "}
        <em>depois desse</em> recebe a versão fresca. Faça o build e aguarde
        30+ segundos entre os reloads para observar o timestamp avançando em
        saltos discretos.
      </div>

      <div className="bg-gray-800 text-green-400 font-mono text-sm rounded-lg p-4 mb-8">
        <span className="text-gray-500">
          {"// Configuração ISR em nível de página (App Router):"}
        </span>
        <br />
        <span className="text-blue-300">export const</span> revalidate ={" "}
        <span className="text-yellow-300">30</span>;
        <br />
        <br />
        <span className="text-gray-500">{"// OU configuração por fetch:"}</span>
        <br />
        fetch(url,{" "}
        <span className="text-yellow-300">
          {"{ next: { revalidate: 30 } }"}
        </span>
        )
      </div>

      <div className="bg-purple-100 border border-purple-300 rounded-lg p-3 mb-6 text-xs text-purple-800 font-mono">
        Janela Stale-While-Revalidate: <strong>30 segundos</strong>
        <br />
        Último snapshot do cache em: <strong>{fetchedAt}</strong>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
