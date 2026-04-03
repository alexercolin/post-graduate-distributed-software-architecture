import axios from 'axios'

// Instância centralizada do HTTP client.
// Toda comunicação com APIs externas passa por aqui.
// Configurações globais (baseURL, headers, interceptors) ficam neste módulo.
export const tmdbHttp = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN}`,
  },
})
