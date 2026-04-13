import { useParams, Link } from "react-router-dom";
import { useMovieDetail } from "../../hooks/use-movie-detail";
import { Loading } from "../../shared/loading";
import { ErrorMessage } from "../../shared/error-message";
import "./movie-detail.css";

export function MovieDetailView() {
  const { id } = useParams<{ id: string }>();
  const { movie, loading, error, retry } = useMovieDetail(Number(id));

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={retry} />;
  if (!movie) return null;

  const formatCurrency = (value: number) =>
    value > 0
      ? value.toLocaleString("pt-BR", { style: "currency", currency: "USD" })
      : "N/A";

  const formatRuntime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}min`;
  };

  return (
    <div className="movie-detail">
      {movie.backdropUrl && (
        <div
          className="movie-detail-backdrop"
          style={{ backgroundImage: `url(${movie.backdropUrl})` }}
        />
      )}

      <div className="movie-detail-content">
        <Link to="/" className="movie-detail-back">
          Voltar
        </Link>

        <div className="movie-detail-layout">
          {movie.posterUrl && (
            <img
              className="movie-detail-poster"
              src={movie.posterUrl}
              alt={movie.title}
            />
          )}

          <div className="movie-detail-info">
            <h1>{movie.title}</h1>
            {movie.tagline && (
              <p className="movie-detail-tagline">"{movie.tagline}"</p>
            )}

            <div className="movie-detail-meta">
              <span className="movie-detail-rating">{movie.rating}</span>
              <span>{movie.releaseDate?.split("-")[0]}</span>
              {movie.runtime > 0 && <span>{formatRuntime(movie.runtime)}</span>}
            </div>

            {movie.genres.length > 0 && (
              <div className="movie-detail-genres">
                {movie.genres.map((genre) => (
                  <span key={genre.id} className="genre-tag">
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            <h2>Sinopse</h2>
            <p className="movie-detail-overview">
              {movie.overview || "Sinopse nao disponivel."}
            </p>

            <div className="movie-detail-stats">
              <div>
                <span className="stat-label">Orcamento</span>
                <span className="stat-value">
                  {formatCurrency(movie.budget)}
                </span>
              </div>
              <div>
                <span className="stat-label">Receita</span>
                <span className="stat-value">
                  {formatCurrency(movie.revenue)}
                </span>
              </div>
              <div>
                <span className="stat-label">Status</span>
                <span className="stat-value">{movie.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
