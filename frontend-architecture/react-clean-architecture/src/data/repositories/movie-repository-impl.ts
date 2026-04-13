/**
 * DATA LAYER - Repository Implementation
 *
 * Implementacao CONCRETA da interface MovieRepository definida no dominio.
 * Esta classe:
 * - Depende do HttpClient (infraestrutura) para fazer requisicoes
 * - Usa os Mappers para converter API Models em Domain Entities
 * - Implementa o contrato definido pelo dominio
 *
 * O dominio nunca sabe que esta classe existe. Ele so conhece a interface.
 * Isso permite trocar a implementacao (ex: de REST para GraphQL) sem
 * alterar nenhuma regra de negocio.
 */

import type { Movie, MovieDetail } from "../../domain/entities/movie";
import type { MovieRepository } from "../../domain/repositories/movie-repository";
import type { HttpClient } from "../../infrastructure/http/http-client";
import type { MovieApiResponse, MovieDetailApiModel } from "../models/movie-api-model";
import { MovieMapper } from "../mappers/movie-mapper";

export class MovieRepositoryImpl implements MovieRepository {
  readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async getPopularMovies(): Promise<Movie[]> {
    const response = await this.httpClient.get<MovieApiResponse>(
      "/movie/popular?language=pt-BR"
    );
    return response.results.map(MovieMapper.toDomain);
  }

  async getMovieDetail(id: number): Promise<MovieDetail> {
    const response = await this.httpClient.get<MovieDetailApiModel>(
      `/movie/${id}?language=pt-BR`
    );
    return MovieMapper.toDetailDomain(response);
  }

  async searchMovies(query: string): Promise<Movie[]> {
    const encoded = encodeURIComponent(query);
    const response = await this.httpClient.get<MovieApiResponse>(
      `/search/movie?query=${encoded}&language=pt-BR`
    );
    return response.results.map(MovieMapper.toDomain);
  }
}
