import { Link, useParams } from "react-router-dom";
import { useMovie } from "../../hooks/useMovies";
import styles from "./index.module.css";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

const formatCurrency = (value: number) =>
  value > 0 ? `$${value.toLocaleString("en-US")}` : "N/A";

const formatRuntime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}min`;
};

export const MovieDetail = () => {
  const { id } = useParams();
  const { movie } = useMovie(id!);

  if (!movie) {
    return <p className={styles.loading}>Carregando...</p>;
  }

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
          <h1>{movie.title}</h1>

          <div className={styles.meta}>
            <span>{movie.release_date}</span>
            <span>{formatRuntime(movie.runtime)}</span>
            <span>{movie.original_language.toUpperCase()}</span>
            <span>
              ⭐ {movie.vote_average.toFixed(1)} ({movie.vote_count} votos)
            </span>
          </div>

          {movie.genres?.length > 0 && (
            <div className={styles.genres}>
              {movie.genres.map((genre) => (
                <span key={genre.id} className={styles.genre}>
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          <p className={styles.overview}>{movie.overview}</p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span>Status</span>
              <strong>{movie.status}</strong>
            </div>
            <div className={styles.stat}>
              <span>Popularidade</span>
              <strong>{movie.popularity.toFixed(0)}</strong>
            </div>
            <div className={styles.stat}>
              <span>Budget</span>
              <strong>{formatCurrency(movie.budget)}</strong>
            </div>
            <div className={styles.stat}>
              <span>Revenue</span>
              <strong>{formatCurrency(movie.revenue)}</strong>
            </div>
          </div>

          {movie.production_companies?.length > 0 && (
            <div className={styles.companies}>
              <h3>Production Companies</h3>
              <div className={styles.companyList}>
                {movie.production_companies.map((company) =>
                  company.logo_path ? (
                    <img
                      key={company.id}
                      src={`${IMAGE_BASE_URL}/w200${company.logo_path}`}
                      alt={company.name}
                      title={company.name}
                    />
                  ) : (
                    <span key={company.id}>{company.name}</span>
                  ),
                )}
              </div>
            </div>
          )}

          <Link to="/movies" className={styles.backLink}>
            ← Voltar para filmes
          </Link>
        </div>
      </div>
    </div>
  );
};
