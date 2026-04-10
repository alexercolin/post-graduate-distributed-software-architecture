import { useState, useEffect } from 'react';

// O evento 'beforeinstallprompt' é disparado pelo navegador quando
// o app atende aos critérios de instalação de uma PWA:
// 1. Tem um Web App Manifest válido
// 2. É servido via HTTPS (ou localhost)
// 3. Tem um Service Worker registrado
// 4. O usuário ainda não instalou o app
//
// NOTA: Este evento só funciona em navegadores Chromium (Chrome, Edge).
// Safari e Firefox têm fluxos de instalação diferentes.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      // Previne o mini-infobar padrão do Chrome
      e.preventDefault();
      // Salva o evento para usar depois
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Mostra o prompt nativo de instalação
    await deferredPrompt.prompt();

    // Aguarda a decisão do usuário
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[Install] Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);

    // O prompt só pode ser usado uma vez
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <div>
          <strong>Instalar StudyNotes</strong>
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.85rem' }}>
            Acesse suas notas como um app nativo, mesmo offline!
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn--small btn--secondary" onClick={() => setIsVisible(false)}>
            Depois
          </button>
          <button className="btn btn--small btn--primary" onClick={handleInstall}>
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
