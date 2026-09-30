import { defineConfig } from 'vitest/config';

// Os testes rodam em Node puro, sem emulador e sem transform de React Native:
// src/domain não importa Expo/React/SQLite, e src/data usa portas (interfaces)
// que os testes substituem por implementações em memória.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
