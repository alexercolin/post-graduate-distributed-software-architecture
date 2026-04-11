/**
 * Wasm Loader — Carrega e instancia o modulo WebAssembly
 *
 * Este arquivo demonstra o fluxo completo de interop JS ↔ Wasm:
 * 1. fetch() do arquivo .wasm (binario compilado)
 * 2. WebAssembly.instantiate() com imports (memory compartilhada)
 * 3. Acesso aos exports (funcoes + memory)
 */

import { WasmExports } from "./types";

let wasmInstance: WasmExports | null = null;

export async function loadWasm(): Promise<WasmExports> {
  if (wasmInstance) return wasmInstance;

  // 1. Fetch do binario .wasm (servido como asset estatico pelo Vite)
  const response = await fetch("/wasm/module.wasm");
  const bytes = await response.arrayBuffer();

  // 2. Instanciar o modulo Wasm
  //    O objeto de imports fornece ao Wasm o que ele precisa do ambiente host.
  //    AssemblyScript com runtime "stub" precisa de abort() e env.memory.
  const importObject = {
    env: {
      abort: (
        _msg: number,
        _file: number,
        line: number,
        column: number
      ) => {
        console.error(`Wasm abort at ${line}:${column}`);
      },
    },
  };

  const { instance } = await WebAssembly.instantiate(bytes, importObject);

  // 3. Extrair exports tipados
  const exports = instance.exports as unknown as WasmExports;

  wasmInstance = exports;
  return exports;
}

/**
 * Retorna a instancia ja carregada (sem async).
 * Lanca erro se loadWasm() nao foi chamado antes.
 */
export function getWasm(): WasmExports {
  if (!wasmInstance) {
    throw new Error("Wasm module not loaded. Call loadWasm() first.");
  }
  return wasmInstance;
}
