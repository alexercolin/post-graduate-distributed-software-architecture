import { moviesApi } from "../api/http";

export const getPopularMovies = () => {
  return moviesApi("/movie/popular");
};

export const getMovie = (id: string) => {
  return moviesApi(`/movie/${id}`);
};
