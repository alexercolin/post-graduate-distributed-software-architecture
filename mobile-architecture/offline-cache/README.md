# Feed offline-first — Expo + SQLite + Drizzle

Exercício de arquitetura: o custo real de trocar **consistência forte por
disponibilidade** (AP no vocabulário do CAP) em um app móvel.

O requisito funcional é banal — mostrar fotos num feed. O que dita a arquitetura é o
requisito não funcional:

> Visualizar os últimos **20 posts** em thumbnail por até **7 dias** sem conexão, com
> indicação da última sincronização, consumindo no máximo **200 MB** de armazenamento
> local. Curtir funciona offline.

Os três números vivem em [`src/config.ts`](src/config.ts) e em nenhum outro lugar.

```bash
pnpm install
pnpm test        # 59 testes, ~250 ms, sem emulador
pnpm typecheck
pnpm start
```

## Camadas

```
ui/                    só renderiza — nunca chama rede
  observa
data/repository/       FeedRepository: a fachada única da UI
  |- data/local/       SQLite + Drizzle: posts, outbox, sync_state
  |- data/images/      FileSystem: thumbnails, LRU, budget de 200 MB
  |- data/remote/      servidor fake com controles de falha
sync/                  SyncEngine: push do outbox + pull do delta
domain/                regras puras — zero React, Expo ou I/O
```

Setas apontam para dentro. `LocalStore` não conhece `RemoteDataSource`; a UI não conhece
nenhum dos dois; `src/domain` não importa nada de I/O e é onde ficam os testes rápidos.
`src/container.ts` é o único arquivo que enxerga todas as camadas ao mesmo tempo.

## As quatro peças que fazem o offline funcionar

| Peça | Onde | O que resolve |
|---|---|---|
| **Banco local como SSOT** | `data/local` | A primeira pintura nunca espera rede |
| **Delta sync + tombstones** | `sync/syncEngine.ts` | Descobrir o que mudou *e* o que foi deletado |
| **Outbox** | `domain/outbox.ts` | Curtida offline não se perde nem bloqueia a UI |
| **LRU com budget** | `domain/eviction.ts` | O teto de 200 MB é garantido pelo app, não pelo SO |

E a regra que amarra tudo: **`liked_by_me` é derivado**, nunca armazenado. O banco guarda
o estado do servidor; o que a tela mostra é `deriveLikeState(post, outbox)` — uma função
pura, testada sem banco. Quando a escrita confirma, a entrada sai do outbox e a
derivação passa a devolver o valor do servidor sozinha: não existe código de "desfazer
otimismo".

## Documentos

- [`docs/adr.md`](docs/adr.md) — as 12 decisões em formato ADR, com alternativas
  rejeitadas e consequências negativas assumidas; ao final, as três perguntas mais
  difíceis que uma banca pode fazer e a resposta honesta de cada uma.
- [`docs/aceite.md`](docs/aceite.md) — status de cada critério de aceite, roteiro de
  demonstração ao vivo pela tela de debug e o que ficou de fora.
- `CLAUDE.md` — o enunciado e as regras invioláveis do exercício.

## Tela de debug

Botão `debug` no topo do feed. É o instrumento da apresentação: uso do cache em MB
contra o budget, itens do outbox com tentativas e último erro, cursor atual, timestamp
da última sync, e botões para forçar offline, ajustar latência e taxa de erro, deletar
um post no servidor, publicar post, disparar sync e limpar tudo.
