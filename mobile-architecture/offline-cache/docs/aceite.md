# Critérios de aceite — status e roteiro de demonstração

Status honesto de cada critério do `CLAUDE.md`, o teste automatizado correspondente
(quando existe) e o passo a passo para reproduzir ao vivo usando a tela de debug.

Legenda: ✅ atendido e coberto por teste · 🟡 atendido, verificação manual · ⛔ fora.

| # | Critério | Status | Teste automatizado |
|---|---|---|---|
| 1 | Cache quente + rede desligada → 20 posts, zero spinner, banner com timestamp | ✅ | `cenário 3 — cache quente + offline` |
| 2 | Cache frio + rede desligada → estado vazio explicativo | ✅ | `cache frio + offline devolve estado vazio explicativo` |
| 3 | Curtir offline → contador na hora, outbox, badge | ✅ | `incrementa na hora, entra no outbox e reconcilia` |
| 4 | Religar a rede → outbox drena, badge some, contador reconcilia | ✅ | idem + `reenvio da mesma curtida não dobra o contador` |
| 5 | Deletar post no mock e sincronizar → post some | ✅ | `post deletado no servidor some do feed local` |
| 6 | Encher o cache além do budget → LRU remove, uso sob o teto | ✅ | `estourar o budget evicta os menos usados` |
| 7 | Matar o app com outbox pendente e reabrir → pendências continuam | 🟡 | `a pendência sobrevive ao fechamento do app` (simula reabertura sobre o mesmo store em memória; a persistência real em SQLite é manual) |
| 8 | `pnpm test` verde no domínio, sem emulador | ✅ | 59 testes, ~250 ms |

Extras cobertos além da lista: TTL de 7 dias esvaziando o feed, execução única de sync,
curtida pendente de post deletado sendo descartada, erro do servidor consumindo
tentativa sem matar a entrada, escrita `dead` revertendo o estado otimista.

---

## Rodando

```bash
pnpm install
pnpm test          # domínio + integração, em Node, sem emulador
pnpm typecheck
pnpm start         # Expo
```

O primeiro `pnpm start` precisa de rede: os **metadados** são gerados pelo mock server
local, mas os **bytes dos thumbnails** vêm de `picsum.photos` — é o download real que
torna o uso em MB e a evicção LRU verdadeiros na tela de debug.

`pnpm db:generate` regenera as migrations depois de mexer em `src/data/local/schema.ts`.

---

## Roteiro de demonstração

Tudo abaixo é feito pelo botão **debug** no canto superior direito do feed.

### 1. Cache quente + offline (critério 1)

1. Abra o app com rede e espere o feed carregar (20 posts com imagem).
2. Debug → ligue **forçar offline** → feche a tela.
3. Feche e reabra o app.

Esperado: os 20 posts aparecem instantaneamente, sem spinner, com o banner laranja
"Offline · atualizado há X".

### 2. Cache frio + offline (critério 2)

1. Debug → **limpar tudo** → ligue **forçar offline**.
2. Feche a tela de debug.

Esperado: texto explicativo ("Sem conexão e sem cache local…"), não erro. O botão
"tentar sincronizar" continua disponível.

### 3. Curtida offline e drenagem (critérios 3 e 4)

1. Com cache quente, Debug → **forçar offline**.
2. Curta dois posts no feed. O contador sobe na hora e aparece "pendente de envio";
   o banner mostra "2 curtidas pendentes".
3. Debug → confira a seção **Outbox**: duas entradas `pending`, 0 tentativas.
4. Desligue **forçar offline**.

Esperado: em segundos o outbox esvazia, os badges somem e o contador passa a ser o do
servidor. Confira em Debug que "última sync ok" avançou.

**Variante idempotência:** com uma curtida pendente, ponha **taxa de erro 100%**, dispare
sincronizar três vezes (as tentativas sobem, a entrada continua pendente), volte a 0% e
sincronize. O contador sobe exatamente 1.

**Variante escrita morta:** taxa de erro 100% e sincronize 5 vezes. Na quinta a entrada
vira `dead`, o coração volta ao estado do servidor e o banner mostra "1 escrita
desistiu".

### 4. Tombstone (critério 5)

1. Debug → **deletar post no servidor** (anote o id que aparece na mensagem).
2. Debug → **sincronizar** → feche.

Esperado: o post sumiu do feed e o thumbnail dele foi removido do disco — o número de
itens do cache cai em 1.

### 5. Budget e LRU (critério 6)

O teto real é 200 MB; 20 thumbnails de 400×400 não chegam perto. Para demonstrar sem
esperar:

1. Baixe `CACHE_BUDGET_MB` para `1` em `src/config.ts` e recarregue o app.
2. Debug → **limpar cache de imagens** → **baixar thumbs**.

Esperado: a barra de uso para logo abaixo de 1 MB, o contador de itens fica em poucas
unidades e os posts sem thumbnail mostram o placeholder "imagem fora do cache" — sem
erro e sem sumir do feed. Devolva o valor para `200` depois.

### 6. Persistência do outbox (critério 7)

1. **Forçar offline**, curta um post, confirme a entrada em Debug → Outbox.
2. Mate o app pelo gerenciador de tarefas (não só minimize).
3. Reabra.

Esperado: a curtida continua marcada, o badge continua lá e a entrada continua no
outbox. Desligue o offline e ela drena.

### 7. Gatilhos de sync

- **Foreground:** minimize e volte; o banner pisca "Sincronizando…".
- **Rede restaurada:** ligue e desligue **forçar offline**.
- **Background:** Debug → **task de background**. Em Expo Go responde "indisponível" —
  a task periódica exige dev build. É a degradação declarada em `docs/adr.md`.
- **Delta incremental:** Debug → **publicar post** → **sincronizar**. O post novo
  aparece no topo e o cursor avança.

---

## O que ficou de fora, sem otimismo

- **O SQL não tem teste automatizado.** `DrizzleLocalStore` e as migrations só rodam em
  runtime nativo; os testes usam `InMemoryLocalStore`. Cobrir isso exigiria `jest-expo`
  com emulador. Ver ADR-011.
- **Nenhum componente de UI é testado.** Não há teste de render; o comportamento das
  telas é verificado manualmente pelo roteiro acima.
- **A task de background não roda em Expo Go.** Registrada e tratada, mas só executa em
  dev build ou build de produção.
- **O pico do cache pode exceder o teto por um lote.** A evicção roda depois do
  download. Ver ADR-009.
- **Idempotência depende do formato do endpoint.** O mock recebe estado desejado, o que
  torna o reenvio naturalmente seguro. A chave de idempotência viaja na requisição, mas
  não há backend real deduplicando por ela. Ver ADR-005.
- **Fora de escopo por decisão do enunciado:** comentar, publicar foto pelo app,
  autenticação, paginação infinita, push notifications.
