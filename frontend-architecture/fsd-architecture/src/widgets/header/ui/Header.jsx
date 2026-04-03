import { NavLink } from 'react-router-dom'
import { useLikeMovie } from '@/features/like-movie'
import styles from './Header.module.css'

// Widget pode importar de features e entities — mas nunca de pages.
export const Header = () => {
  const { liked } = useLikeMovie()

  return (
    <header className={styles.header}>
      <span className={styles.brand}>🎬 CineApp</span>
      <nav className={styles.nav}>
        <NavLink to="/movies" className={({ isActive }) => isActive ? styles.active : ''}>
          Filmes
        </NavLink>
        <NavLink to="/my-list" className={({ isActive }) => isActive ? styles.active : ''}>
          Minha Lista
          {liked.length > 0 && <span className={styles.badge}>{liked.length}</span>}
        </NavLink>
      </nav>
    </header>
  )
}
