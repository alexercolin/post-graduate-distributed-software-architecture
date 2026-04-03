import { Link, useParams } from 'react-router-dom'
import { useMovie } from '@/entities/movie'
import { LikeButton } from '@/features/like-movie'
import { IMAGE_BASE_URL } from '@/shared'
import styles from './MovieDetailPage.module.css'

const formatCurrency = (v) => (v > 0 ? `$${v.toLocaleString('en-US')}` : 'N/A')
const formatRuntime = (m) => `${Math.floor(m / 60)}h ${m % 60}min`

export const MovieDetailPage = () => {
  const { id } = useParams()
  const { movie, loading, error } = useMovie(id)

  if (loading) return <p className={styles.state}>Carregando...</p>
  if (error || !movie) return <p className={styles.state}>Filme não encontrado.</p>

  return (
    <div>
      {movie.backdrop_path && (
        <img className={styles.backdrop} src={`${IMAGE_BASE_URL}/original${movie.backdrop_path}`} alt={movie.title} />
      )}
      <div className={styles.content}>
        <img className={styles.poster} src={`${IMAGE_BASE_URL}/w300${movie.poster_path}`} alt={movie.title} />
        <div className={styles.info}>
          <div className={styles.titleRow}>
            <h1>{movie.title}</h1>
            <LikeButton movie={movie} />
          </div>
          <div className={styles.meta}>
            <span>{movie.release_date}</span>
            <span>{formatRuntime(movie.runtime)}</span>
            <span>{movie.original_language?.toUpperCase()}</span>
            <span>⭐ {movie.vote_average?.toFixed(1)} ({movie.vote_count} votos)</span>
          </div>
          {movie.genres?.length > 0 && (
            <div className={styles.genres}>
              {movie.genres.map((g) => <span key={g.id} className={styles.genre}>{g.name}</span>)}
            </div>
          )}
          <p className={styles.overview}>{movie.overview}</p>
          <div className={styles.stats}>
            <div className={styles.stat}><span>Status</span><strong>{movie.status}</strong></div>
            <div className={styles.stat}><span>Popularidade</span><strong>{movie.popularity?.toFixed(0)}</strong></div>
            <div className={styles.stat}><span>Budget</span><strong>{formatCurrency(movie.budget)}</strong></div>
            <div className={styles.stat}><span>Revenue</span><strong>{formatCurrency(movie.revenue)}</strong></div>
          </div>
          <Link to="/movies" className={styles.backLink}>← Voltar para filmes</Link>
        </div>
      </div>
    </div>
  )
}
