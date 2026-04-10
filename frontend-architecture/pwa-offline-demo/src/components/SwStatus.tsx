import { useServiceWorker } from '../hooks/useServiceWorker';

const stateLabels: Record<string, { label: string; color: string }> = {
  unsupported: { label: 'Nao Suportado', color: '#888' },
  registering: { label: 'Registrando...', color: '#ffa726' },
  installing: { label: 'Instalando...', color: '#ffa726' },
  waiting: { label: 'Update Disponivel', color: '#42a5f5' },
  active: { label: 'Ativo', color: '#00c853' },
  error: { label: 'Erro', color: '#e94560' },
};

export function SwStatus() {
  const { swState, updateAvailable, applyUpdate } = useServiceWorker();
  const stateInfo = stateLabels[swState] ?? stateLabels.error;

  return (
    <div className="devtools-panel">
      <h3>Service Worker Status</h3>

      <div className="sw-status-grid">
        <div className="sw-status-item">
          <span className="sw-status-label">Estado atual</span>
          <span
            className="sw-status-value"
            style={{ color: stateInfo.color }}
          >
            {stateInfo.label}
          </span>
        </div>

        <div className="sw-status-item">
          <span className="sw-status-label">Suporte</span>
          <span className="sw-status-value">
            {'serviceWorker' in navigator ? 'Sim' : 'Nao'}
          </span>
        </div>

        <div className="sw-status-item">
          <span className="sw-status-label">Controller ativo</span>
          <span className="sw-status-value">
            {navigator.serviceWorker?.controller ? 'Sim' : 'Nao'}
          </span>
        </div>
      </div>

      {updateAvailable && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ color: '#42a5f5', marginBottom: '8px' }}>
            Uma nova versao do Service Worker esta disponivel!
          </p>
          <button className="btn btn--primary btn--small" onClick={applyUpdate}>
            Aplicar Update e Recarregar
          </button>
        </div>
      )}

      <div className="sw-lifecycle-diagram">
        <h4>Lifecycle do Service Worker</h4>
        <div className="lifecycle-steps">
          <div className={`lifecycle-step ${swState === 'installing' ? 'lifecycle-step--active' : ''}`}>
            <div className="lifecycle-dot" />
            <span>Install</span>
            <small>Precache do App Shell</small>
          </div>
          <div className="lifecycle-arrow">&rarr;</div>
          <div className={`lifecycle-step ${swState === 'waiting' ? 'lifecycle-step--active' : ''}`}>
            <div className="lifecycle-dot" />
            <span>Waiting</span>
            <small>Aguardando ativacao</small>
          </div>
          <div className="lifecycle-arrow">&rarr;</div>
          <div className={`lifecycle-step ${swState === 'active' ? 'lifecycle-step--active' : ''}`}>
            <div className="lifecycle-dot" />
            <span>Active</span>
            <small>Interceptando fetches</small>
          </div>
        </div>
      </div>
    </div>
  );
}
