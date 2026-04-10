// ============================================================
// SERVICE WORKER — StudyNotes PWA
// ============================================================
// Este arquivo é o coração da PWA. Ele roda em uma thread separada
// do main thread do navegador e age como um proxy entre o app
// e a rede, interceptando todas as requisições HTTP.
//
// O Service Worker NÃO tem acesso ao DOM. Ele se comunica com
// a página via postMessage e eventos.
//
// Lifecycle: Install → Activate → Fetch (loop)
// ============================================================

// ============================================================
// 1. CONFIGURAÇÃO DE CACHE
// ============================================================
// Usamos nomes de cache versionados para que, ao atualizar assets,
// o cache antigo possa ser limpo durante o evento 'activate'.
// Basta incrementar CACHE_VERSION para forçar uma atualização.

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Assets que serão pré-cacheados durante a instalação do SW.
// Estes formam o "App Shell" — o mínimo necessário para o app
// renderizar mesmo sem internet.
//
// NOTA: Assets gerados pelo Vite (ex: /assets/index-abc123.js)
// possuem hashes no nome e não podem ser listados aqui.
// Eles serão cacheados dinamicamente na primeira requisição
// usando a estratégia Cache-First.
const ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// ============================================================
// 2. EVENTO INSTALL — Precache do App Shell
// ============================================================
// O evento 'install' é disparado quando o navegador detecta um
// SW novo (ou modificado). É aqui que fazemos o precache dos
// assets essenciais do App Shell.
//
// O SW fica no estado "installing" até que event.waitUntil()
// resolve. Se o precache falhar, a instalação falha e o SW
// antigo continua ativo.

self.addEventListener('install', (event) => {
  console.log('[SW] Install — precaching app shell...');

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // addAll() faz fetch de cada URL e armazena no cache.
      // Se QUALQUER request falhar, todo o precache falha.
      return cache.addAll(ASSETS_TO_PRECACHE);
    })
  );

  // skipWaiting() faz o SW novo assumir imediatamente,
  // sem esperar que todas as tabs do app sejam fechadas.
  //
  // CUIDADO em produção: isso pode causar inconsistências se
  // o SW novo serve assets diferentes dos que a página antiga
  // espera. Para fins educacionais, usamos skipWaiting().
  self.skipWaiting();
});

// ============================================================
// 3. EVENTO ACTIVATE — Limpeza de Caches Antigos
// ============================================================
// O evento 'activate' é disparado quando o SW assume o controle.
// É o momento ideal para limpar caches de versões anteriores.
//
// Sem essa limpeza, caches antigos acumulariam indefinidamente
// no storage do navegador.

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate — cleaning old caches...');

  const currentCaches = [STATIC_CACHE, API_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
    })
  );

  // clients.claim() faz o SW assumir o controle de TODAS as
  // páginas abertas imediatamente, sem precisar de reload.
  // Sem isso, o SW só controlaria páginas abertas APÓS a ativação.
  self.clients.claim();
});

// ============================================================
// 4. EVENTO FETCH — Roteador de Estratégias de Cache
// ============================================================
// Este é o evento mais importante! Toda requisição HTTP feita
// pelo app passa por aqui. Baseado no tipo de request, aplicamos
// diferentes estratégias de cache.
//
// Fluxo:
//   Request chega → Identifica o tipo → Aplica a estratégia correta
//
// Estratégias implementadas:
//   - Cache-First    → Para assets estáticos (JS, CSS, imagens)
//   - Network-First  → Para dados de API
//   - Stale-While-Revalidate → Para navegação (HTML)

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requests que não são HTTP/HTTPS (ex: chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // ─── ESTRATÉGIA 1: Cache-First para assets estáticos ───
  // Assets como JS, CSS e imagens raramente mudam (e no Vite,
  // possuem hash no nome). Cache-First é perfeito aqui pois
  // a resposta é instantânea e o asset é imutável.
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ─── ESTRATÉGIA 2: Network-First para requisições de API ───
  // Dados da API podem mudar a qualquer momento, então tentamos
  // buscar da rede primeiro. O cache serve como fallback para
  // quando o usuário está offline.
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // ─── ESTRATÉGIA 3: Stale-While-Revalidate para navegação ───
  // Para o HTML do app, queremos resposta rápida (do cache)
  // MAS também queremos atualizar em background. Assim, na
  // próxima visita o usuário terá a versão mais recente.
  if (isNavigationRequest(request)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // ─── DEFAULT: Network only ───
  // Qualquer outra request vai direto para a rede sem cache.
  event.respondWith(fetch(request));
});

// ============================================================
// 5. ESTRATÉGIAS DE CACHE
// ============================================================

