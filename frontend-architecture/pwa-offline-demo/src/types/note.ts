export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// Status de sincronização de uma nota
// - 'synced': nota veio da API e está sincronizada
// - 'local': nota criada localmente (ainda não enviada à API)
export type SyncStatus = 'synced' | 'local';

export interface NoteWithStatus extends Note {
  syncStatus: SyncStatus;
}
