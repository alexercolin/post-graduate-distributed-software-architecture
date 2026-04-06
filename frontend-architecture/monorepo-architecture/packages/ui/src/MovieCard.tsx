import React from "react"
import { formatRating, truncate } from "@repo/utils"
import type { MovieSummary } from "@repo/types"

interface MovieCardProps {
  movie: MovieSummary
  onClick?: (id: string) => void
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  return (
    <div
      className="rounded-lg overflow-hidden shadow-md cursor-pointer hover:shadow-xl transition-shadow"
      onClick={() => onClick?.(movie.id)}
    >
      <img
        src={movie.posterUrl}
        alt={movie.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-3">
        <h3 className="font-semibold text-gray-900">
          {truncate(movie.title, 30)}
        </h3>
        <div className="flex justify-between mt-1 text-sm text-gray-500">
          <span>{movie.year}</span>
          <span>★ {formatRating(movie.rating)}</span>
        </div>
      </div>
    </div>
  )
}
