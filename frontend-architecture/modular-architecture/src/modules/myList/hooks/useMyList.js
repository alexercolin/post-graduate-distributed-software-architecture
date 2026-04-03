import { useContext } from 'react'
import { MyListContext } from '../context/MyListContext'

// Hook que expõe o contexto da lista.
// Componentes externos nunca importam o contexto diretamente —
// sempre consomem via este hook (encapsulamento do módulo).
export const useMyList = () => {
  const context = useContext(MyListContext)
  if (!context) throw new Error('useMyList must be used within MyListProvider')
  return context
}
