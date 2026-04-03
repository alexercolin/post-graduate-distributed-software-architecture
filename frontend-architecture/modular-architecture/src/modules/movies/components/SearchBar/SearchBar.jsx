import { useState } from 'react'
import styles from './SearchBar.module.css'

export const SearchBar = ({ onSearch }) => {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(value.trim())
  }

  const handleClear = () => {
    setValue('')
    onSearch('')
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="text"
        placeholder="Buscar filmes..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {value && (
        <button type="button" className={styles.clearBtn} onClick={handleClear}>
          ✕
        </button>
      )}
      <button type="submit" className={styles.searchBtn}>
        Buscar
      </button>
    </form>
  )
}
