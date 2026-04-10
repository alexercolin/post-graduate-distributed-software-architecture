import type { Note } from '../types/note';

const API_BASE = '/api';

// Busca notas da "API" (arquivo JSON estático em public/api/).
// Em uma aplicação real, isso seria uma chamada a um backend REST.
//
// O Service Worker intercepta esta requisição e aplica a estratégia
// Network-First: tenta a rede primeiro, usa o cache como fallback.
export async function fetchNotesFromApi(): Promise<Note[]> {
  const response = await fetch(`${API_BASE}/notes.json`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar notas: ${response.status}`);
  }

  return response.json();
}
