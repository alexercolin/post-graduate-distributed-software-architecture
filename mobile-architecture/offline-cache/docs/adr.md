# ADRs — feed offline-first

Registro das decisões arquiteturais desta implementação. Cada ADR corresponde a um
ponto do código marcado com `// trade-off:`.

Requisito não funcional que origina tudo:

> Visualizar os últimos **20 posts** em **thumbnail** por até **7 dias** sem conexão,
> com indicação da última sincronização, consumindo no máximo **200 MB** locais.

Os três números vivem em `src/config.ts` e em nenhum outro lugar.

---

## ADR-001 — Disponibilidade em detrimento de consistência forte (AP)

**Contexto.** O requisito exige leitura sem rede por 7 dias. Um cliente stateless não
consegue satisfazer isso: sem servidor, não há tela.

**Decisão.** O app passa a ser uma **réplica local** do servidor, com consistência
eventual. O banco local é o Single Source of Truth da UI; a rede alimenta o banco,
nunca a tela.

**Alternativas rejeitadas.**

- *Apenas cache HTTP (`Cache-Control`)* — quase de graça, mas o SO pode evictar o
  cache a qualquer momento. Um RNF com número não pode depender de política de
  terceiro.
- *Replicação total do feed* — custo de banda e storage desproporcional para um feed
  potencialmente infinito.

**Consequências positivas.** Render determinístico e testável; offline deixa de ser
caso especial e vira o caso normal com a rede parada.

**Consequências negativas.** O cliente ganha schema, migrations, cursor, tombstones,
outbox e política de evicção — tudo isso é dívida permanente de manutenção. E o dado
na tela pode estar errado (ver ADR-008).

---

## ADR-002 — Duas camadas de persistência: metadados (SQLite) e binários (FileSystem)

**Contexto.** 500 posts de metadados custam KBs; 30 thumbnails custam MBs. Ciclos de
vida e custos completamente diferentes.

**Decisão.** `expo-sqlite` + Drizzle para metadados, outbox e estado de sync;
`expo-file-system` para os binários, com índice próprio (`manifest.json`) na mesma
pasta dos arquivos.

**Alternativas rejeitadas.** Guardar o índice do cache de imagens como quarta tabela
no SQLite — acoplaria o ciclo de vida dos binários ao do banco e daria a impressão
falsa de que uma transação cobre os dois.

**Consequências positivas.** Uma camada pode ser esvaziada sem afetar a outra: limpar
imagens não perde curtidas pendentes.

**Consequências negativas.** Duas políticas de evicção para manter coerentes, e nenhuma
transação atravessa as duas. O `SyncEngine` só apaga binários **depois** do commit do
merge: se o app morre no meio, sobra arquivo órfão (barato de reconciliar) em vez de
post sem imagem.

---

## ADR-003 — Stale-while-revalidate como único caminho de leitura

**Contexto.** Se a UI aguardar a rede na primeira pintura, o app tem dois modos de
operação (com e sem rede) e o dobro de caminhos para testar.

**Decisão.** `FeedRepository.observeFeed` emite o estado local **imediatamente** e só
então dispara a revalidação, que emite de novo. Spinner apenas quando não existe
absolutamente nada em cache.

**Consequências positivas.** Um caminho de código só. Offline é o caso em que a
revalidação falha e a primeira emissão continua valendo.

**Consequências negativas.** O usuário pode ver dado desatualizado por alguns
segundos. Mitigado pelo banner "atualizado há X" (ADR-007).

---

## ADR-004 — Delta sync por cursor + tombstones, com comparação inclusiva

**Contexto.** Sem tombstones o cliente nunca descobre que um post foi deletado ou
moderado — ele fica no dispositivo para sempre.

**Decisão.** `GET /feed?cursor=<iso>` devolve `{ posts, deleted, cursor }`. A
comparação do cursor é **inclusiva** (`>=`), não exclusiva.

**Por que inclusiva.** Com `>`, qualquer evento que ocorra no mesmo milissegundo do
cursor desaparece para sempre — e esse é justamente o caso de uma escrita logo após
uma sincronização. Isso apareceu como teste vermelho, não como teoria.

**Consequências positivas.** Entrega ao-menos-uma-vez; nenhum evento se perde na borda.

