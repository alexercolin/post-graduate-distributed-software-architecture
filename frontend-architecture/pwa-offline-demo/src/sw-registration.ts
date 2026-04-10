// ============================================================
// SERVICE WORKER REGISTRATION
// ============================================================
// Este módulo encapsula a lógica de registro do Service Worker.
// Separado do main.tsx para clareza e para que os alunos possam
// estudar o processo de registro isoladamente.
//
// O registro do SW é feito APÓS o evento 'load' da window para
// não competir com o carregamento inicial da página.

export type SwState = 'unsupported' | 'registering' | 'installing' | 'waiting' | 'active' | 'error';

export interface SwCallbacks {
  onStateChange?: (state: SwState) => void;
  onUpdateAvailable?: (registration: ServiceWorkerRegistration) => void;
}

export function registerServiceWorker(callbacks?: SwCallbacks): void {
  // Verifica se o navegador suporta Service Workers
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW Registration] Service Workers não suportados neste navegador');
    callbacks?.onStateChange?.('unsupported');
    return;
  }

  // Aguarda o carregamento completo da página antes de registrar.
  // Isso evita que o precache do SW dispute banda com os recursos
  // da página durante o carregamento inicial.
  window.addEventListener('load', async () => {
    try {
      callbacks?.onStateChange?.('registering');

      // Registra o SW. O arquivo sw.js está em public/ e é servido do root.
      // O scope '/' significa que o SW controlará TODAS as páginas do app.
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW Registration] Registrado com sucesso, scope:', registration.scope);

      // Detecta o estado atual do SW
      if (registration.installing) {
        console.log('[SW Registration] SW está instalando...');
        callbacks?.onStateChange?.('installing');
        trackInstallation(registration.installing, registration, callbacks);
      } else if (registration.waiting) {
        console.log('[SW Registration] SW está esperando (update disponível)');
        callbacks?.onStateChange?.('waiting');
        callbacks?.onUpdateAvailable?.(registration);
      } else if (registration.active) {
        console.log('[SW Registration] SW está ativo');
        callbacks?.onStateChange?.('active');
      }

      // Escuta por novas versões do SW
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        console.log('[SW Registration] Nova versão encontrada, instalando...');
        callbacks?.onStateChange?.('installing');
        trackInstallation(newWorker, registration, callbacks);
      });
    } catch (error) {
      console.error('[SW Registration] Falha no registro:', error);
      callbacks?.onStateChange?.('error');
    }
  });
}

// Acompanha a transição do SW de 'installing' → 'installed' → 'activated'
function trackInstallation(
  worker: ServiceWorker,
  registration: ServiceWorkerRegistration,
  callbacks?: SwCallbacks
): void {
  worker.addEventListener('statechange', () => {
    console.log(`[SW Registration] State changed to: ${worker.state}`);

    switch (worker.state) {
      case 'installed':
        if (navigator.serviceWorker.controller) {
          // Já existe um SW controlando a página, o novo está esperando
          console.log('[SW Registration] Update instalado, aguardando ativação');
          callbacks?.onStateChange?.('waiting');
          callbacks?.onUpdateAvailable?.(registration);
        } else {
          // Primeira instalação
          console.log('[SW Registration] Primeira instalação concluída');
          callbacks?.onStateChange?.('active');
        }
        break;
      case 'activated':
        console.log('[SW Registration] SW ativado');
        callbacks?.onStateChange?.('active');
        break;
      case 'redundant':
        console.log('[SW Registration] SW descartado (redundant)');
        break;
    }
  });
}

// Envia mensagem para o SW pular a fase de waiting e ativar imediatamente
export function skipWaiting(registration: ServiceWorkerRegistration): void {
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
}
