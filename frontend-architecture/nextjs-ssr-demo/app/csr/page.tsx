"use client";
// =============================================================================
// CLIENT SIDE RENDERING (CSR) DEMO
// =============================================================================
// COMO FUNCIONA:
//   1. Usuário faz request para /csr
//   2. Next.js envia um shell HTML mínimo (sem dados de produto, só o esqueleto)
//   3. Browser baixa e executa o bundle JavaScript
//   4. React hidrata, useEffect dispara APÓS a montagem
//   5. fetch() roda NO BROWSER — a chamada à API parte do cliente
//   6. State atualiza, componente re-renderiza com os dados
//
// OBSERVAÇÕES CHAVE:
//   1. Você verá o estado "Carregando..." brevemente antes dos dados aparecerem —
//      esse é o estado de shell vazio. SSR nunca tem esse estado em branco.
//   2. Abra DevTools > Network — você verá o request para /api/products
//      partir DO SEU BROWSER, não de um servidor.
//   3. "View Source" desta página NÃO mostra dados de produto — só o bundle JS.
//      É por isso que CSR tem SEO ruim.
//
// "use client" no topo é OBRIGATÓRIO para qualquer arquivo que use React hooks
// ou APIs do browser. Ele marca um "client boundary" na árvore de componentes.
// =============================================================================

import { useEffect, useState } from "react";
import type { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";
import RenderingBadge from "@/components/RenderingBadge";

export default function CSRPage() {
  // State vive no browser — não no servidor.
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string>("");

  // useEffect roda APÓS o componente montar no browser.
  // Essa é a característica definidora do CSR: o fetch de dados é diferido
  // até depois do HTML inicial ser pintado.
  useEffect(() => {
    // Este fetch roda no browser. Abra DevTools > Network para ver.
    fetch("/api/products")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data: Product[]) => {
        setProducts(data);
        setFetchedAt(data[0]?.generatedAt ?? "unknown");
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []); // Array de dependências vazio = executar uma vez ao montar

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <RenderingBadge strategy="CSR" />
        <h1 className="text-3xl font-bold text-gray-900">
          Client Side Rendering
        </h1>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-sm text-yellow-900">
        <strong>O que está acontecendo:</strong> Esta página foi enviada ao
        browser como um shell HTML vazio. Após o bundle JavaScript carregar,
        React montou o componente e o{" "}
        <code className="bg-yellow-100 px-1 rounded">useEffect</code> disparou
        um <code className="bg-yellow-100 px-1 rounded">fetch()</code>{" "}
        <em>do seu browser</em>. Verifique DevTools &gt; Network para confirmar.
        Observe o estado de loading — SSR nunca mostra isso pois os dados chegam
        junto com o HTML.
      </div>

      <div className="bg-gray-800 text-green-400 font-mono text-sm rounded-lg p-4 mb-8">
        <span className="text-gray-500">// Padrão &quot;use client&quot; + useEffect:</span>
        <br />
        <span className="text-blue-300">useEffect</span>
        {"(() => { "}
        <span className="text-yellow-300">fetch</span>
        {"(url).then(...) }, [])"}
      </div>

      {loading && (
        // Esse estado em branco é o que páginas CSR mostram antes dos dados chegarem.
        // Com conexão lenta, esse estado é muito visível.
        <div className="flex items-center justify-center h-48">
          <div className="text-gray-500 text-lg animate-pulse">
            Buscando do browser... (observe a aba Network do DevTools)
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">{error}</div>
      )}

      {!loading && !error && (
        <>
          <p className="text-sm text-gray-500 mb-6">
            Dados buscados pelo browser.{" "}
            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
              API respondeu em: {fetchedAt}
            </span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
