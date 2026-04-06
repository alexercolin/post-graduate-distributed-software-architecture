import { MovieCard } from "@repo/ui";
import { formatDate } from "@repo/utils";
import type { MovieSummary } from "@repo/types";

const MOCK_MOVIES: MovieSummary[] = [
  {
    id: "1",
    title: "The Shawshank Redemption",
    year: 1994,
    rating: 9.3,
    posterUrl: "https://via.placeholder.com/300x450",
  },
  {
    id: "2",
    title: "The Godfather",
    year: 1972,
    rating: 9.2,
    posterUrl: "https://via.placeholder.com/300x450",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Movies</h1>
        <p className="text-gray-500 mt-1">
          Atualizado em {formatDate(new Date())}
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MOCK_MOVIES.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </section>
    </main>
  );
}
