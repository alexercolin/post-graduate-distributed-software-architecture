import { useState, useEffect, useCallback } from 'react';
import { registerServiceWorker, skipWaiting as swSkipWaiting } from '../sw-registration';
import type { SwState } from '../sw-registration';

// Hook que expõe o estado do Service Worker para componentes React.
// Permite que a UI mostre o lifecycle do SW (installing, waiting, active)
// e ofereça um botão "Atualizar" quando um update estiver disponível.

export function useServiceWorker() {
  const [swState, setSwState] = useState<SwState>('registering');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    registerServiceWorker({
      onStateChange: (state) => {
        setSwState(state);
      },
      onUpdateAvailable: (reg) => {
        setUpdateAvailable(true);
        setRegistration(reg);
      },
    });
  }, []);

  const applyUpdate = useCallback(() => {
    if (registration) {
      swSkipWaiting(registration);
      // Recarrega a página para usar o novo SW
      window.location.reload();
    }
  }, [registration]);

  return {
    swState,
    updateAvailable,
    applyUpdate,
  };
}
