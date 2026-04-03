import { Link, useParams } from 'react-router-dom'
import { useMovie } from '../../hooks/useMovies'
import { useMyList } from '../../../myList'
import { IMAGE_BASE_URL } from '../../../../shared/constants/images'
import styles from './MovieDetailPage.module.css'

const formatCurrency = (value) =>
  value > 0 ? `$${value.toLocaleString('en-US')}` : 'N/A'

const formatRuntime = (minutes) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}min`
}

export const MovieDetailPage = () => {
  const { id } = useParams()
  const { movie, loading, error } = useMovie(id)
  const { isLiked, toggle } = useMyList()

  if (loading) return <p className={styles.state}>Carregando...</p>
  if (error || !movie) return <p className={styles.state}>Filme não encontrado.</p>

  const liked = isLiked(movie.id)

  return (
    <div>
      {movie.backdrop_path && (
        <img
          className={styles.backdrop}
          src={`${IMAGE_BASE_URL}/original${movie.backdrop_path}`}
          alt={movie.title}
        />
      )}

      <div className={styles.content}>
        <img
          className={styles.poster}
          src={`${IMAGE_BASE_URL}/w300${movie.poster_path}`}
          alt={movie.title}
        />

        <div className={styles.info}>
          <div className={styles.titleRow}>
            <h1>{movie.title}</h1>
            <button
              className={`${styles.likeBtn} ${liked ? styles.liked : ''}`}
              onClick={() => toggle(movie)}
            >
              {liked ? '♥ Na minha lista' : '♡ Adicionar à lista'}
            </button>
          </div>

          <div className={styles.meta}>
            <span>{movie.release_date}</span>
            <span>{formatRuntime(movie.runtime)}</span>
            <span>{movie.original_language?.toUpperCase()}</span>
            <span>⭐ {movie.vote_average?.toFixed(1)} ({movie.vote_count} votos)</span>
          </div>

          {movie.genres?.length > 0 && (
            <div className={styles.genres}>
              {movie.genres.map((g) => (
                <span key={g.id} className={styles.genre}>{g.name}</span>
              ))}
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
