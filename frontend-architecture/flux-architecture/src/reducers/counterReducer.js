import { INCREMENT, DECREMENT, RESET } from '../actions/counterActions'

// Estado inicial do contador
const initialState = {
  count: 0,
}

// REDUCER
// Função pura: recebe o estado atual + uma action, retorna o NOVO estado.
// Nunca muta o estado — sempre retorna um novo objeto.
// É aqui que fica a lógica de negócio (equivalente ao Store do Flux original).
const counterReducer = (state = initialState, action) => {
  switch (action.type) {
    case INCREMENT:
      return { ...state, count: state.count + 1 }

    case DECREMENT:
      return { ...state, count: state.count - 1 }

    case RESET:
      return { ...state, count: 0 }

    default:
      return state
  }
}

export default counterReducer
