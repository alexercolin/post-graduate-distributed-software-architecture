import type { MovieDetail } from "../entities/movie";
import type { MovieRepository } from "../repositories/movie-repository";

export class GetMovieDetail {
  readonly repository: MovieRepository;

  constructor(repository: MovieRepository) {
    this.repository = repository;
  }

  async execute(id: number): Promise<MovieDetail> {
    return this.repository.getMovieDetail(id);
  }
}
