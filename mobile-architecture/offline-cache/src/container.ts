/**
 * Composition root: o único arquivo que conhece todas as camadas ao mesmo tempo.
 *
 * Nenhuma camada instancia a de baixo por conta própria — é isso que permite
 * trocar `MockServer` por HTTP real, ou `FileSystemImageCache` por outro cache,
 * sem tocar em UI, domínio ou repositório.
 */

import { CACHE_BUDGET_BYTES } from './config';
import { FileSystemImageCache } from './data/images/fileSystemImageCache';
import { db } from './data/local/db';
import { DrizzleLocalStore } from './data/local/drizzleLocalStore';
import { MockServer } from './data/remote/mockServer';
import { MockRemoteDataSource } from './data/remote/remoteDataSource';
import { FeedRepository } from './data/repository/feedRepository';
import { Connectivity } from './sync/connectivity';
import { startNetInfoBridge } from './sync/netInfoBridge';
import { SyncEngine } from './sync/syncEngine';

export interface AppContainer {
  store: DrizzleLocalStore;
  images: FileSystemImageCache;
  server: MockServer;
  connectivity: Connectivity;
  syncEngine: SyncEngine;
  repository: FeedRepository;
}

let container: AppContainer | null = null;

export function getContainer(): AppContainer {
  if (container !== null) return container;

  const store = new DrizzleLocalStore(db);
  const images = new FileSystemImageCache(CACHE_BUDGET_BYTES);
  const server = new MockServer();
  const remote = new MockRemoteDataSource(server);
  const connectivity = new Connectivity();
  const syncEngine = new SyncEngine({ store, remote, images });
  const repository = new FeedRepository({ store, images, sync: syncEngine, connectivity });

  // "Forçar offline" na tela de debug precisa fazer a requisição falhar de
  // verdade, não só pintar o banner: é assim que o outbox e o retry aparecem.
  connectivity.onForcedOfflineChange((offline) => server.setOffline(offline));
  startNetInfoBridge(connectivity);

  container = { store, images, server, connectivity, syncEngine, repository };
  return container;
}
