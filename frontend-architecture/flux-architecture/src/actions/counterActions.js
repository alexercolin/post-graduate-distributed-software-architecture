// ACTION TYPES
// Constantes que identificam cada ação possível.
// Centralizar aqui evita erros de digitação em strings espalhadas pelo código.
export const INCREMENT = 'INCREMENT'
export const DECREMENT = 'DECREMENT'
export const RESET = 'RESET'

// ACTION CREATORS
// Funções puras que retornam um objeto de action.
// A View chama essas funções — nunca cria o objeto { type } diretamente.
export const increment = () => ({ type: INCREMENT })
export const decrement = () => ({ type: DECREMENT })
export const reset = () => ({ type: RESET })
