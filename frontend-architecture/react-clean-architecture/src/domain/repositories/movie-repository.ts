/**
 * DOMAIN LAYER - Repository Interface (Port)
 *
 * Define o CONTRATO que a camada de dados deve implementar.
 * Segue o principio de Inversao de Dependencia (DIP):
 * - A camada de dominio define a interface
 * - A camada de dados fornece a implementacao
 * - O dominio NUNCA depende de detalhes de implementacao
 */

import type { Movie, MovieDetail } from "../entities/movie";

export interface MovieRepository {
  getPopularMovies(): Promise<Movie[]>;
  getMovieDetail(id: number): Promise<MovieDetail>;
  searchMovies(query: string): Promise<Movie[]>;
}
