import { NavLink } from 'react-router-dom'
import { useMyList } from '../../../myList'
import styles from './Header.module.css'

export const Header = () => {
  const { list } = useMyList()

  return (
    <header className={styles.header}>
      <span className={styles.brand}>🎬 CineApp</span>
      <nav className={styles.nav}>
        <NavLink to="/movies" className={({ isActive }) => isActive ? styles.active : ''}>
          Filmes
        </NavLink>
        <NavLink to="/my-list" className={({ isActive }) => isActive ? styles.active : ''}>
          Minha Lista
          {list.length > 0 && <span className={styles.badge}>{list.length}</span>}
        </NavLink>
      </nav>
    </header>
  )
}
