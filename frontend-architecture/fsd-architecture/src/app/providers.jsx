import { LikeMovieProvider } from '@/features/like-movie'

// Todos os providers globais ficam aqui.
// Adicionar um novo provider = apenas mais uma linha neste arquivo.
export const Providers = ({ children }) => (
  <LikeMovieProvider>
    {children}
  </LikeMovieProvider>
)
