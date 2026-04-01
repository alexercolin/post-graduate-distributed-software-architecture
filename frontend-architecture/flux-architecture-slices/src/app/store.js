import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '../features/counter/counterSlice'

// STORE
// Único ponto de verdade da aplicação.
// Cada nova feature adiciona seu reducer aqui.
const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
})

export default store
