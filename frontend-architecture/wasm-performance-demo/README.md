# WebAssembly Performance Demo

Projeto educacional que demonstra os conceitos fundamentais de **WebAssembly (Wasm)** atraves de comparacoes de performance entre JavaScript puro e modulos Wasm compilados a partir de AssemblyScript.

## Como executar

```bash
npm install
npm run dev
```

O comando `npm run dev` compila automaticamente o AssemblyScript (`npm run asbuild`) e inicia o servidor Vite.

## Estrutura do projeto

```
wasm-performance-demo/
├── assembly/              # Codigo AssemblyScript (compila para Wasm)
│   ├── index.ts           # Entry point — re-exporta funcoes
│   ├── mandelbrot.ts      # Computacao do fractal Mandelbrot
│   └── fibonacci.ts       # Fibonacci recursivo
├── public/wasm/           # Binarios gerados (module.wasm + module.wat)
├── src/
│   ├── components/
│   │   ├── MandelbrotDemo.tsx    # Comparacao visual JS vs Wasm
│   │   ├── FibonacciDemo.tsx     # Benchmark numerico
│   │   └── ConceptsExplainer.tsx # Conteudo educacional
│   ├── wasm/
│   │   ├── loader.ts      # Carrega e instancia o modulo .wasm
│   │   └── types.ts       # Tipos TypeScript para exports do Wasm
│   └── js/
│       ├── mandelbrot.ts  # Mandelbrot em JS puro (comparacao)
│       └── fibonacci.ts   # Fibonacci em JS puro (comparacao)
└── asconfig.json          # Configuracao do compilador AssemblyScript
```

## Abas da aplicacao

### Mandelbrot
Renderiza o fractal de Mandelbrot lado a lado em dois canvas — um usando JavaScript puro e outro usando WebAssembly. Permite ajustar parametros (iteracoes, zoom, centro) e exibe o tempo de execucao de cada implementacao.

### Fibonacci
Benchmark de Fibonacci recursivo (naive) comparando JS e Wasm. Permite variar o valor de N e acumula resultados em uma tabela.

### Conceitos
Explicacao dos conceitos fundamentais de WebAssembly demonstrados no projeto.

## Conceitos demonstrados

1. **Compilacao** — AssemblyScript → `.wasm` binario + `.wat` texto legivel
2. **Instanciacao** — `WebAssembly.instantiate()` com imports/exports
3. **Memoria Linear** — `WebAssembly.Memory` como buffer compartilhado entre JS e Wasm
4. **Interop JS ↔ Wasm** — chamadas de funcao e passagem de parametros
5. **Performance** — comparacao mensuravel em computacao CPU-intensiva
6. **Casos de uso** — quando Wasm e vantajoso vs JavaScript

## Tecnologias

- **AssemblyScript** — linguagem similar a TypeScript que compila para WebAssembly
- **React 19** + **TypeScript** — frontend
- **Vite** — bundler e dev server
