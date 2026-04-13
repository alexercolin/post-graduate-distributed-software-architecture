/**
 * PRESENTATION LAYER - Shared Component
 *
 * Componentes da presentation layer so conhecem Domain Entities.
 * Eles NAO importam nada da camada de Data ou Infrastructure.
 * Recebem dados ja mapeados e prontos para exibir.
 */

import { Link } from "react-router-dom";
import type { Movie } from "../../domain/entities/movie";
import "./movie-card.css";

interface MovieCardProps {
  movie: Movie;
}

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link to={`/movie/${movie.id}`} className="movie-card">
      {movie.posterUrl ? (
        <img
          className="movie-card-poster"
          src={movie.posterUrl}
          alt={movie.title}
          loading="lazy"
        />
      ) : (
        <div className="movie-card-placeholder">Sem imagem</div>
      )}
      <div className="movie-card-info">
        <h3 className="movie-card-title">{movie.title}</h3>
        <div className="movie-card-meta">
          <span className="movie-card-rating">{movie.rating}</span>
          <span className="movie-card-year">
            {movie.releaseDate?.split("-")[0]}
          </span>
        </div>
      </div>
    </Link>
  );
}
