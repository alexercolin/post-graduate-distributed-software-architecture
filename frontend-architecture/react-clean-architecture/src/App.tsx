/**
 * APP - Router Setup
 *
 * O App.tsx e responsavel apenas por:
 * - Configurar o DI Provider (composition root)
 * - Definir as rotas da aplicacao
 *
 * Ele NAO contem logica de negocio nem chamadas a API.
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DependenciesProvider } from "./di/dependencies-context";
import { createDependencies } from "./di/container";
import { Home } from "./presentation/views/home/home";
import { MovieDetailView } from "./presentation/views/movie-detail/movie-detail";
import "./App.css";

const dependencies = createDependencies();

function App() {
  return (
    <DependenciesProvider dependencies={dependencies}>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetailView />} />
          </Routes>
        </div>
      </BrowserRouter>
    </DependenciesProvider>
  );
}

export default App;
