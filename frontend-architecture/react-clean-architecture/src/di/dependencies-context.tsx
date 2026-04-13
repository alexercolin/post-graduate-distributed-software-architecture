/**
 * COMPOSITION ROOT - React Context para DI
 *
 * Fornece os use cases para toda a arvore de componentes via Context API.
 * Os componentes/hooks consomem os use cases sem saber como foram construidos.
 *
 * Isso e o equivalente React de um DI container em frameworks backend:
 * - Angular tem o Injector
 * - Spring tem o ApplicationContext
 * - Aqui usamos React Context
 */

import { createContext, useContext } from "react";
import type { AppDependencies } from "./container";

const DependenciesContext = createContext<AppDependencies | null>(null);

export function DependenciesProvider({
  dependencies,
  children,
}: {
  dependencies: AppDependencies;
  children: React.ReactNode;
}) {
  return (
    <DependenciesContext value={dependencies}>
      {children}
    </DependenciesContext>
  );
}

export function useDependencies(): AppDependencies {
  const context = useContext(DependenciesContext);
  if (!context) {
    throw new Error("useDependencies must be used within DependenciesProvider");
  }
  return context;
}
