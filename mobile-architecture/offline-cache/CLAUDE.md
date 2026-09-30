# CLAUDE.md

## Sobre este projeto

Exercício acadêmico de arquitetura de software (pós-graduação, PUC Minas) implementado
como app Expo / React Native. O objetivo **não** é entregar um produto: é demonstrar,
com código funcional, o custo e o ganho de uma decisão arquitetural específica.

Toda decisão aqui deve ser defensável em uma banca. Se algo for feito "porque é mais
fácil", registre isso explicitamente como trade-off, não esconda.

## O requisito

**Requisito funcional:** mostrar fotos em um feed de imagens.

**Requisito não funcional (versão mensurável — use esta, não a original):**

> O usuário deve conseguir visualizar os últimos **20 posts** do feed, em resolução de
> **thumbnail**, por até **7 dias** sem conexão, com indicação visível de quando foi a
> última sincronização, consumindo no máximo **200 MB** de armazenamento local.

Escopo adicional acordado: **curtir funciona offline**, com atualização otimista na UI e
sincronização posterior (padrão Outbox).

Fora de escopo: comentar, publicar foto, autenticação real, paginação infinita além dos
20 itens, push notifications.

## Decisão arquitetural central

Escolhemos **disponibilidade em detrimento de consistência forte** (AP, no vocabulário
do CAP). O app deixa de ser um cliente stateless e passa a ser uma **réplica local** do
servidor, com consistência eventual. Todo o custo de complexidade abaixo é consequência
direta dessa escolha e deve ser tratado como tal na apresentação.

| Decisão | Racional | Preço aceito |
|---|---|---|
| Banco local como Single Source of Truth | UI nunca fala com a rede; render determinístico e testável | Precisa de migrations e schema versionado no cliente |
| Duas camadas de persistência (metadados vs. binários) | Ciclos de vida diferentes: 500 posts de metadados custam KBs, 30 imagens custam MBs | Duas políticas de evicção para manter coerentes |
| Stale-while-revalidate | Feed abre instantâneo mesmo online; offline é caso particular, não código separado | Usuário pode ver dado desatualizado por alguns segundos |
| Delta sync por cursor + tombstones | Sem tombstones o cliente nunca descobre que um post foi deletado ou moderado | Backend precisa manter registro de deleções |
| Outbox para escritas | Curtida offline não se perde e não bloqueia a UI | Precisa de idempotência e política de conflito |
| Evicção LRU com budget fixo | Garante o teto de 200 MB do RNF | Imagem antiga some; UI precisa de placeholder gracioso |
| TTL de 7 dias | Limita a janela de dado potencialmente errado (moderação, privacidade) | Depois disso o feed offline fica vazio, por design |

Alternativas rejeitadas (mantenha registradas, a banca vai perguntar):

- **Apenas cache HTTP (`Cache-Control`)** — quase de graça, mas o SO pode evictar a
  qualquer momento. Não satisfaz um RNF com número.
- **Replicação total do feed** — custo de storage e banda desproporcional para um feed
  potencialmente infinito.

## Arquitetura em camadas

```
UI (componentes)          -> só renderiza, nunca chama rede
  observa
Repository (SSOT)         -> única porta de entrada de dados
  |- LocalStore           -> SQLite: metadados, outbox, estado de sync
  |- ImageCache           -> FileSystem: binários, LRU, budget
  |- RemoteDataSource     -> API fake, delta sync, tombstones
SyncEngine                -> orquestra pull (delta) e push (outbox)
```

Regra de dependência: setas apontam para dentro. `LocalStore` não conhece
`RemoteDataSource`. A UI não conhece nenhum dos dois.

## Stack

- **Expo** (managed workflow) + TypeScript strict
- **expo-sqlite** para persistência de metadados
- **Drizzle ORM** (`drizzle-orm/expo-sqlite`) com `useLiveQuery` para reatividade —
  é o que faz a UI observar o banco em vez de fazer polling
- **drizzle-kit** para migrations versionadas
- **expo-image** para cache em memória + disco das imagens
- **expo-file-system** para o cache gerenciado com LRU (precisamos controlar o budget,
  o cache automático do `expo-image` não expõe isso)
- **@react-native-community/netinfo** para estado de conectividade
- **expo-task-manager** + task de background para o sync periódico
- **Vitest** ou **jest-expo** para os testes de domínio

