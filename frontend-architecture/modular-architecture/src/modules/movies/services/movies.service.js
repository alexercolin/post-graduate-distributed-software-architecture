import { tmdbHttp } from '../../core'

export const getPopularMovies = () => tmdbHttp.get('/movie/popular')

export const searchMovies = (query) =>
  tmdbHttp.get('/search/movie', { params: { query } })

export const getMovieById = (id) => tmdbHttp.get(`/movie/${id}`)
