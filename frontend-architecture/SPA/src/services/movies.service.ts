import { moviesApi } from "../config/http";

export const getPopularMovies = () => {
  return moviesApi.get("movie/popular");
};

export const getMovie = (id: string) => {
  return moviesApi.get(`movie/${id}`);
};
