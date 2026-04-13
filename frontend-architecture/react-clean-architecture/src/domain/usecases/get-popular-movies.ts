/**
 * DOMAIN LAYER - Use Case
 *
 * Use Cases encapsulam uma operacao de negocio especifica.
 * Recebem o repositorio via construtor (injecao de dependencia)
 * e orquestram a logica necessaria para cumprir o caso de uso.
 *
 * Regra: Um use case faz UMA coisa. Se precisar de mais logica,
 * crie outro use case ou um domain service.
 */

import type { Movie } from "../entities/movie";
import type { MovieRepository } from "../repositories/movie-repository";

export class GetPopularMovies {
  readonly repository: MovieRepository;

  constructor(repository: MovieRepository) {
    this.repository = repository;
  }

  async execute(): Promise<Movie[]> {
    return this.repository.getPopularMovies();
  }
}
