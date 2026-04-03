import { useState } from 'react'
import { useMovies } from '../../hooks/useMovies'
import { MovieCard } from '../../components/MovieCard/MovieCard'
import { SearchBar } from '../../components/SearchBar/SearchBar'
import styles from './MoviesPage.module.css'

export const MoviesPage = () => {
  const [query, setQuery] = useState('')
  const { movies, loading } = useMovies(query)

  return (
    <section className={styles.page}>
      <h1>{query ? `Resultados para "${query}"` : 'Filmes Populares'}</h1>

      <SearchBar onSearch={setQuery} />

      {loading ? (
        <p className={styles.loading}>Carregando...</p>
      ) : movies.length === 0 ? (
        <p className={styles.empty}>Nenhum filme encontrado.</p>
      ) : (
        <div className={styles.grid}>
          {movies.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      )}
    </section>
  )
}
