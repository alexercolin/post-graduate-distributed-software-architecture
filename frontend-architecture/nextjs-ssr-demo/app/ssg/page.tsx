// =============================================================================
// STATIC SITE GENERATION (SSG) DEMO
// =============================================================================
// COMO FUNCIONA:
//   1. Durante `npm run build`, Next.js executa este componente UMA VEZ no servidor
//   2. fetch() é chamado com cache: "force-cache" (o padrão no Next.js)
//   3. A API responde, os dados são embutidos em um arquivo HTML estático
//   4. Esse arquivo HTML é armazenado e servido para TODOS os requests subsequentes
//   5. Nenhuma computação no servidor ocorre em request time — é pure file serving
//
// OBSERVAÇÃO CHAVE:
//   Em desenvolvimento (`npm run dev`), SSG se comporta como SSR porque o Next.js
//   re-renderiza tudo em cada request para suportar hot reload.
//   Para ver o SSG de verdade, execute:
//     npm run build && npm start
//   Então recarregue /ssg várias vezes — o timestamp NUNCA muda.
//   Cada usuário no mundo vê o MESMO timestamp: o momento do build.
//
// NOTA: No App Router, force-cache é o padrão. A ausência de cache: "no-store"
// é o que te coloca no caching estático.
// =============================================================================

import type { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";
import RenderingBadge from "@/components/RenderingBadge";

async function getProducts(): Promise<Product[]> {
  // cache: "force-cache" é o padrão — declarado explicitamente aqui por clareza.
  // Diz ao Next.js: "faça cache desta resposta para sempre (até o próximo build)".
  // Compare com o cache: "no-store" do SSR — essa única opção é TODA a diferença
  // entre comportamento SSR e SSG no Next.js App Router.
  const res = await fetch("http://localhost:3000/api/products", {
    cache: "force-cache",
  });

  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export default async function SSGPage() {
  const products = await getProducts();
  const fetchedAt = products[0]?.generatedAt ?? "unknown";

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <RenderingBadge strategy="SSG" />
        <h1 className="text-3xl font-bold text-gray-900">
          Static Site Generation
        </h1>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 text-sm text-green-900">
        <strong>O que está acontecendo:</strong> Esta página foi pré-renderizada
        no <strong>build time</strong> e é servida como um arquivo HTML estático.
        O timestamp abaixo foi capturado quando{" "}
        <code className="bg-green-100 px-1 rounded">npm run build</code> rodou —
        ele não muda até o próximo build. No modo{" "}
        <code className="bg-green-100 px-1 rounded">npm run dev</code> parece
        dinâmico, mas execute{" "}
        <code className="bg-green-100 px-1 rounded">
          npm run build &amp;&amp; npm start
        </code>{" "}
        para ver o comportamento estático real.
      </div>

      <div className="bg-gray-800 text-green-400 font-mono text-sm rounded-lg p-4 mb-8">
        <span className="text-gray-500">// Opção de fetch usada (Server Component):</span>
        <br />
        fetch(url,{" "}
        <span className="text-yellow-300">{"{ cache: 'force-cache' }"}</span>)
        <br />
        <span className="text-gray-500">
          {"// (esse também é o PADRÃO — omitir cache: já te dá SSG)"}
        </span>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Página renderizada no build time.{" "}
        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
          Snapshot tirado em: {fetchedAt}
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
