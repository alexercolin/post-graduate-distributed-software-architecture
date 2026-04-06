import Fastify from "fastify"
import { slugify } from "@repo/utils"
import type { Movie, ApiResponse, PaginatedResponse } from "@repo/types"

const app = Fastify({ logger: true })

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOVIES: Movie[] = [
  {
    id: slugify("The Shawshank Redemption"),
    title: "The Shawshank Redemption",
    year: 1994,
    genre: ["Drama"],
    rating: 9.3,
    posterUrl: "https://via.placeholder.com/300x450",
    description: "Two imprisoned men bond over a number of years.",
  },
  {
    id: slugify("The Godfather"),
    title: "The Godfather",
    year: 1972,
    genre: ["Crime", "Drama"],
    rating: 9.2,
    posterUrl: "https://via.placeholder.com/300x450",
    description: "The aging patriarch of an organized crime dynasty.",
  },
]

// ─── Routes ────────────────────────────────────────────────────────────────────

app.get<{ Reply: PaginatedResponse<Movie> }>("/movies", async () => {
  return {
    data: MOVIES,
    total: MOVIES.length,
    page: 1,
    pageSize: 10,
  }
})

app.get<{ Params: { id: string }; Reply: ApiResponse<Movie> }>(
  "/movies/:id",
  async (request, reply) => {
    const movie = MOVIES.find((m) => m.id === request.params.id)

    if (!movie) {
      reply.status(404)
      return { data: null as unknown as Movie, error: "Movie not found" }
    }

    return { data: movie }
  }
)

// ─── Start ─────────────────────────────────────────────────────────────────────

app.listen({ port: 3333, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
