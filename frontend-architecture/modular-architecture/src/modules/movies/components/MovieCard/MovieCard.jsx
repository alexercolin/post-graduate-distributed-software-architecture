import { Link } from 'react-router-dom'
import { useMyList } from '../../../myList'
import { IMAGE_BASE_URL } from '../../../../shared/constants/images'
import styles from './MovieCard.module.css'

export const MovieCard = ({ id, title, overview, poster_path, release_date, vote_average }) => {
  const { isLiked, toggle } = useMyList()
  const liked = isLiked(id)

  return (
    <div className={styles.card}>
      <img src={`${IMAGE_BASE_URL}/w300${poster_path}`} alt={title} />

      <div className={styles.body}>
        <h2>{title}</h2>
        <p>{overview}</p>

        <div className={styles.footer}>
          <span>{release_date?.slice(0, 4)}</span>
          <span>⭐ {vote_average?.toFixed(1)}</span>
        </div>

        <div className={styles.actions}>
          <Link to={`/movies/${id}`} className={styles.detailBtn}>
            Ver detalhes
          </Link>
          <button
            className={`${styles.likeBtn} ${liked ? styles.liked : ''}`}
            onClick={() => toggle({ id, title, overview, poster_path, release_date, vote_average })}
            aria-label={liked ? 'Remover da lista' : 'Adicionar à lista'}
          >
            {liked ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </div>
  )
}
