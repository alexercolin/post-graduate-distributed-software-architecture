import { useLikeMovie } from '../model/useLikeMovie'
import styles from './LikeButton.module.css'

// Botão de curtir isolado — a entity MovieCard recebe este componente
// via prop `actions`, mantendo a separação de responsabilidades.
export const LikeButton = ({ movie }) => {
  const { isLiked, toggle } = useLikeMovie()
  const liked = isLiked(movie.id)

  return (
    <button
      className={`${styles.btn} ${liked ? styles.liked : ''}`}
      onClick={() => toggle(movie)}
      aria-label={liked ? 'Remover da lista' : 'Adicionar à lista'}
    >
      {liked ? '♥' : '♡'}
    </button>
  )
}
