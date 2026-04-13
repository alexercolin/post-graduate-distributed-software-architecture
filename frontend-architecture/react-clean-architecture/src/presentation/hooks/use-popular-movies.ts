/**
 * PRESENTATION LAYER - Custom Hook (ViewModel)
 *
 * Hooks atuam como ViewModels na Clean Architecture com React.
 * Eles:
 * - Consomem use cases via DI context
 * - Gerenciam estado da UI (loading, error, data)
 * - NAO contem logica de negocio (isso esta nos use cases)
 * - Fornecem dados prontos para os componentes renderizarem
 */

import { useCallback, useEffect, useState } from "react";
import type { Movie } from "../../domain/entities/movie";
import { useDependencies } from "../../di/dependencies-context";

export function usePopularMovies() {
  const { getPopularMovies } = useDependencies();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPopularMovies.execute();
      setMovies(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar filmes");
    } finally {
      setLoading(false);
    }
  }, [getPopularMovies]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  return { movies, loading, error, retry: fetchMovies };
}
