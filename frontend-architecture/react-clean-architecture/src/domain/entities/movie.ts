/**
 * DOMAIN LAYER - Entities
 *
 * Entities representam os objetos de negocio da aplicacao.
 * Nao possuem NENHUMA dependencia de frameworks, bibliotecas ou camadas externas.
 * Sao tipos puros que refletem o dominio do problema.
 */

export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  releaseDate: string;
}

export interface MovieDetail extends Movie {
  genres: Genre[];
  runtime: number;
  tagline: string;
  budget: number;
  revenue: number;
  status: string;
  homepage: string;
}

export interface Genre {
  id: number;
  name: string;
}
