import { useState, useEffect } from "react";
import { getPopularMovies, getMovie } from "../services/movies.service";

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
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
  const [movie, setMovie] = useState<Movie[]>([]);

  useEffect(() => {
    getMovie(id).then((response) => {
      setMovie(response.data.results);
    });
  }, [id]);

  return movie;
};
