import { Button } from "@repo/ui"
import { formatRating } from "@repo/utils"
import type { Movie } from "@repo/types"

const MOCK_MOVIES: Movie[] = [
  {
    id: "1",
    title: "The Shawshank Redemption",
    year: 1994,
    genre: ["Drama"],
    rating: 9.3,
    posterUrl: "https://via.placeholder.com/300x450",
    description: "Two imprisoned men bond over a number of years.",
  },
]

export default function App() {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard — Gerenciar Filmes</h1>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3">Título</th>
            <th className="p-3">Ano</th>
            <th className="p-3">Nota</th>
            <th className="p-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_MOVIES.map((movie) => (
            <tr key={movie.id} className="border-t">
              <td className="p-3">{movie.title}</td>
              <td className="p-3">{movie.year}</td>
              <td className="p-3">★ {formatRating(movie.rating)}</td>
              <td className="p-3 flex gap-2">
                <Button size="sm" variant="secondary">Editar</Button>
                <Button size="sm" variant="ghost">Excluir</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
