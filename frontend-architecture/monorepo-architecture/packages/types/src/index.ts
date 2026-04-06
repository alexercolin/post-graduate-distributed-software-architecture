// ─── Movie Domain ──────────────────────────────────────────────────────────────

export interface Movie {
  id: string
  title: string
  year: number
  genre: string[]
  rating: number
  posterUrl: string
  description: string
}

export interface MovieSummary {
  id: string
  title: string
  year: number
  rating: number
  posterUrl: string
}

// ─── User Domain ───────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

// ─── API ───────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  pageSize: number
}
