/**
 * Os quatro gatilhos de sincronização.
 *
 *  1. abertura do app          -> FeedRepository.bootstrap()
 *  2. retorno ao foreground    -> AppState
 *  3. offline -> online        -> Connectivity (NetInfo)
 *  4. task periódica           -> backgroundSync
 *
 * Nenhum deles precisa saber se outro já está rodando: o `SyncEngine` descarta
 * chamadas concorrentes.
 */

import { AppState, type AppStateStatus } from 'react-native';

import type { FeedRepository } from '../data/repository/feedRepository';
import type { Connectivity } from './connectivity';
import { registerBackgroundSync, setBackgroundSyncHandler, type BackgroundSyncStatus } from './backgroundSync';

export interface TriggerHandle {
  stop: () => void;
  backgroundStatus: Promise<BackgroundSyncStatus>;
}

export function installSyncTriggers(
  repository: FeedRepository,
  connectivity: Connectivity,
): TriggerHandle {
  let previousAppState: AppStateStatus = AppState.currentState;
  let wasOnline = connectivity.isOnline;

  const appStateSubscription = AppState.addEventListener('change', (next) => {
    const returnedToForeground = previousAppState.match(/inactive|background/) && next === 'active';
    previousAppState = next;
    if (returnedToForeground) void repository.sync('foreground');
  });

  const unsubscribeConnectivity = connectivity.subscribe(() => {
    const isOnline = connectivity.isOnline;
    // Só a transição offline -> online interessa; ficar online não é evento.
    if (isOnline && !wasOnline) void repository.sync('connectivity-restored');
    wasOnline = isOnline;
  });

  setBackgroundSyncHandler(async () => {
    await repository.sync('background-task');
  });

  return {
    stop: () => {
      appStateSubscription.remove();
      unsubscribeConnectivity();
    },
    backgroundStatus: registerBackgroundSync(),
  };
}
