import { useState, useEffect } from "react";
import { getPopularMovies, getMovie } from "../services/movies.service";

interface Genre {
  id: number;
  name: string;
}

interface ProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime: number;
  genres: Genre[];
  production_companies: ProductionCompany[];
  status: string;
  original_language: string;
  budget: number;
  revenue: number;
  popularity: number;
}

export const useMovies = () => {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    getPopularMovies().then((response) => {
      setMovies(response.data.results);
    });
  }, []);

  return movies;
};

export const useMovie = (id: string) => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getMovie(id)
      .then((response) => {
        setMovie(response.data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return { movie, loading, error };
};
