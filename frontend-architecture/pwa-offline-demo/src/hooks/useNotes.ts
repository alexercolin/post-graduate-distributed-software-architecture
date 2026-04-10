import { useState, useEffect, useCallback } from 'react';
import type { Note, NoteWithStatus } from '../types/note';
import { fetchNotesFromApi } from '../services/notes-api';
import { getAllNotes, saveNote, saveNotes, deleteNoteById } from '../services/indexeddb';

// Hook que orquestra a lógica offline-first de notas:
//
// 1. Carrega notas do IndexedDB primeiro (instantâneo, funciona offline)
// 2. Tenta buscar da API em paralelo
// 3. Se a API responder, sincroniza os dados no IndexedDB
// 4. Notas criadas localmente são marcadas com syncStatus: 'local'
//
// Isso garante que o app funciona offline desde o primeiro momento
// e sincroniza quando há conexão disponível.

export function useNotes() {
  const [notes, setNotes] = useState<NoteWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // IDs das notas que vieram da API (para diferenciar de locais)
  const [apiNoteIds, setApiNoteIds] = useState<Set<string>>(new Set());

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Passo 1: Carrega do IndexedDB (funciona offline)
      const localNotes = await getAllNotes();

      const notesWithStatus: NoteWithStatus[] = localNotes.map((note) => ({
        ...note,
        syncStatus: apiNoteIds.has(note.id) ? 'synced' : 'local',
      }));

      // Ordena por data de atualização (mais recente primeiro)
      notesWithStatus.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setNotes(notesWithStatus);
    } catch (err) {
      console.error('[useNotes] Erro ao carregar notas:', err);
      setError('Erro ao carregar notas');
    } finally {
      setLoading(false);
    }
  }, [apiNoteIds]);

  // Sincroniza com a API (se online)
  const syncWithApi = useCallback(async () => {
    try {
      const apiNotes = await fetchNotesFromApi();
      const newApiIds = new Set(apiNotes.map((n) => n.id));
      setApiNoteIds(newApiIds);

      // Salva notas da API no IndexedDB
      await saveNotes(apiNotes);

      // Recarrega todas as notas (API + locais)
      const allNotes = await getAllNotes();
      const notesWithStatus: NoteWithStatus[] = allNotes.map((note) => ({
        ...note,
        syncStatus: newApiIds.has(note.id) ? 'synced' : 'local',
      }));

      notesWithStatus.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setNotes(notesWithStatus);
    } catch {
      // Se a API falhar (ex: offline), não é erro — temos dados locais
      console.log('[useNotes] API indisponível, usando dados locais');
    }
  }, []);

  // Carrega dados na montagem
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        // Tenta carregar da API primeiro
        const apiNotes = await fetchNotesFromApi();
        const newApiIds = new Set(apiNotes.map((n) => n.id));
        setApiNoteIds(newApiIds);
        await saveNotes(apiNotes);
      } catch {
        console.log('[useNotes] Init: API indisponível');
      }

      // Carrega tudo do IndexedDB (API + local)
      const allNotes = await getAllNotes();
      const notesWithStatus: NoteWithStatus[] = allNotes.map((note) => ({
        ...note,
        syncStatus: apiNoteIds.has(note.id) ? 'synced' : 'local',
      }));

      notesWithStatus.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setNotes(notesWithStatus);
      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── CRUD Operations ───────────────────────────────────────

  const addNote = useCallback(
    async (title: string, content: string, category: string) => {
      const now = new Date().toISOString();
      const note: Note = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title,
        content,
        category,
        createdAt: now,
        updatedAt: now,
      };

      await saveNote(note);
      await loadNotes();
    },
    [loadNotes]
  );

  const updateNote = useCallback(
    async (id: string, title: string, content: string, category: string) => {
      const allNotes = await getAllNotes();
      const existing = allNotes.find((n) => n.id === id);
      if (!existing) return;

      const updated: Note = {
        ...existing,
        title,
        content,
        category,
        updatedAt: new Date().toISOString(),
      };

      await saveNote(updated);
      await loadNotes();
    },
    [loadNotes]
  );

  const removeNote = useCallback(
    async (id: string) => {
      await deleteNoteById(id);
      await loadNotes();
    },
    [loadNotes]
  );

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    removeNote,
    syncWithApi,
  };
}
