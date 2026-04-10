import { useState, useCallback } from 'react';

interface CacheEntry {
  name: string;
  count: number;
  urls: string[];
}

export function CacheViewer() {
  const [caches, setCaches] = useState<CacheEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadCaches = useCallback(async () => {
    setLoading(true);
    try {
      const cacheNames = await window.caches.keys();
      const entries: CacheEntry[] = [];

      for (const name of cacheNames) {
        const cache = await window.caches.open(name);
        const keys = await cache.keys();
        entries.push({
          name,
          count: keys.length,
          urls: keys.map((req) => {
            const url = new URL(req.url);
            return url.pathname + url.search;
          }),
        });
      }

      setCaches(entries);
    } catch (err) {
      console.error('[CacheViewer] Erro ao carregar caches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="devtools-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Cache Storage</h3>
        <button className="btn btn--small btn--primary" onClick={loadCaches} disabled={loading}>
          {loading ? 'Carregando...' : 'Inspecionar Caches'}
        </button>
      </div>

      {caches.length === 0 && !loading && (
        <p style={{ color: '#888', marginTop: '12px' }}>
          Clique em "Inspecionar Caches" para ver os recursos armazenados pelo Service Worker.
        </p>
      )}

      <div className="cache-list">
        {caches.map((cache) => (
          <div key={cache.name} className="cache-entry">
            <button
              className="cache-entry-header"
              onClick={() => setExpanded(expanded === cache.name ? null : cache.name)}
            >
              <span className="cache-name">{cache.name}</span>
              <span className="cache-count">{cache.count} recursos</span>
              <span className="cache-toggle">{expanded === cache.name ? '\u25B2' : '\u25BC'}</span>
            </button>

            {expanded === cache.name && (
              <ul className="cache-urls">
                {cache.urls.map((url) => (
                  <li key={url} className="cache-url">{url}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="cache-strategies-info">
        <h4>Estrategias de Cache neste App</h4>
        <div className="strategy-cards">
          <div className="strategy-card">
            <h5>Cache-First</h5>
            <p>Assets estaticos (.js, .css, .png)</p>
            <code>Cache → Network (fallback)</code>
          </div>
          <div className="strategy-card">
            <h5>Network-First</h5>
            <p>Dados da API (/api/*)</p>
            <code>Network → Cache (fallback)</code>
          </div>
          <div className="strategy-card">
            <h5>Stale-While-Revalidate</h5>
            <p>Navegacao (HTML)</p>
            <code>Cache (stale) + Network (background)</code>
          </div>
        </div>
      </div>
    </div>
  );
}
