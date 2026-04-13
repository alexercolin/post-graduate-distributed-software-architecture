/**
 * COMPOSITION ROOT - Dependency Injection Container
 *
 * Este e o UNICO lugar da aplicacao que conhece TODAS as camadas.
 * Aqui montamos o grafo de dependencias:
 *
 *   Infrastructure (HttpClient)
 *        ↓
 *   Data (MovieRepositoryImpl)
 *        ↓
 *   Domain (Use Cases)
 *        ↓
 *   Presentation (via React Context)
 *
 * A "Regra de Dependencia" da Clean Architecture diz que
 * dependencias so apontam para DENTRO (camadas internas).
 * O Composition Root e a excecao: ele conhece tudo para
 * poder "costurar" as camadas.
 */

import { FetchHttpClient } from "../infrastructure/http/http-client";
import { MovieRepositoryImpl } from "../data/repositories/movie-repository-impl";
import { GetPopularMovies } from "../domain/usecases/get-popular-movies";
import { GetMovieDetail } from "../domain/usecases/get-movie-detail";
import { SearchMovies } from "../domain/usecases/search-movies";

export interface AppDependencies {
  getPopularMovies: GetPopularMovies;
  getMovieDetail: GetMovieDetail;
  searchMovies: SearchMovies;
}

export function createDependencies(): AppDependencies {
  // 1. Infrastructure
  const httpClient = new FetchHttpClient(
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_API_TOKEN
  );

  // 2. Data
  const movieRepository = new MovieRepositoryImpl(httpClient);

  // 3. Domain - Use Cases
  const getPopularMovies = new GetPopularMovies(movieRepository);
  const getMovieDetail = new GetMovieDetail(movieRepository);
  const searchMovies = new SearchMovies(movieRepository);

  return { getPopularMovies, getMovieDetail, searchMovies };
}
