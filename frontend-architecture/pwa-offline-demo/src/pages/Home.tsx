import { Link } from 'react-router-dom';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useServiceWorker } from '../hooks/useServiceWorker';

export function Home() {
  const { isOnline } = useOnlineStatus();
  const { swState } = useServiceWorker();

  return (
    <div className="page home-page">
      <section className="hero">
        <h1>StudyNotes PWA</h1>
        <p className="hero-subtitle">
          Uma Progressive Web App educacional demonstrando Service Workers,
          estrategias de cache e funcionamento offline.
        </p>

        <div className="status-cards">
          <div className="status-card">
            <span className="status-card-label">Conexao</span>
            <span className={`status-card-value ${isOnline ? 'text-success' : 'text-danger'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="status-card">
            <span className="status-card-label">Service Worker</span>
            <span className="status-card-value">{swState}</span>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>O que e uma PWA?</h2>
        <p>
          Progressive Web Apps combinam o melhor da web e de apps nativos.
          Sao aplicacoes web que usam tecnologias modernas para oferecer
          experiencias rapidas, confiaveis e engajantes.
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>Service Workers</h3>
            <p>
              Scripts que rodam em background, independentes da pagina.
              Interceptam requisicoes de rede e permitem funcionalidades
              offline, push notifications e sincronizacao em background.
            </p>
            <Link to="/devtools" className="feature-link">
              Ver status do SW &rarr;
            </Link>
          </div>

          <div className="feature-card">
            <h3>Cache API</h3>
            <p>
              Permite armazenar pares de request/response no navegador.
              Combinada com Service Workers, possibilita diferentes
              estrategias: Cache-First, Network-First e Stale-While-Revalidate.
            </p>
            <Link to="/devtools" className="feature-link">
              Inspecionar caches &rarr;
            </Link>
          </div>

          <div className="feature-card">
            <h3>Offline-First</h3>
            <p>
              O app funciona mesmo sem internet! Dados sao persistidos
              localmente com IndexedDB e sincronizados quando a conexao
              e restaurada. Experimente desligar o Wi-Fi!
            </p>
            <Link to="/notes" className="feature-link">
              Testar notas offline &rarr;
            </Link>
          </div>

          <div className="feature-card">
            <h3>Instalavel</h3>
            <p>
              Com o Web App Manifest, a PWA pode ser instalada na tela
              inicial do dispositivo, funcionando como um app nativo
              com icone proprio e tela cheia.
            </p>
          </div>
        </div>
      </section>

      <section className="concepts">
        <h2>Conceitos Demonstrados</h2>
        <ul className="concept-list">
          <li>
            <strong>App Shell</strong> — Estrutura minima (HTML, CSS, JS) cacheada na instalacao do SW para carregamento instantaneo
          </li>
          <li>
            <strong>Precaching</strong> — Assets criticos sao cacheados durante o evento install do SW
          </li>
          <li>
            <strong>Runtime Caching</strong> — Assets dinamicos sao cacheados na primeira requisicao
          </li>
          <li>
            <strong>Cache Versioning</strong> — Caches versionados permitem atualizacoes limpas
          </li>
          <li>
            <strong>IndexedDB</strong> — Banco de dados no navegador para persistencia offline de dados do usuario
          </li>
          <li>
            <strong>Web App Manifest</strong> — Arquivo JSON que define como o app aparece quando instalado
          </li>
        </ul>
      </section>

      <section className="test-section">
        <h2>Como Testar</h2>
        <div className="test-steps">
          <div className="test-step">
            <span className="test-step-number">1</span>
            <div>
              <strong>Navegue pelo app</strong>
              <p>Visite a pagina de Notas e crie algumas notas.</p>
            </div>
          </div>
          <div className="test-step">
            <span className="test-step-number">2</span>
            <div>
              <strong>Ative o modo offline</strong>
              <p>DevTools do Chrome &rarr; Network &rarr; marque "Offline"</p>
            </div>
          </div>
          <div className="test-step">
            <span className="test-step-number">3</span>
            <div>
              <strong>Recarregue a pagina</strong>
              <p>O app continua funcionando! Suas notas estao salvas localmente.</p>
            </div>
          </div>
          <div className="test-step">
            <span className="test-step-number">4</span>
            <div>
              <strong>Inspecione os caches</strong>
              <p>Va para a pagina DevTools e veja quais recursos foram cacheados.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