**Consequências negativas.** Eventos da borda são reentregues na sync seguinte. O merge
do domínio é idempotente (last-write-wins por `updatedAt`), então a reentrega não tem
efeito colateral — apenas alguns bytes a mais.

---

## ADR-005 — Outbox para escritas, com compactação e backoff

**Contexto.** Curtir offline não pode se perder nem bloquear a UI.

**Decisão.** Toda escrita vira uma linha em `outbox`, aplicada otimisticamente na UI
por derivação (ADR-006). O `SyncEngine` drena em ordem de criação, com backoff
exponencial e teto de tentativas. Três regras não óbvias:

1. **Push antes de pull.** Se puxássemos primeiro, o delta traria o contador anterior à
   nossa própria escrita e a UI piscaria de volta ao valor antigo.
2. **Compactação no enfileiramento** (`planEnqueue`). Curtir e descurtir antes de a
   primeira requisição sair anula as duas: zero requisições em vez de duas. Só vale
   quando a entrada oposta tem `attempts === 0` — se a requisição já saiu, não sabemos
   se o servidor recebeu, e a compensação precisa ir.
3. **Falha de transporte não gasta tentativa.** Estar offline não é a escrita falhar;
   só erro do servidor incrementa `attempts`.

**Consequências positivas.** A pendência sobrevive a fechar o app (está no banco), e a
UI nunca espera rede.

**Consequências negativas.** Idempotência vira requisito do servidor. Aqui o endpoint
recebe o **estado desejado** (`liked: boolean`), não um incremento — reenviar não dobra
o contador. Um `POST /like` que incrementasse exigiria deduplicação por chave de
idempotência no backend.

---

## ADR-006 — `liked_by_me` é derivado, não armazenado

**Contexto.** Existem dois estados de curtida: o que o servidor confirmou e o que o
usuário acabou de fazer. Persistir o segundo por cima do primeiro perde a informação de
que há algo pendente.

**Decisão.** O banco guarda **só o estado do servidor**. O visível é
`deriveLikeState(post, entradasDoOutbox)`, função pura em `src/domain/post.ts`, testada
sem banco.

**Consequências positivas.** Reconciliação automática: quando o push confirma, a entrada
sai do outbox e a derivação passa a devolver o valor do servidor sem nenhum código de
"desfazer otimismo".

**Consequências negativas.** Toda leitura precisa cruzar duas tabelas. Para 20 posts é
irrelevante; para 10.000 exigiria índice e projeção materializada.

**Detalhe defensável.** Entradas `dead` (que excederam o teto de tentativas) são
**ignoradas** na derivação: o coração volta ao estado do servidor e o banner mostra
"escrita desistiu". Manter o otimismo aceso seria mentir para o usuário.

---

## ADR-007 — Todo estado de sincronização é visível

**Decisão.** Banner permanente com online/offline, "atualizado há X", contagem de
escritas pendentes e de escritas mortas. Placeholder explícito para thumbnail evictado.
Estado vazio explicativo quando não há cache nem rede.

**Racional.** Consistência eventual sem sinalização é indistinguível de bug. O banner
não é enfeite: é o que torna a escolha do ADR-001 honesta com o usuário.

---

## ADR-008 — Onde esta arquitetura pode mostrar dado errado

Três pontos, com mitigação:

| Risco | Como acontece | Mitigação |
|---|---|---|
| **Post moderado/removido continua na tela** | O app ficou offline depois que o servidor deletou o post | TTL de 7 dias (`cachedAt` é renovado a cada sync bem-sucedida, então o TTL mede "tempo sem contato com o servidor"). Passada a janela, o feed esvazia por design |
| **Contador de curtidas divergente** | Outro usuário curtiu enquanto estávamos offline | O contador local é o do servidor + delta do outbox. Reconcilia no próximo pull; enquanto isso o número pode estar defasado, nunca "inventado" |
| **Escrita perdida sem o usuário saber** | Outbox atinge o teto de 5 tentativas | Entrada vira `dead`, o estado otimista é revertido e o banner informa. Nada some em silêncio |

---

## ADR-009 — LRU com budget fixo, evicção depois do download

**Decisão.** `planEviction` (domínio, puro) recebe os itens com tamanho e último acesso
mais o budget e devolve o que remover, do menos usado para o mais usado.

**Consequências negativas assumidas.**

