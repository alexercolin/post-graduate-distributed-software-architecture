/**
 * Mandelbrot Set — AssemblyScript (compila para WebAssembly)
 *
 * Escreve pixels RGBA diretamente na linear memory do Wasm.
 * O JavaScript le esses bytes para pintar no canvas.
 */

/** Converte contagem de iteracoes em cor RGB */
function iterationToColor(iteration: i32, maxIterations: i32): u32 {
  if (iteration === maxIterations) {
    // Ponto pertence ao conjunto — preto
    return 0xFF000000; // ABGR (little-endian): A=FF, B=00, G=00, R=00
  }

  const t: f64 = <f64>iteration / <f64>maxIterations;

  // Paleta de cores baseada em seno para gradiente suave
  const r: u8 = <u8>(9.0 * (1.0 - t) * t * t * t * 255.0);
  const g: u8 = <u8>(15.0 * (1.0 - t) * (1.0 - t) * t * t * 255.0);
  const b: u8 = <u8>(8.5 * (1.0 - t) * (1.0 - t) * (1.0 - t) * t * 255.0);

  // RGBA em little-endian (para ImageData)
  return (<u32>0xFF << 24) | (<u32>b << 16) | (<u32>g << 8) | <u32>r;
}

/**
 * Computa o fractal Mandelbrot e escreve pixels na linear memory.
 *
 * @param width       Largura do canvas em pixels
 * @param height      Altura do canvas em pixels
 * @param centerX     Centro X no plano complexo (tipicamente -0.5)
 * @param centerY     Centro Y no plano complexo (tipicamente 0)
 * @param zoom        Nivel de zoom (1.0 = visao padrao)
 * @param maxIter     Numero maximo de iteracoes por pixel
 * @param offset      Offset em bytes na memory onde comecar a escrever
 */
export function computeMandelbrot(
  width: i32,
  height: i32,
  centerX: f64,
  centerY: f64,
  zoom: f64,
  maxIter: i32,
  offset: i32
): void {
  const scale: f64 = 4.0 / (<f64>width * zoom);

  for (let py: i32 = 0; py < height; py++) {
    for (let px: i32 = 0; px < width; px++) {
      // Mapeia pixel para coordenada no plano complexo
      const x0: f64 = centerX + (<f64>px - <f64>width / 2.0) * scale;
      const y0: f64 = centerY + (<f64>py - <f64>height / 2.0) * scale;

      let x: f64 = 0.0;
      let y: f64 = 0.0;
      let iteration: i32 = 0;

      // z = z^2 + c — iterar ate escapar (|z| > 2) ou atingir maxIter
      while (x * x + y * y <= 4.0 && iteration < maxIter) {
        const xTemp: f64 = x * x - y * y + x0;
        y = 2.0 * x * y + y0;
        x = xTemp;
        iteration++;
      }

      const color: u32 = iterationToColor(iteration, maxIter);
      const pixelOffset: i32 = offset + (py * width + px) * 4;
      store<u32>(pixelOffset, color);
    }
  }
}
