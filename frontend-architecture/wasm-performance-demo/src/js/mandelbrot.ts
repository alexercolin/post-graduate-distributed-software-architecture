/**
 * Mandelbrot Set — Implementacao JavaScript pura
 *
 * Mesmo algoritmo do modulo AssemblyScript, mas executando
 * na engine JS. Usado para comparacao de performance.
 */

function iterationToColor(iteration: number, maxIterations: number): [number, number, number, number] {
  if (iteration === maxIterations) {
    return [0, 0, 0, 255]; // Preto — ponto pertence ao conjunto
  }

  const t = iteration / maxIterations;

  const r = Math.floor(9.0 * (1.0 - t) * t * t * t * 255.0);
  const g = Math.floor(15.0 * (1.0 - t) * (1.0 - t) * t * t * 255.0);
  const b = Math.floor(8.5 * (1.0 - t) * (1.0 - t) * (1.0 - t) * t * 255.0);

  return [r, g, b, 255];
}

export function computeMandelbrotJS(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  zoom: number,
  maxIter: number
): void {
  const scale = 4.0 / (width * zoom);

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const x0 = centerX + (px - width / 2.0) * scale;
      const y0 = centerY + (py - height / 2.0) * scale;

      let x = 0.0;
      let y = 0.0;
      let iteration = 0;

      while (x * x + y * y <= 4.0 && iteration < maxIter) {
        const xTemp = x * x - y * y + x0;
        y = 2.0 * x * y + y0;
        x = xTemp;
        iteration++;
      }

      const [r, g, b, a] = iterationToColor(iteration, maxIter);
      const offset = (py * width + px) * 4;
      imageData[offset] = r;
      imageData[offset + 1] = g;
      imageData[offset + 2] = b;
      imageData[offset + 3] = a;
    }
  }
}
