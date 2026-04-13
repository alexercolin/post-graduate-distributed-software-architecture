import { useCallback, useState } from "react";
import type { Movie } from "../../domain/entities/movie";
import { useDependencies } from "../../di/dependencies-context";

export function useSearchMovies() {
  const { searchMovies } = useDependencies();

  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await searchMovies.execute(query);
        setResults(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro na busca");
      } finally {
        setLoading(false);
      }
    },
    [searchMovies]
  );

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
}
