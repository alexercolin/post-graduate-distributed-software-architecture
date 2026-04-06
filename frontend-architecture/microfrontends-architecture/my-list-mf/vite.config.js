import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "my-list-mf",
      remotes: {
        // Aponta para o remoteEntry.js gerado pelo build do movies-mf
        "movies-mf": "http://localhost:4101/assets/remoteEntry.js",
      },
      shared: ["react", "react-dom"],
    }),
  ],
  build: {
    target: "esnext",
    minify: false,
  },
  server: {
    port: 4102,
    cors: true,
  },
  preview: {
    port: 4102,
    cors: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
  },
});
