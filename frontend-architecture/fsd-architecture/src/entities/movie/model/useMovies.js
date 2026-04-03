import { useState, useEffect } from 'react'
import { getPopularMovies, searchMovies, getMovieById } from '../api/movies.service'

export const useMovies = (query = '') => {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const request = query ? searchMovies(query) : getPopularMovies()
    request
      .then((res) => setMovies(res.data.results))
      .finally(() => setLoading(false))
  }, [query])

  return { movies, loading }
}

export const useMovie = (id) => {
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    getMovieById(id)
      .then((res) => setMovie(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  return { movie, loading, error }
}
