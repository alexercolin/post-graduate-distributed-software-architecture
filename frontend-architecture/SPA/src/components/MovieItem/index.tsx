import { Link } from "react-router-dom";
import styles from "./index.module.css";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w300";

interface MovieItemProps {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
}

export const MovieItem = ({
  id,
  title,
  overview,
  poster_path,
  release_date,
  vote_average,
}: MovieItemProps) => {
  return (
    <div className={styles.movieCard}>
      <img src={`${IMAGE_BASE_URL}${poster_path}`} alt={title} />
      <div className={styles.movieCardContent}>
        <h2>{title}</h2>
        <p>{overview}</p>
        <div className={styles.movieCardFooter}>
          <span>{release_date}</span>
          <span>⭐ {vote_average.toFixed(1)}</span>
        </div>
        <Link to={`/movies/${id}`} className={styles.detailsButton}>
          Ver detalhes
        </Link>
      </div>
    </div>
  );
};
