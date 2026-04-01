import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '../reducers/counterReducer'

// STORE
// Único ponto de verdade (single source of truth) da aplicação.
// configureStore substitui o createStore depreciado e já inclui
// o combineReducers internamente via campo `reducer`.
const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
})

export default store
