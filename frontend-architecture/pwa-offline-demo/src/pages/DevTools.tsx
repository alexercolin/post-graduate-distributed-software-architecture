import { SwStatus } from '../components/SwStatus';
import { CacheViewer } from '../components/CacheViewer';

export function DevTools() {
  return (
    <div className="page devtools-page">
      <h1>PWA DevTools</h1>
      <p className="devtools-subtitle">
        Painel educacional para visualizar o funcionamento interno da PWA.
        Aqui voce pode inspecionar o estado do Service Worker e os recursos
        armazenados no Cache Storage.
      </p>

      <SwStatus />
      <CacheViewer />

      <div className="devtools-panel">
        <h3>Dicas de Debug</h3>
        <ul className="debug-tips">
          <li>
            <strong>Chrome DevTools &rarr; Application</strong>: Visualize Service Workers
            registrados, cache storage e IndexedDB.
          </li>
          <li>
            <strong>Network &rarr; Offline</strong>: Simule modo offline para testar
            o fallback do Service Worker.
          </li>
          <li>
            <strong>Application &rarr; Service Workers &rarr; Update on reload</strong>:
            Forca atualizacao do SW a cada reload (util durante desenvolvimento).
          </li>
          <li>
            <strong>Console</strong>: O Service Worker loga todas as decisoes de cache
            com prefixo [SW]. Filtre por "[SW]" para ver apenas logs do SW.
          </li>
          <li>
            <strong>Lighthouse</strong>: Execute uma auditoria PWA para verificar
            se todos os criterios sao atendidos.
          </li>
        </ul>
      </div>
    </div>
  );
}
