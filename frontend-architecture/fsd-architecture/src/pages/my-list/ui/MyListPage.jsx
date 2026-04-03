import { MovieCard } from '@/entities/movie'
import { LikeButton, useLikeMovie } from '@/features/like-movie'
import styles from './MyListPage.module.css'

export const MyListPage = () => {
  const { liked } = useLikeMovie()

  return (
    <section className={styles.page}>
      <h1>Minha Lista</h1>
      {liked.length === 0 ? (
        <div className={styles.empty}>
          <p>Você ainda não curtiu nenhum filme.</p>
          <p>Clique em ♡ em qualquer filme para adicioná-lo aqui.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {liked.map((movie) => (
            <MovieCard key={movie.id} {...movie} actions={<LikeButton movie={movie} />} />
          ))}
        </div>
      )}
    </section>
  )
}
