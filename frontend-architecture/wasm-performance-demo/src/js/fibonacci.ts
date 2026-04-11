/**
 * Fibonacci — Implementacao JavaScript pura
 *
 * Mesmo algoritmo recursivo naive do modulo AssemblyScript.
 * Usado para comparacao de performance.
 */

export function fibonacciJS(n: number): number {
  if (n <= 1) return n;
  return fibonacciJS(n - 1) + fibonacciJS(n - 2);
}
