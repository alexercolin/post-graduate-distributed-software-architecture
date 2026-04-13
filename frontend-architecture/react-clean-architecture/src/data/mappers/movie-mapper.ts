/**
 * DATA LAYER - Mappers
 *
 * Responsaveis por converter dados entre camadas:
 *   API Model (externo) → Domain Entity (interno)
 *
 * Por que usar mappers?
 * - Isolam mudancas na API: se a TMDB mudar um campo, so o mapper muda
 * - Garantem que o dominio recebe dados no formato esperado
 * - Podem aplicar transformacoes (ex: construir URL completa da imagem)
 * - Facilitam testes: basta testar o mapper isoladamente
 */

import type { Movie, MovieDetail } from "../../domain/entities/movie";
import type { MovieApiModel, MovieDetailApiModel } from "../models/movie-api-model";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export class MovieMapper {
  static toDomain(apiModel: MovieApiModel): Movie {
    return {
      id: apiModel.id,
      title: apiModel.title,
      overview: apiModel.overview,
      posterUrl: apiModel.poster_path
        ? `${IMAGE_BASE_URL}/w500${apiModel.poster_path}`
        : "",
      backdropUrl: apiModel.backdrop_path
        ? `${IMAGE_BASE_URL}/original${apiModel.backdrop_path}`
        : "",
      rating: Math.round(apiModel.vote_average * 10) / 10,
      releaseDate: apiModel.release_date,
    };
  }

  static toDetailDomain(apiModel: MovieDetailApiModel): MovieDetail {
    return {
      id: apiModel.id,
      title: apiModel.title,
      overview: apiModel.overview,
      posterUrl: apiModel.poster_path
        ? `${IMAGE_BASE_URL}/w500${apiModel.poster_path}`
        : "",
      backdropUrl: apiModel.backdrop_path
        ? `${IMAGE_BASE_URL}/original${apiModel.backdrop_path}`
        : "",
      rating: Math.round(apiModel.vote_average * 10) / 10,
      releaseDate: apiModel.release_date,
      genres: apiModel.genres.map((g) => ({ id: g.id, name: g.name })),
      runtime: apiModel.runtime,
      tagline: apiModel.tagline,
      budget: apiModel.budget,
      revenue: apiModel.revenue,
      status: apiModel.status,
      homepage: apiModel.homepage,
    };
  }
}
