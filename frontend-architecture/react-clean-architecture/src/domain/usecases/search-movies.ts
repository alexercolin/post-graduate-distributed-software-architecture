import type { Movie } from "../entities/movie";
import type { MovieRepository } from "../repositories/movie-repository";

export class SearchMovies {
  readonly repository: MovieRepository;

  constructor(repository: MovieRepository) {
    this.repository = repository;
  }

  async execute(query: string): Promise<Movie[]> {
    if (!query.trim()) {
      return [];
    }
    return this.repository.searchMovies(query);
  }
}