// ─────────────────────────────────────────────────────────────
// CACHE-FIRST (Cache, falling back to network)
// ─────────────────────────────────────────────────────────────
// Fluxo:
//   1. Verifica se o recurso está no cache
//   2. Se SIM → retorna do cache (instantâneo!)
//   3. Se NÃO → busca da rede, salva no cache, retorna
//
// Quando usar:
//   - Assets estáticos que raramente mudam (JS, CSS, imagens, fontes)
//   - Assets com hash no nome (ex: index-abc123.js)
//
// Trade-offs:
//   ✅ Resposta instantânea para recursos cacheados
//   ✅ Funciona offline para recursos já cacheados
//   ❌ Pode servir versão desatualizada se o asset mudar sem mudar a URL
//       (por isso o Vite usa hashes nos nomes!)

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log(`[SW] Cache-First HIT: ${request.url}`);
    return cachedResponse;
  }

  console.log(`[SW] Cache-First MISS: ${request.url} → fetching from network`);

  try {
    const networkResponse = await fetch(request);

    // Só cacheia respostas válidas (status 200).
    // clone() é necessário porque um Response só pode ser consumido uma vez.
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error(`[SW] Cache-First ERROR: ${request.url}`, error);
    // Se nem cache nem rede funcionaram, retorna um erro genérico
    return new Response('Recurso não disponível offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// ─────────────────────────────────────────────────────────────
// NETWORK-FIRST (Network, falling back to cache)
// ─────────────────────────────────────────────────────────────
// Fluxo:
//   1. Tenta buscar da rede
//   2. Se a rede responder → atualiza o cache e retorna
//   3. Se a rede falhar → retorna do cache (fallback offline)
//
// Quando usar:
//   - Dados que mudam frequentemente (APIs, feeds)
//   - Situações onde frescor dos dados é mais importante que velocidade
//
// Trade-offs:
//   ✅ Sempre tenta buscar a versão mais recente
//   ✅ Cache serve como fallback offline
//   ❌ Mais lento que Cache-First quando online (espera a rede)

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    console.log(`[SW] Network-First: trying network for ${request.url}`);
    const networkResponse = await fetch(request);

    // Atualiza o cache com a resposta mais recente da rede
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Rede falhou (provavelmente offline) — tenta o cache
    console.log(`[SW] Network-First: network failed, trying cache for ${request.url}`);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log(`[SW] Network-First: serving from cache ${request.url}`);
      return cachedResponse;
    }

    // Nem rede nem cache disponíveis
    console.error(`[SW] Network-First: no cache available for ${request.url}`);
    return new Response(JSON.stringify({ error: 'Dados não disponíveis offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ─────────────────────────────────────────────────────────────
// STALE-WHILE-REVALIDATE
// ─────────────────────────────────────────────────────────────
// Fluxo:
//   1. Retorna do cache imediatamente (mesmo que "stale"/desatualizado)
//   2. Em PARALELO, busca da rede em background
//   3. Se a rede responder, atualiza o cache para a próxima vez
//
// Quando usar:
//   - Conteúdo que muda, mas onde velocidade de resposta é prioridade
//   - Páginas HTML do app (app shell)
//   - Dados onde um leve atraso na atualização é aceitável
//
// Trade-offs:
//   ✅ Resposta instantânea (do cache)
//   ✅ Cache é atualizado em background
//   ❌ O usuário pode ver dados "stale" até o próximo acesso
//   ❌ Mais complexo de implementar e depurar

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Dispara o fetch em background (não esperamos o resultado)
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        console.log(`[SW] SWR: updating cache in background for ${request.url}`);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log(`[SW] SWR: background fetch failed for ${request.url}`, error);
    });

  if (cachedResponse) {
    console.log(`[SW] SWR: serving stale from cache ${request.url}`);
    return cachedResponse;
  }

  // Se não há nada no cache, espera o fetch da rede
  console.log(`[SW] SWR: no cache, waiting for network ${request.url}`);
  return fetchPromise;
}

// ============================================================
// 6. HELPERS — Identificação do Tipo de Request
// ============================================================

// Verifica se a URL é um asset estático (JS, CSS, imagem, fonte)
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.gif', '.woff', '.woff2', '.ttf', '.ico'];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

// Verifica se a URL é uma requisição de API
function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

// Verifica se é uma requisição de navegação (usuário digitou URL ou clicou link)
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// ============================================================
// 7. MENSAGENS — Comunicação com a Página
// ============================================================
// O SW pode receber mensagens da página via postMessage.
// Isso é útil para forçar skip waiting ou enviar informações
// sobre o estado do cache.

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    getCacheInfo().then((info) => {
      event.source.postMessage({ type: 'CACHE_INFO', payload: info });
    });
  }
});

// Coleta informações sobre os caches para exibir na UI
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = [];

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    info.push({
      name,
      count: keys.length,
      urls: keys.map((req) => req.url),
    });
  }

  return info;
}
