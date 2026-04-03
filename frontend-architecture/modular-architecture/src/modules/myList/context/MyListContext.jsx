import { createContext, useState, useCallback } from 'react'

export const MyListContext = createContext(null)

// Provider que gerencia o estado global da lista de filmes curtidos.
// Toda a lógica de adicionar/remover fica encapsulada aqui dentro do módulo.
export const MyListProvider = ({ children }) => {
  const [list, setList] = useState([])

  const toggle = useCallback((movie) => {
    setList((prev) =>
      prev.some((m) => m.id === movie.id)
        ? prev.filter((m) => m.id !== movie.id)
        : [...prev, movie]
    )
  }, [])

  const isLiked = useCallback(
    (id) => list.some((m) => m.id === id),
    [list]
  )

  return (
    <MyListContext.Provider value={{ list, toggle, isLiked }}>
      {children}
    </MyListContext.Provider>
  )
}
