import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Sem vite-plugin-pwa! O service worker é escrito manualmente em public/sw.js.
// Isso é intencional para fins educacionais.
export default defineConfig({
  plugins: [react()],
})
