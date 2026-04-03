import { createBrowserRouter, Navigate } from 'react-router-dom'
import { App } from '../App'
import { MoviesPage, MovieDetailPage } from '../modules/movies'
import { MyListPage } from '../modules/myList'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/movies" replace /> },
      { path: 'movies', element: <MoviesPage /> },
      { path: 'movies/:id', element: <MovieDetailPage /> },
      { path: 'my-list', element: <MyListPage /> },
    ],
  },
])