- A evicção roda **depois** do download, então o uso pode ultrapassar o teto pelo
  tamanho de um lote (4 thumbnails, ~centenas de KB). Reservar antes exigiria saber o
  tamanho do arquivo antes de baixá-lo.
- `protectedKeys` cobre apenas o lote recém-baixado, não o pedido inteiro. Se
  protegêssemos tudo o que a tela pediu, um pedido maior que o budget desligaria a
  evicção e o teto de 200 MB deixaria de valer.
- O último acesso é gravado em memória e só descarregado em disco nas mutações. Um
  crash perde os acessos da sessão: o LRU fica desatualizado, nunca incorreto.
- LRU puro ignora "custo de recuperar". Para thumbnails, errar é barato — o que não
  seria verdade num cache de vídeo.

---

## ADR-010 — Cache em `Paths.document`, não em `Paths.cache`

**Decisão.** Os binários vão para o diretório de documentos.

**Racional.** O diretório de cache pode ser esvaziado pelo SO a qualquer momento — que
é exatamente a alternativa rejeitada no ADR-001. Com 7 dias de garantia no requisito,
não dá para delegar a decisão de apagar.

**Consequência negativa.** O espaço conta como dado do app e entra no backup do iOS se
não for explicitamente excluído. É o preço de a janela de 7 dias ser real.

---

## ADR-011 — Ports & adapters para poder testar sem emulador

**Decisão.** `LocalStore`, `ImageCache` e `RemoteDataSource` são interfaces. Produção
usa Drizzle/FileSystem; os testes usam implementações em memória. `src/domain` não
importa React, Expo nem SQLite.

**Consequência positiva.** 59 testes em ~250 ms, sem emulador, cobrindo domínio e
orquestração (repositório + sync engine + servidor fake reais).

**Consequência negativa — declarada.** O SQL de `DrizzleLocalStore` **não** é
exercitado por teste automatizado, porque `expo-sqlite` só existe dentro do runtime
nativo. Essa parte é coberta pelos critérios de aceite manuais em `docs/aceite.md`.

---

## ADR-012 — Sincronização com execução única

**Decisão.** A promessa em andamento é o próprio lock: uma segunda chamada concorrente é
**descartada** (`skipped: true`), não enfileirada.

**Racional.** Foreground e volta da rede podem disparar no mesmo instante; dois merges
sobre o mesmo estado base produziriam escrita perdida.

**Consequência negativa.** Uma sincronização legitimamente necessária pode ser
descartada se chegar durante outra. Para um feed de 20 itens com quatro gatilhos, o
próximo gatilho resolve. Enfileirar abriria espaço para uma fila crescer sem controle.

---

## As três perguntas mais difíceis, e a resposta honesta

**1. "Como você sabe que o app respeita o teto de 200 MB, se a evicção roda depois do
download?"**

Não respeito o teto instantaneamente — respeito em regime. O pico pode exceder em até
um lote de thumbnails (4 arquivos, centenas de KB numa escala de 200 MB). Se o RNF
fosse um limite duro imposto pelo SO, isso não bastaria: seria preciso um `HEAD` para
descobrir o `Content-Length` antes de baixar, ou baixar para uma área temporária fora
da contabilidade. Está simplificado, e conscientemente.

**2. "Seu `MockServer` é idempotente porque o endpoint recebe estado desejado. E se o
backend real fosse `POST /like` incremental?"**

Aí a idempotência precisaria ser do backend: deduplicação pela chave que já mando na
requisição (o id da entrada do outbox). O cliente está pronto — a chave viaja e é
estável entre retentativas. O que não existe aqui é o outro lado dessa conversa. Essa
parte está simplificada por o servidor ser fake.

**3. "Você tem 59 testes verdes, mas nenhum toca no SQLite. O que eles realmente
provam?"**

Provam o domínio (derivação, merge, TTL, LRU, backoff, compactação) e a orquestração
(stale-while-revalidate, tombstones, drenagem do outbox, execução única) — com o
servidor fake, o `SyncEngine` e o `FeedRepository` de produção. Não provam o mapeamento
objeto-relacional nem as migrations: para isso seria preciso rodar em emulador com
`jest-expo`, ou trocar o driver por um SQLite de Node. É a lacuna consciente do
ADR-011, e é o motivo de `docs/aceite.md` existir com roteiro manual.
