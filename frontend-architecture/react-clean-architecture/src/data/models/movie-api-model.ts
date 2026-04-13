/**
 * DATA LAYER - API Models (DTOs)
 *
 * Representam a estrutura EXATA dos dados que vem da API externa (TMDB).
 * Sao diferentes das entities do dominio porque:
 * - Refletem o formato da API, nao o formato do negocio
 * - Podem mudar se a API mudar, sem afetar o dominio
 * - Contem campos que o dominio nao precisa conhecer
 */

export interface MovieApiResponse {
  page: number;
  results: MovieApiModel[];
  total_pages: number;
  total_results: number;
}

export interface MovieApiModel {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
  popularity: number;
  video: boolean;
  vote_count: number;
}

export interface MovieDetailApiModel {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  genres: GenreApiModel[];
  runtime: number;
  tagline: string;
  budget: number;
  revenue: number;
  status: string;
  homepage: string;
}

export interface GenreApiModel {
  id: number;
  name: string;
}
