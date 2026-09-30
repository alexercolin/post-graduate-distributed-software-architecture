/**
 * Task periódica de background.
 *
 * O SO decide quando roda — `minimumInterval` é um piso, não um agendamento.
 * Em Expo Go o módulo nativo não existe: registrar falha e o app segue com os
 * gatilhos de foreground. A tela de debug mostra esse estado em vez de esconder.
 */

import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { BACKGROUND_SYNC_MINUTES } from '../config';

export const BACKGROUND_SYNC_TASK = 'offline-feed-background-sync';

export type BackgroundSyncStatus = 'registered' | 'restricted' | 'unavailable';

/**
 * A task é definida no escopo do módulo (exigência do TaskManager: precisa
 * existir antes de o app terminar de montar). O handler é injetado depois, na
 * composição — assim este arquivo não conhece o repositório.
 */
let handler: (() => Promise<void>) | null = null;

export function setBackgroundSyncHandler(next: () => Promise<void>): void {
  handler = next;
}

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    await handler?.();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundSync(): Promise<BackgroundSyncStatus> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return 'restricted';

    await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: BACKGROUND_SYNC_MINUTES,
    });
    return 'registered';
  } catch {
    // Expo Go, web, ou usuário com background app refresh desligado.
    return 'unavailable';
  }
}

export async function unregisterBackgroundSync(): Promise<void> {
  try {
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  } catch {
    // Nunca chegou a registrar: nada a desfazer.
  }
}

/** Só funciona em build de debug. Botão da tela de debug. */
export async function triggerBackgroundSyncForTesting(): Promise<boolean> {
  try {
    return await BackgroundTask.triggerTaskWorkerForTestingAsync();
  } catch {
    return false;
  }
}
