import { tmdbHttp } from '@/shared'

// A entity só conhece o shared — nunca features ou camadas superiores.
export const getPopularMovies = () => tmdbHttp.get('/movie/popular')
export const searchMovies = (query) => tmdbHttp.get('/search/movie', { params: { query } })
export const getMovieById = (id) => tmdbHttp.get(`/movie/${id}`)
