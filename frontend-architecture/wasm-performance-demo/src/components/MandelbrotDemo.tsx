import { useState, useRef, useCallback } from "react";
import { getWasm } from "../wasm/loader";
import { computeMandelbrotJS } from "../js/mandelbrot";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

interface Results {
  jsTime: number;
  wasmTime: number;
}

function MandelbrotDemo() {
  const jsCanvasRef = useRef<HTMLCanvasElement>(null);
  const wasmCanvasRef = useRef<HTMLCanvasElement>(null);

  const [maxIter, setMaxIter] = useState(200);
  const [zoom, setZoom] = useState(1);
  const [centerX, setCenterX] = useState(-0.5);
  const [centerY, setCenterY] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const [running, setRunning] = useState(false);

  const runBenchmark = useCallback(() => {
    const jsCanvas = jsCanvasRef.current;
    const wasmCanvas = wasmCanvasRef.current;
    if (!jsCanvas || !wasmCanvas) return;

    setRunning(true);

    // Usa requestAnimationFrame para nao bloquear o render do botao
    requestAnimationFrame(() => {
      const jsCtx = jsCanvas.getContext("2d")!;
      const wasmCtx = wasmCanvas.getContext("2d")!;

      // --- JavaScript ---
      const jsImageData = jsCtx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
      const jsStart = performance.now();
      computeMandelbrotJS(
        jsImageData.data,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        centerX,
        centerY,
        zoom,
        maxIter
      );
      const jsTime = performance.now() - jsStart;
      jsCtx.putImageData(jsImageData, 0, 0);

      // --- WebAssembly ---
      const wasm = getWasm();
      const totalBytes = CANVAS_WIDTH * CANVAS_HEIGHT * 4;

      // Garante que a memory tem espaco suficiente
      const currentBytes = wasm.memory.buffer.byteLength;
      if (currentBytes < totalBytes) {
        const pagesNeeded = Math.ceil((totalBytes - currentBytes) / 65536);
        wasm.memory.grow(pagesNeeded);
      }

      const wasmStart = performance.now();
      wasm.computeMandelbrot(
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        centerX,
        centerY,
        zoom,
        maxIter,
        0 // offset 0 na linear memory
      );
      const wasmTime = performance.now() - wasmStart;

      // Le pixels da linear memory do Wasm para o canvas
      const wasmPixels = new Uint8ClampedArray(
        wasm.memory.buffer,
        0,
        totalBytes
      );
      const wasmImageData = new ImageData(wasmPixels, CANVAS_WIDTH, CANVAS_HEIGHT);
      wasmCtx.putImageData(wasmImageData, 0, 0);

      setResults({ jsTime, wasmTime });
      setRunning(false);
    });
  }, [centerX, centerY, zoom, maxIter]);

  const speedup = results ? (results.jsTime / results.wasmTime).toFixed(1) : null;

  return (
    <>
      <div className="panel">
        <h2>Fractal de Mandelbrot</h2>
        <p className="panel-subtitle">
          Comparacao lado a lado: o mesmo algoritmo executado em JavaScript puro vs WebAssembly.
          Ajuste os parametros e clique em "Renderizar" para ver a diferenca de performance.
        </p>

        <div className="mandelbrot-controls">
          <div className="control-group">
            <label>Iteracoes maximas</label>
            <input
              type="range"
              min={50}
              max={2000}
              step={50}
              value={maxIter}
              onChange={(e) => setMaxIter(Number(e.target.value))}
            />
            <span className="control-value">{maxIter}</span>
          </div>

          <div className="control-group">
            <label>Zoom</label>
            <input
              type="range"
              min={0.5}
              max={50}
              step={0.5}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            <span className="control-value">{zoom}x</span>
          </div>

          <div className="control-group">
            <label>Centro X</label>
            <input
              type="range"
              min={-2}
              max={1}
              step={0.01}
              value={centerX}
              onChange={(e) => setCenterX(Number(e.target.value))}
            />
            <span className="control-value">{centerX.toFixed(2)}</span>
          </div>

          <div className="control-group">
            <label>Centro Y</label>
            <input
              type="range"
              min={-1.5}
              max={1.5}
              step={0.01}
              value={centerY}
              onChange={(e) => setCenterY(Number(e.target.value))}
            />
            <span className="control-value">{centerY.toFixed(2)}</span>
          </div>

          <button
            className="btn btn--primary"
            onClick={runBenchmark}
            disabled={running}
          >
            {running ? "Renderizando..." : "Renderizar"}
          </button>
        </div>

        {results && (
          <div className="results-bar">
            <div className="result-item">
              <span className="result-label">JavaScript</span>
              <span className="result-value result-value--js">
                {results.jsTime.toFixed(1)}ms
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">WebAssembly</span>
              <span className="result-value result-value--wasm">
                {results.wasmTime.toFixed(1)}ms
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Speedup</span>
              <span className="result-value result-value--speedup">
                {speedup}x
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="canvas-comparison">
        <div className="canvas-panel">
          <h4>
            <span className="badge badge--js">JS</span>
            JavaScript
          </h4>
          <canvas
            ref={jsCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
          />
        </div>
        <div className="canvas-panel">
          <h4>
            <span className="badge badge--wasm">WASM</span>
            WebAssembly
          </h4>
          <canvas
            ref={wasmCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
          />
        </div>
      </div>
    </>
  );
}

export default MandelbrotDemo;
