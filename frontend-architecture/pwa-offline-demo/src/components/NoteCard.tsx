import type { NoteWithStatus } from '../types/note';

interface NoteCardProps {
  note: NoteWithStatus;
  onEdit: (note: NoteWithStatus) => void;
  onDelete: (id: string) => void;
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const formattedDate = new Date(note.updatedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="note-card">
      <div className="note-card-header">
        <h3 className="note-card-title">{note.title}</h3>
        <span className={`sync-badge sync-badge--${note.syncStatus}`}>
          {note.syncStatus === 'synced' ? 'Sincronizado' : 'Local'}
        </span>
      </div>

      <span className="note-card-category">{note.category}</span>

      <p className="note-card-content">{note.content}</p>

      <div className="note-card-footer">
        <span className="note-card-date">{formattedDate}</span>
        <div className="note-card-actions">
          <button className="btn btn--small" onClick={() => onEdit(note)}>
            Editar
          </button>
          <button className="btn btn--small btn--danger" onClick={() => onDelete(note.id)}>
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
