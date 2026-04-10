import { useState, useEffect } from 'react';
import type { NoteWithStatus } from '../types/note';

interface NoteEditorProps {
  note?: NoteWithStatus | null;
  onSave: (title: string, content: string, category: string) => void;
  onCancel: () => void;
}

const CATEGORIES = ['conceitos', 'service-worker', 'cache', 'offline', 'geral'];

export function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('geral');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
    } else {
      setTitle('');
      setContent('');
      setCategory('geral');
    }
  }, [note]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave(title.trim(), content.trim(), category);
  };

  return (
    <div className="note-editor-overlay">
      <form className="note-editor" onSubmit={handleSubmit}>
        <h2 className="note-editor-title">
          {note ? 'Editar Nota' : 'Nova Nota'}
        </h2>

        <div className="form-group">
          <label htmlFor="note-title">Titulo</label>
          <input
            id="note-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titulo da nota..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="note-category">Categoria</label>
          <select
            id="note-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="note-content">Conteudo</label>
          <textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Conteudo da nota..."
            rows={6}
            required
          />
        </div>

        <div className="note-editor-actions">
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
