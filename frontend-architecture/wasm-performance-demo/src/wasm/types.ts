/**
 * Tipos TypeScript para as funcoes exportadas pelo modulo WebAssembly.
 *
 * Essas interfaces espelham as assinaturas definidas em AssemblyScript
 * e permitem uso tipado no lado JavaScript.
 */

export interface WasmExports {
  /** Linear memory compartilhada entre JS e Wasm */
  memory: WebAssembly.Memory;

  /**
   * Computa o fractal Mandelbrot e escreve pixels RGBA na linear memory.
   *
   * @param width    Largura em pixels
   * @param height   Altura em pixels
   * @param centerX  Centro X no plano complexo
   * @param centerY  Centro Y no plano complexo
   * @param zoom     Nivel de zoom
   * @param maxIter  Iteracoes maximas por pixel
   * @param offset   Offset em bytes na memory
   */
  computeMandelbrot(
    width: number,
    height: number,
    centerX: number,
    centerY: number,
    zoom: number,
    maxIter: number,
    offset: number
  ): void;

  /**
   * Calcula o n-esimo numero de Fibonacci (recursivo).
   * Retorna BigInt pois AssemblyScript exporta i64.
   */
  fibonacci(n: number): bigint;
}
