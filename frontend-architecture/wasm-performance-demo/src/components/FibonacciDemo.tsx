import { useState } from "react";
import { getWasm } from "../wasm/loader";
import { fibonacciJS } from "../js/fibonacci";

interface BenchmarkResult {
  n: number;
  jsResult: string;
  jsTime: number;
  wasmResult: string;
  wasmTime: number;
  speedup: string;
}

function FibonacciDemo() {
  const [n, setN] = useState(40);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [running, setRunning] = useState(false);

  const runBenchmark = () => {
    setRunning(true);

    requestAnimationFrame(() => {
      const wasm = getWasm();

      // JavaScript
      const jsStart = performance.now();
      const jsResult = fibonacciJS(n);
      const jsTime = performance.now() - jsStart;

      // WebAssembly
      const wasmStart = performance.now();
      const wasmResult = wasm.fibonacci(n);
      const wasmTime = performance.now() - wasmStart;

      const speedup =
        wasmTime > 0 ? (jsTime / wasmTime).toFixed(1) : "N/A";

      setResults((prev) => [
        {
          n,
          jsResult: String(jsResult),
          jsTime,
          wasmResult: String(wasmResult),
          wasmTime,
          speedup,
        },
        ...prev,
      ]);
      setRunning(false);
    });
  };

  const clearResults = () => setResults([]);

  return (
    <>
      <div className="panel">
        <h2>Benchmark Fibonacci</h2>
        <p className="panel-subtitle">
          Fibonacci recursivo naive — propositalmente ineficiente para gerar carga computacional.
          Valores maiores de N resultam em tempo exponencialmente maior, evidenciando a diferenca entre JS e Wasm.
        </p>

        <div className="fibonacci-controls">
          <div className="control-group">
            <label>Valor de N</label>
            <input
              type="range"
              min={30}
              max={45}
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
            />
            <span className="control-value">{n}</span>
          </div>

          <button
            className="btn btn--primary"
            onClick={runBenchmark}
            disabled={running}
          >
            {running ? "Calculando..." : "Calcular"}
          </button>

          {results.length > 0 && (
            <button className="btn btn--secondary" onClick={clearResults}>
              Limpar
            </button>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="panel">
          <h3>Resultados</h3>
          <table className="fibonacci-table">
            <thead>
              <tr>
                <th>N</th>
                <th>Resultado</th>
                <th style={{ color: "var(--color-js)" }}>JS (ms)</th>
                <th style={{ color: "var(--color-wasm)" }}>Wasm (ms)</th>
                <th style={{ color: "var(--color-success)" }}>Speedup</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{r.n}</td>
                  <td>{r.jsResult}</td>
                  <td style={{ color: "var(--color-js)" }}>
                    {r.jsTime.toFixed(1)}
                  </td>
                  <td style={{ color: "var(--color-wasm)" }}>
                    {r.wasmTime.toFixed(1)}
                  </td>
                  <td style={{ color: "var(--color-success)" }}>
                    {r.speedup}x
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default FibonacciDemo;
