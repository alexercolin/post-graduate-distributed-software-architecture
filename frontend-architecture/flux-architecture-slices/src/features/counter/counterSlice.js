import { createSlice } from '@reduxjs/toolkit'

// SLICE
// Unifica em um só lugar: nome da feature, estado inicial,
// reducers (lógica) e actions (geradas automaticamente).
const counterSlice = createSlice({
  name: 'counter',

  initialState: {
    count: 0,
  },

  reducers: {
    // Cada chave vira automaticamente uma action creator exportável.
    // O RTK usa Immer internamente, então podemos "mutar" o state
    // diretamente — por baixo dos panos continua imutável.
    increment(state) {
      state.count += 1
    },
    decrement(state) {
      state.count -= 1
    },
    reset(state) {
      state.count = 0
    },

    // PAYLOAD: o segundo argumento do reducer é a action.
    // action.payload contém o valor passado ao disparar: dispatch(incrementBy(5))
    incrementBy(state, action) {
      state.count += action.payload
    },
  },
})

// Action creators gerados automaticamente pelo createSlice
export const { increment, decrement, reset, incrementBy } = counterSlice.actions

// Selector: encapsula como acessar este estado — a View não precisa
// conhecer a estrutura interna da store.
export const selectCount = (state) => state.counter.count

// Reducer exportado para ser registrado na store
export default counterSlice.reducer
