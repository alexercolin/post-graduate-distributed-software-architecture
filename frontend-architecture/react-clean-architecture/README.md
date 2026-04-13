# React Clean Architecture

Projeto didatico que demonstra como aplicar **Clean Architecture** em uma aplicacao React + TypeScript.

Usa a API do [TMDB](https://www.themoviedb.org/) para listar e buscar filmes.

## Arquitetura

```
src/
├── domain/              ← Camada mais INTERNA (zero dependencias externas)
│   ├── entities/        ← Tipos puros do dominio (Movie, MovieDetail)
│   ├── repositories/    ← Interfaces (contratos) - nao implementacoes
│   └── usecases/        ← Operacoes de negocio (GetPopularMovies, etc.)
│
├── data/                ← Implementa os contratos definidos pelo dominio
│   ├── models/          ← DTOs - formato exato da API externa
│   ├── mappers/         ← Converte API Model → Domain Entity
│   └── repositories/    ← Implementacao concreta (MovieRepositoryImpl)
│
├── infrastructure/      ← Ferramentas tecnicas (HTTP, cache, storage)
│   └── http/            ← Cliente HTTP generico (FetchHttpClient)
│
├── di/                  ← Composition Root (monta o grafo de dependencias)
│   ├── container.ts     ← Cria e conecta todas as instancias
│   └── dependencies-context.tsx ← React Context para fornecer use cases
│
└── presentation/        ← Camada de UI (React puro)
    ├── hooks/           ← Custom hooks = ViewModels
    ├── shared/          ← Componentes reutilizaveis (Loading, MovieCard)
    └── views/           ← Paginas (Home, MovieDetail)
```

## Regra de Dependencia

A regra fundamental da Clean Architecture: **dependencias so apontam para dentro**.

```
Presentation → Domain ← Data ← Infrastructure
      ↓                   ↓
   usa use cases    implementa interfaces do domain
```

- `domain/` nao importa NADA de fora. Tipos puros.
- `data/` importa `domain/` (para implementar interfaces) e `infrastructure/` (para fazer HTTP).
- `presentation/` importa apenas `domain/` (entities) e `di/` (para obter use cases).
- `di/` e o unico que conhece todas as camadas - e o "cimento" que junta tudo.

## Fluxo de uma requisicao

```
1. View (Home) renderiza e chama o hook usePopularMovies()
2. Hook usa o use case GetPopularMovies (recebido via Context/DI)
3. Use case chama repository.getPopularMovies() (interface do dominio)
4. MovieRepositoryImpl (data layer) faz HTTP GET via HttpClient
5. Resposta da API e convertida pelo MovieMapper (API Model → Entity)
6. Entity volta pro hook → hook atualiza estado → View re-renderiza
```

## Como rodar

```bash
# Instalar dependencias
npm install

# Criar arquivo .env com as variaveis (ja existe um .env de exemplo)
# VITE_API_BASE_URL=https://api.themoviedb.org/3
# VITE_API_TOKEN=seu_token_aqui

# Rodar em desenvolvimento
npm run dev
```

## Conceitos demonstrados

| Conceito | Onde |
|---|---|
| Entities (tipos do dominio) | `domain/entities/movie.ts` |
| Repository Pattern (interface) | `domain/repositories/movie-repository.ts` |
| Use Cases / Interactors | `domain/usecases/*.ts` |
| DTO / API Models | `data/models/movie-api-model.ts` |
| Mapper Pattern | `data/mappers/movie-mapper.ts` |
| Repository Implementation | `data/repositories/movie-repository-impl.ts` |
| Dependency Inversion (DIP) | Domain define interface, Data implementa |
| Composition Root / DI | `di/container.ts` + `di/dependencies-context.tsx` |
| ViewModel via Hooks | `presentation/hooks/*.ts` |
| Separation of Concerns | Cada camada com responsabilidade unica |

## Por que Clean Architecture?

1. **Testabilidade**: cada camada pode ser testada isoladamente (mock do repositorio no use case, mock do HTTP no repositorio)
2. **Independencia de framework**: o dominio nao sabe que React existe
3. **Independencia de API**: trocar de REST para GraphQL muda apenas o `data/` layer
4. **Manutenibilidade**: mudancas em uma camada nao cascateiam para as outras
