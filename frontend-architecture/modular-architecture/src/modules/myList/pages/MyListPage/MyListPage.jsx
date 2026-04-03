import { useMyList } from '../../hooks/useMyList'
import { MovieCard } from '../../../movies/components/MovieCard/MovieCard'
import styles from './MyListPage.module.css'

export const MyListPage = () => {
  const { list } = useMyList()

  return (
    <section className={styles.page}>
      <h1>Minha Lista</h1>

      {list.length === 0 ? (
        <div className={styles.empty}>
          <p>Você ainda não curtiu nenhum filme.</p>
          <p>Clique em ♡ em qualquer filme para adicioná-lo aqui.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {list.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      )}
    </section>
  )
}
