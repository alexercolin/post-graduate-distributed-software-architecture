/**
 * PRESENTATION LAYER - View (Page)
 *
 * Views sao componentes de pagina. Elas:
 * - Usam hooks (ViewModels) para obter dados
 * - Compoem componentes compartilhados
 * - NAO fazem fetch direto nem manipulam dados da API
 * - Delegam TODA logica para os hooks/use cases
 */

import { useRef, useState } from "react";
import { usePopularMovies } from "../../hooks/use-popular-movies";
import { useSearchMovies } from "../../hooks/use-search-movies";
import { MovieCard } from "../../shared/movie-card";
import { Loading } from "../../shared/loading";
import { ErrorMessage } from "../../shared/error-message";
import "./home.css";

export function Home() {
  const { movies, loading, error, retry } = usePopularMovies();
  const {
    results: searchResults,
    loading: searching,
    error: searchError,
    search,
    clear,
  } = useSearchMovies();

  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      clear();
      return;
    }
    debounceRef.current = setTimeout(() => search(value), 400);
  };

  const isSearching = query.trim().length > 0;
  const displayMovies = isSearching ? searchResults : movies;
  const isLoading = isSearching ? searching : loading;
  const currentError = isSearching ? searchError : error;

  return (
    <div className="home">
      <header className="home-header">
        <h1>Clean Architecture</h1>
        <p className="home-subtitle">
          Exemplo didatico com React + TypeScript + TMDB API
        </p>
        <input
          className="home-search"
          type="text"
          placeholder="Buscar filmes..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </header>

      {isLoading && <Loading />}

      {currentError && <ErrorMessage message={currentError} onRetry={retry} />}

      {!isLoading && !currentError && (
        <>
          <h2 className="home-section-title">
            {isSearching ? `Resultados para "${query}"` : "Filmes Populares"}
          </h2>

          {displayMovies.length === 0 ? (
            <p className="home-empty">Nenhum filme encontrado.</p>
          ) : (
            <div className="movie-grid">
              {displayMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
