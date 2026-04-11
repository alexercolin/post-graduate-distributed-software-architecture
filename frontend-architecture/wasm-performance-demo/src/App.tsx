import { useState, useEffect } from "react";
import { loadWasm } from "./wasm/loader";
import MandelbrotDemo from "./components/MandelbrotDemo";
import FibonacciDemo from "./components/FibonacciDemo";
import ConceptsExplainer from "./components/ConceptsExplainer";

type Tab = "mandelbrot" | "fibonacci" | "conceitos";

function App() {
  const [tab, setTab] = useState<Tab>("mandelbrot");
  const [wasmReady, setWasmReady] = useState(false);
  const [wasmError, setWasmError] = useState<string | null>(null);

  useEffect(() => {
    loadWasm()
      .then(() => setWasmReady(true))
      .catch((err) => setWasmError(String(err)));
  }, []);

  return (
    <>
      <header className="header">
        <div className="header-content">
          <span className="header-logo">WebAssembly Demo</span>
          <nav className="header-nav">
            <button
              className={`nav-btn ${tab === "mandelbrot" ? "nav-btn--active" : ""}`}
              onClick={() => setTab("mandelbrot")}
            >
              Mandelbrot
            </button>
            <button
              className={`nav-btn ${tab === "fibonacci" ? "nav-btn--active" : ""}`}
              onClick={() => setTab("fibonacci")}
            >
              Fibonacci
            </button>
            <button
              className={`nav-btn ${tab === "conceitos" ? "nav-btn--active" : ""}`}
              onClick={() => setTab("conceitos")}
            >
              Conceitos
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {wasmError && (
          <div className="panel" style={{ borderColor: "var(--color-primary)" }}>
            <h3>Erro ao carregar WebAssembly</h3>
            <p className="panel-subtitle">{wasmError}</p>
            <p className="panel-subtitle">
              Certifique-se de rodar <code>npm run asbuild</code> antes de iniciar o servidor.
            </p>
          </div>
        )}

        {!wasmReady && !wasmError && (
          <div className="loading">
            <span className="spinner" />
            Carregando modulo WebAssembly...
          </div>
        )}

        {wasmReady && (
          <div className="page">
            {tab === "mandelbrot" && <MandelbrotDemo />}
            {tab === "fibonacci" && <FibonacciDemo />}
            {tab === "conceitos" && <ConceptsExplainer />}
          </div>
        )}
      </main>
    </>
  );
}

export default App;
