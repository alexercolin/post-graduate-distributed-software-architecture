import { Outlet } from 'react-router-dom'
import { Header } from './modules/shared'
import styles from './App.module.css'

export const App = () => (
  <div className={styles.layout}>
    <Header />
    <main className={styles.main}>
      <Outlet />
    </main>
  </div>
)
