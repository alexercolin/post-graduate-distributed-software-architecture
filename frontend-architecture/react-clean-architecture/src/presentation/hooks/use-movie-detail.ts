import { useCallback, useEffect, useState } from "react";
import type { MovieDetail } from "../../domain/entities/movie";
import { useDependencies } from "../../di/dependencies-context";

export function useMovieDetail(id: number) {
  const { getMovieDetail } = useDependencies();

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovie = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMovieDetail.execute(id);
      setMovie(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar filme");
    } finally {
      setLoading(false);
    }
  }, [getMovieDetail, id]);

  useEffect(() => {
    fetchMovie();
  }, [fetchMovie]);

  return { movie, loading, error, retry: fetchMovie };
}
