/**
 * Estado de conectividade observável, com override manual.
 *
 * Não importa NetInfo de propósito: quem conhece a biblioteca é o
 * `netInfoBridge`. Assim esta classe roda em Node, dentro dos testes, sem
 * arrastar React Native junto.
 *
 * O override manual existe para a apresentação: "forçar offline" na tela de
 * debug é mais confiável do que pedir para a banca desligar o Wi-Fi.
 */

export class Connectivity {
  private reachable = true;
  private forcedOffline = false;
  private listeners = new Set<() => void>();
  /** Repassa o modo offline ao servidor fake, para as chamadas falharem de verdade. */
  private onForcedChange: ((offline: boolean) => void) | null = null;

  get isOnline(): boolean {
    return this.reachable && !this.forcedOffline;
  }

  get isForcedOffline(): boolean {
    return this.forcedOffline;
  }

  /** Chamado pelo bridge de NetInfo a cada mudança real de rede. */
  setReachable(reachable: boolean): void {
    if (this.reachable === reachable) return;
    this.reachable = reachable;
    this.emit();
  }

  setForcedOffline(offline: boolean): void {
    if (this.forcedOffline === offline) return;
    this.forcedOffline = offline;
    this.onForcedChange?.(offline);
    this.emit();
  }

  onForcedOfflineChange(handler: (offline: boolean) => void): void {
    this.onForcedChange = handler;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}
