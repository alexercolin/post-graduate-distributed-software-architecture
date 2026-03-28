import styles from "./index.module.css";
import { useMovies } from "../../hooks/useMovies";
import { MovieItem } from "../../components/MovieItem";

export const Movies = () => {
  const movies = useMovies();

  return (
    <section className={styles.movieSection}>
      <h1>Filmes Populares</h1>

      <div className={styles.movieGrid}>
        {movies.map((movie) => (
          <MovieItem key={movie.id} {...movie} />
        ))}
      </div>
    </section>
  );
};
