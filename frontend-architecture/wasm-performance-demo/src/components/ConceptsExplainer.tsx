function ConceptsExplainer() {
  return (
    <>
      <div className="panel">
        <h2>Conceitos de WebAssembly</h2>
        <p className="panel-subtitle">
          Uma visao geral dos conceitos fundamentais demonstrados neste projeto.
        </p>
      </div>

      <div className="panel">
        <div className="concept-section">
          <h3>O que e WebAssembly?</h3>
          <p>
            WebAssembly (Wasm) e um <strong>formato de instrucoes binarias</strong> para
            uma maquina virtual baseada em pilha (stack-based VM). Nao e uma linguagem
            de programacao — e um <strong>alvo de compilacao</strong>. Voce escreve codigo
            em linguagens como Rust, C, C++ ou AssemblyScript, e o compilador gera
            um binario <code>.wasm</code> que o navegador executa.
          </p>
          <p>
            Wasm foi projetado para ser um complemento ao JavaScript, nao um substituto.
            Ele executa dentro da mesma sandbox de seguranca do navegador e tem acesso
            as mesmas Web APIs (via JavaScript).
          </p>
        </div>

        <div className="concept-section">
          <h3>Pipeline de Compilacao</h3>
          <p>
            Neste projeto usamos <strong>AssemblyScript</strong>, uma linguagem com sintaxe
            similar a TypeScript que compila diretamente para WebAssembly.
          </p>

          <div className="pipeline-diagram">
            <div className="pipeline-step pipeline-step--active">
              <span>AssemblyScript</span>
              <small>.ts (assembly/)</small>
            </div>
            <span className="pipeline-arrow">→</span>
            <div className="pipeline-step pipeline-step--active">
              <span>Compilador asc</span>
              <small>npm run asbuild</small>
            </div>
            <span className="pipeline-arrow">→</span>
            <div className="pipeline-step pipeline-step--active">
              <span>.wasm (binario)</span>
              <small>public/wasm/module.wasm</small>
            </div>
            <span className="pipeline-arrow">+</span>
            <div className="pipeline-step">
              <span>.wat (texto)</span>
              <small>public/wasm/module.wat</small>
            </div>
          </div>

          <p>
            O arquivo <code>.wat</code> (WebAssembly Text Format) e a representacao
            legivel do binario. Voce pode abri-lo para ver as instrucoes que o navegador
            realmente executa — como um "assembly" da web.
          </p>
        </div>

        <div className="concept-section">
          <h3>Instanciacao: Como o JS Carrega o Wasm</h3>
          <p>
            O fluxo de carregamento no JavaScript segue tres passos:
          </p>
          <code className="code-block">{`// 1. Fetch do binario
const response = await fetch("/wasm/module.wasm");
const bytes = await response.arrayBuffer();

// 2. Instanciar com imports
const { instance } = await WebAssembly.instantiate(bytes, {
  env: { abort: () => {} }
});

// 3. Usar os exports
instance.exports.computeMandelbrot(600, 400, ...);`}</code>
          <p>
            O objeto de <strong>imports</strong> fornece ao Wasm funcoes e recursos
            do ambiente host (JavaScript). O objeto de <strong>exports</strong> contem
            as funcoes que o Wasm disponibiliza para o JS chamar.
          </p>
        </div>

        <div className="concept-section">
          <h3>Memoria Linear</h3>
          <p>
            A <strong>linear memory</strong> e o conceito mais importante do Wasm para
            entender a interoperabilidade. E um <code>ArrayBuffer</code> compartilhado
            entre JavaScript e WebAssembly — ambos podem ler e escrever nos mesmos bytes.
          </p>
          <p>
            No demo do Mandelbrot, o Wasm escreve pixels RGBA diretamente na memory
            usando <code>store&lt;u32&gt;(offset, color)</code>, e o JavaScript le esses
            bytes com <code>new Uint8ClampedArray(memory.buffer)</code> para pintar no canvas.
            Nao ha copia de dados — JS e Wasm acessam o mesmo buffer.
          </p>
          <code className="code-block">{`// Wasm (AssemblyScript) — escreve na memory
store<u32>(pixelOffset, color);

// JavaScript — le da mesma memory
const pixels = new Uint8ClampedArray(wasm.memory.buffer, 0, totalBytes);
const imageData = new ImageData(pixels, width, height);
ctx.putImageData(imageData, 0, 0);`}</code>
          <p>
            A memory e organizada em <strong>paginas de 64KB</strong>. Ao instanciar,
            voce define o tamanho inicial, e pode crescer dinamicamente
            com <code>memory.grow(pages)</code>.
          </p>
        </div>

        <div className="concept-section">
          <h3>Performance: Quando Usar Wasm?</h3>
          <p>
            WebAssembly nao e magicamente mais rapido que JavaScript para tudo. A vantagem
            aparece em cenarios especificos:
          </p>
          <ul className="concept-list">
            <li>
              <strong>Loops numericos intensivos</strong> — Wasm tem tipos numericos
              fixos (i32, f64), sem overhead de boxing/unboxing do JS
            </li>
            <li>
              <strong>Acesso previsivel a memoria</strong> — linear memory sem garbage
              collector, sem pausas de GC
            </li>
            <li>
              <strong>Codigo ja existente em C/C++/Rust</strong> — portar bibliotecas
              nativas para a web (ex: FFmpeg, SQLite, codecs de audio/video)
            </li>
            <li>
              <strong>Processamento de imagem/audio</strong> — operacoes pixel-a-pixel
              ou sample-a-sample em buffers de dados
            </li>
          </ul>
          <p style={{ marginTop: "12px" }}>
            Wasm <strong>nao e ideal</strong> para manipulacao de DOM, requisicoes HTTP,
            ou logica de UI — nessas areas o JavaScript e mais eficiente porque tem
            acesso direto as APIs do navegador.
          </p>
        </div>

        <div className="concept-section">
          <h3>Casos de Uso Reais</h3>
          <ul className="concept-list">
            <li>
              <strong>Figma</strong> — editor de design que roda C++ compilado para Wasm
              para renderizacao de alta performance
            </li>
            <li>
              <strong>Google Earth</strong> — visualizacao 3D com Wasm para calculo
              de geometria e renderizacao
            </li>
            <li>
              <strong>AutoCAD Web</strong> — port de milhoes de linhas de C++ para a web
              usando Emscripten + Wasm
            </li>
            <li>
              <strong>FFmpeg.wasm</strong> — processamento de video diretamente no navegador
            </li>
            <li>
              <strong>SQLite no browser</strong> — banco de dados relacional completo
              rodando em Wasm
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default ConceptsExplainer;
