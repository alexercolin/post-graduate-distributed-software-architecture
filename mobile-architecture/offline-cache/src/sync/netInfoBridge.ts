/**
 * Liga o `Connectivity` (puro) ao NetInfo (nativo). Único arquivo que conhece a
 * biblioteca — é o que mantém o resto do sync testável fora do emulador.
 */

import NetInfo from '@react-native-community/netinfo';

import type { Connectivity } from './connectivity';

export function startNetInfoBridge(connectivity: Connectivity): () => void {
  return NetInfo.addEventListener((state) => {
    // `isInternetReachable` pode vir `null` enquanto o SO ainda não decidiu;
    // nesse caso confiamos em `isConnected` para não piscar o banner à toa.
    connectivity.setReachable(state.isInternetReachable ?? state.isConnected ?? false);
  });
}
