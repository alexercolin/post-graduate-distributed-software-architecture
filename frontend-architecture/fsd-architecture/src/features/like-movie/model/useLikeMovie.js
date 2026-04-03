import { createContext, useContext, useState, useCallback } from 'react'

// O estado de "curtidos" vive aqui dentro da feature like-movie.
// Nenhuma entity ou shared conhece este contexto.
const LikeMovieContext = createContext(null)

export const LikeMovieProvider = ({ children }) => {
  const [liked, setLiked] = useState([])

  const toggle = useCallback((movie) => {
    setLiked((prev) =>
      prev.some((m) => m.id === movie.id)
        ? prev.filter((m) => m.id !== movie.id)
        : [...prev, movie]
    )
  }, [])

  const isLiked = useCallback((id) => liked.some((m) => m.id === id), [liked])

  return (
    <LikeMovieContext.Provider value={{ liked, toggle, isLiked }}>
      {children}
    </LikeMovieContext.Provider>
  )
}

export const useLikeMovie = () => {
  const ctx = useContext(LikeMovieContext)
  if (!ctx) throw new Error('useLikeMovie must be used within LikeMovieProvider')
  return ctx
}
