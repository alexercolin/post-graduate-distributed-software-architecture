import { useState } from 'react'
import { MovieCard, useMovies } from '@/entities/movie'
import { LikeButton } from '@/features/like-movie'
import { SearchBar } from '@/features/search-movies'
import styles from './MoviesPage.module.css'

// Page compõe widgets, features e entities.
// A lógica de negócio fica nas camadas abaixo — aqui só montamos.
export const MoviesPage = () => {
  const [query, setQuery] = useState('')
  const { movies, loading } = useMovies(query)

  return (
    <section className={styles.page}>
      <h1>{query ? `Resultados para "${query}"` : 'Filmes Populares'}</h1>
      <SearchBar onSearch={setQuery} />
      {loading ? (
        <p className={styles.state}>Carregando...</p>
      ) : movies.length === 0 ? (
        <p className={styles.state}>Nenhum filme encontrado.</p>
      ) : (
        <div className={styles.grid}>
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              {...movie}
              actions={<LikeButton movie={movie} />}
            />
          ))}
        </div>
      )}
    </section>
  )
}
