/**
 * Fibonacci — AssemblyScript (compila para WebAssembly)
 *
 * Implementacao recursiva naive, propositalmente ineficiente
 * para demonstrar a diferenca de performance entre JS e Wasm
 * em computacao intensiva com muitas chamadas de funcao.
 */

export function fibonacci(n: i32): i64 {
  if (n <= 1) return <i64>n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
