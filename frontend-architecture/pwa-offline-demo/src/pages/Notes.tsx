import { useState } from 'react';
import { useNotes } from '../hooks/useNotes';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { NoteCard } from '../components/NoteCard';
import { NoteEditor } from '../components/NoteEditor';
import type { NoteWithStatus } from '../types/note';

export function Notes() {
  const { notes, loading, addNote, updateNote, removeNote, syncWithApi } = useNotes();
  const { isOnline } = useOnlineStatus();
  const [editingNote, setEditingNote] = useState<NoteWithStatus | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const categories = ['all', ...new Set(notes.map((n) => n.category))];
  const filteredNotes = filter === 'all' ? notes : notes.filter((n) => n.category === filter);

  const handleSave = async (title: string, content: string, category: string) => {
    if (editingNote) {
      await updateNote(editingNote.id, title, content, category);
    } else {
      await addNote(title, content, category);
    }
    setShowEditor(false);
    setEditingNote(null);
  };

  const handleEdit = (note: NoteWithStatus) => {
    setEditingNote(note);
    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    await removeNote(id);
  };

  const handleNew = () => {
    setEditingNote(null);
    setShowEditor(true);
  };

  return (
    <div className="page notes-page">
      <div className="notes-header">
        <div>
          <h1>Minhas Notas</h1>
          <p className="notes-subtitle">
            {notes.length} nota{notes.length !== 1 ? 's' : ''} &middot;{' '}
            {notes.filter((n) => n.syncStatus === 'local').length} local
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isOnline && (
            <button className="btn btn--secondary" onClick={syncWithApi}>
              Sincronizar
            </button>
          )}
          <button className="btn btn--primary" onClick={handleNew}>
            + Nova Nota
          </button>
        </div>
      </div>

      <div className="notes-filters">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${filter === cat ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat === 'all' ? 'Todas' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="notes-empty">Carregando notas...</div>
      ) : filteredNotes.length === 0 ? (
        <div className="notes-empty">
          <p>Nenhuma nota encontrada.</p>
          <p>Crie sua primeira nota clicando em "+ Nova Nota"</p>
        </div>
      ) : (
        <div className="notes-grid">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showEditor && (
        <NoteEditor
          note={editingNote}
          onSave={handleSave}
          onCancel={() => {
            setShowEditor(false);
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
}
