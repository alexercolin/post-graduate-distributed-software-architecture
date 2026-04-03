import { Link } from 'react-router-dom'
import { IMAGE_BASE_URL } from '@/shared'
import styles from './MovieCard.module.css'

// MovieCard é uma entidade pura — exibe dados do filme.
// NÃO sabe nada sobre "curtir". Aceita um slot `actions` para
// que features injetem seus botões sem criar dependência inversa.
export const MovieCard = ({ id, title, overview, poster_path, release_date, vote_average, actions }) => (
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
        <Link to={`/movies/${id}`} className={styles.detailBtn}>Ver detalhes</Link>
        {actions}
      </div>
    </div>
  </div>
)