> Antes de instalar qualquer coisa, verifique a versão do SDK do Expo no `app.json` e
> consulte a documentação atual da biblioteca. As APIs de background task e de
> `expo-sqlite` mudaram entre versões recentes do SDK. Não assuma assinaturas de função
> de memória — leia os tipos.

## Estrutura de pastas

```
src/
  domain/          entidades e regras puras, zero import de React ou Expo
    post.ts
    outbox.ts
    eviction.ts
  data/
    local/         schema drizzle, migrations, queries
    remote/        cliente da API fake
    images/        ImageCache com LRU
    repository/    FeedRepository — a fachada única
  sync/            SyncEngine, task de background, política de retry
  ui/              telas e componentes
  config.ts        constantes do RNF: MAX_POSTS, TTL_DAYS, CACHE_BUDGET_MB
```

`src/config.ts` existe para que os números do RNF fiquem em um lugar só e sejam
citáveis na apresentação. Nunca hardcode 20, 7 ou 200 no meio do código.

## Modelo de dados local

```sql
posts        id, author, caption, image_url, thumb_url,
             created_at, updated_at, deleted_at, likes_count,
             liked_by_me, cached_at

outbox       id, entity_id, kind ('like' | 'unlike'),
             created_at, attempts, last_error, status

sync_state   key, cursor, last_success_at
```

`liked_by_me` é o valor **derivado**: estado do servidor sobrepujado pelo que estiver
pendente no outbox. Essa derivação é regra de domínio e deve morar em `src/domain`,
testada sem banco.

## Contrato da API fake

Não use rede real. Implemente um módulo local que simula o servidor, porque precisamos
controlar as falhas para demonstrar o comportamento.

```ts
GET /feed?cursor=<iso>  ->  { posts: Post[], deleted: string[], cursor: string }
POST /posts/:id/like    ->  { likes_count: number }   // idempotente
```

O mock precisa expor controles de teste: latência artificial, taxa de erro, modo
offline forçado, e a capacidade de deletar um post no "servidor" para exercitar o
caminho dos tombstones.

## Regras invioláveis

1. **Nenhum componente de UI faz `fetch` ou chama o `RemoteDataSource`.** Se você
   sentir vontade, o repositório está com a API errada — conserte o repositório.
2. **A UI nunca aguarda a rede para primeira pintura.** Render vem do banco local,
   sempre. Spinner só aparece quando não há absolutamente nada em cache.
3. **`src/domain` não importa React, Expo, SQLite nem nada de I/O.** É onde ficam os
   testes rápidos.
4. **Todo estado de sincronização é visível ao usuário.** Banner de offline e
   "atualizado há X" não são enfeite, são o que torna a consistência eventual honesta.
5. **Nada de `any`.** TypeScript em strict mode, e erros de tipo não se resolvem com
   cast.
6. **Não adicione biblioteca nova sem perguntar.** Cada dependência é uma decisão
   arquitetural que precisa caber na apresentação.

## Critérios de aceite

Cada um destes precisa ser demonstrável ao vivo:

- [ ] Abrir o app com cache quente e rede desligada → 20 posts com thumbnails, zero
      spinner, banner de offline visível com timestamp da última sync.
- [ ] Abrir o app com cache frio e rede desligada → estado vazio explicativo, não erro.
- [ ] Curtir offline → contador incrementa na hora, item entra no outbox, badge de
      pendência aparece.
- [ ] Religar a rede → outbox drena, badge some, contador reconcilia com o servidor.
- [ ] Deletar um post no mock server e sincronizar → post some do feed local.
- [ ] Encher o cache além do budget → LRU remove os mais antigos, uso fica sob 200 MB.
- [ ] Matar o app com outbox pendente e reabrir → pendências continuam lá.
- [ ] `pnpm test` verde no domínio, sem precisar de emulador.

## Notas de trabalho

- Prefira commits pequenos por fase, com mensagem descrevendo a decisão, não o arquivo.
- Quando implementar algo que tem trade-off, adicione um comentário curto `// trade-off:`
  explicando o que foi trocado por quê. Vou usar esses comentários para montar os slides.
- Se algo que eu pedi contradiz uma decisão registrada aqui, aponte a contradição em vez
  de escolher silenciosamente.
