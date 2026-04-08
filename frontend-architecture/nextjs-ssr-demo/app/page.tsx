import Link from "next/link";

// Home page: a visual comparison table so students understand the
// trade-offs BEFORE clicking into each demo.
// This page itself uses SSG (default Next.js behavior — no fetch, no dynamic).

const STRATEGIES = [
  {
    href: "/ssr",
    name: "Server Side Rendering",
    acronym: "SSR",
    color: "border-red-400",
    badge: "bg-red-100 text-red-800",
    when: "A cada request",
    pros: "Dados sempre frescos, SEO-friendly",
    cons: "TTFB mais lento, sem cache estático",
    useCase: "Dashboards, preços em tempo real",
  },
  {
    href: "/csr",
    name: "Client Side Rendering",
    acronym: "CSR",
    color: "border-yellow-400",
    badge: "bg-yellow-100 text-yellow-800",
    when: "No browser, após o JS carregar",
    pros: "Rica interatividade, transições rápidas",
    cons: "SEO ruim, shell vazio no primeiro load",
    useCase: "Apps internos, UIs autenticadas",
  },
  {
    href: "/ssg",
    name: "Static Site Generation",
    acronym: "SSG",
    color: "border-green-400",
    badge: "bg-green-100 text-green-800",
    when: "No build time (uma vez)",
    pros: "TTFB mais rápido, CDN cacheable",
    cons: "Dados ficam stale até o próximo build",
    useCase: "Marketing pages, blogs, docs",
  },
  {
    href: "/isr",
    name: "Incremental Static Regeneration",
    acronym: "ISR",
    color: "border-purple-400",
    badge: "bg-purple-100 text-purple-800",
    when: "Build time + revalidação a cada 30s",
    pros: "Dados quase frescos com performance estática",
    cons: "Complexidade stale-while-revalidate",
    useCase: "Catálogos de produtos, feeds de notícias",
  },
];

export default function HomePage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        Next.js Rendering Strategies
      </h1>
      <p className="text-gray-600 mb-10 text-lg">
        Clique em cada demo e observe como e{" "}
        <strong>quando os dados são buscados</strong>. Observe os timestamps.
      </p>

      <div className="grid gap-6">
        {STRATEGIES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`block border-l-4 ${s.color} bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`text-xs font-bold px-2 py-1 rounded ${s.badge}`}
              >
                {s.acronym}
              </span>
              <h2 className="text-xl font-semibold text-gray-900">{s.name}</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-700">
              <div>
                <span className="font-medium block text-gray-500">
                  Renderiza quando
                </span>
                {s.when}
              </div>
              <div>
                <span className="font-medium block text-gray-500">Prós</span>
                {s.pros}
              </div>
              <div>
                <span className="font-medium block text-gray-500">Contras</span>
                {s.cons}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Melhor para: {s.useCase}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
