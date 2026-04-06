import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "movies-mf",
      filename: "remoteEntry.js",
      exposes: {
        // Qualquer projeto pode importar via: "movies-mf/FavoriteButton"
        "./FavoriteButton": "./src/FavoriteButton.jsx",
      },
      shared: ["react", "react-dom"],
    }),
  ],
  build: {
    // Obrigatório para Module Federation funcionar com ES modules
    target: "esnext",
    minify: false,
  },
  server: {
    port: 4101,
    cors: true,
  },
  preview: {
    port: 4101,
    cors: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
  },
});
