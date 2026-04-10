import { useState, useEffect } from 'react';

// Hook que monitora o estado de conexão do navegador.
// Usa navigator.onLine + eventos 'online'/'offline' da window.
//
// NOTA: navigator.onLine pode dar falso-positivo (ex: conectado
// a um Wi-Fi sem internet). Para detecção mais robusta em produção,
// faça ping a um endpoint conhecido.

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
