// ============================================================
// IndexedDB Service — Persistência Offline
// ============================================================
// IndexedDB é um banco de dados NoSQL no navegador. Diferente do
// localStorage (que é síncrono e limitado a ~5MB de strings),
// IndexedDB é assíncrono e suporta dados estruturados em grande volume.
//
// Este módulo usa a API nativa do IndexedDB (sem bibliotecas)
// para fins educacionais. Cada operação é envolvida em uma Promise
// para facilitar o uso com async/await.

import type { Note } from '../types/note';

const DB_NAME = 'StudyNotesDB';
const DB_VERSION = 1;
const STORE_NAME = 'notes';

// ─── Abrir/Criar o Banco ─────────────────────────────────────
// O IndexedDB usa um sistema de versionamento. Quando a versão
// muda, o evento 'onupgradeneeded' é disparado, permitindo
// criar ou modificar object stores (equivalente a tabelas).

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Este evento só é disparado quando o banco é criado pela
    // primeira vez OU quando DB_VERSION é incrementado.
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Cria o object store se não existir
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // keyPath: 'id' significa que o campo 'id' de cada objeto
        // será usado como chave primária.
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

        // Índices permitem buscar por campos específicos
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Buscar Todas as Notas ───────────────────────────────────
// Abre uma transação de leitura e retorna todos os registros.
// Uma transação no IndexedDB garante atomicidade da operação.

export async function getAllNotes(): Promise<Note[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    // 'readonly' porque só estamos lendo dados
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    // Sempre fechar o banco quando a transação terminar
    transaction.oncomplete = () => db.close();
  });
}

// ─── Buscar Uma Nota por ID ──────────────────────────────────

export async function getNoteById(id: string): Promise<Note | undefined> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result ?? undefined);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

// ─── Adicionar ou Atualizar uma Nota ─────────────────────────
// put() insere se a chave não existe, ou atualiza se já existe.
// É o equivalente a um "upsert".

export async function saveNote(note: Note): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    // 'readwrite' porque estamos modificando dados
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(note);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

// ─── Salvar Múltiplas Notas (Batch) ──────────────────────────
// Útil para sincronizar dados da API para o IndexedDB.
// Todas as operações ocorrem na mesma transação para garantir
// atomicidade — ou todas são salvas, ou nenhuma é.

export async function saveNotes(notes: Note[]): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    for (const note of notes) {
      store.put(note);
    }

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

// ─── Deletar uma Nota ────────────────────────────────────────

export async function deleteNoteById(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}
