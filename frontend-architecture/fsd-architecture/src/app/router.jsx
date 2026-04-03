import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { Header } from '@/widgets/header'
import { MoviesPage } from '@/pages/movies'
import { MovieDetailPage } from '@/pages/movie-detail'
import { MyListPage } from '@/pages/my-list'
import styles from './layout.module.css'

const RootLayout = () => (
  <div className={styles.layout}>
    <Header />
    <main className={styles.main}><Outlet /></main>
  </div>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/movies" replace /> },
      { path: 'movies', element: <MoviesPage /> },
      { path: 'movies/:id', element: <MovieDetailPage /> },
      { path: 'my-list', element: <MyListPage /> },
    ],
  },
])
