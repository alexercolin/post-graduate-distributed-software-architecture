# Kickoff — sessão do Claude Code

Coloque o `CLAUDE.md` na raiz do repo antes de começar. Ele é lido automaticamente e
evita que você tenha que re-explicar o contexto a cada fase.

Rode as fases em sessões separadas (`/clear` entre elas). Contexto acumulado de uma
fase anterior atrapalha mais do que ajuda quando a próxima fase mexe em outra camada.

---

## Fase 0 — desenho, sem código

Comece em **plan mode** (`Shift+Tab` duas vezes). O objetivo desta fase é ter um
desenho que você entenda inteiro antes de existir um único arquivo.

```
Leia o CLAUDE.md. Não escreva código ainda.

Quero que você desenhe a solução antes de implementar. Me entregue:

1. A assinatura pública completa do FeedRepository — só os tipos, como se fosse um
   arquivo .d.ts. Essa é a única superfície que a UI enxerga, então quero avaliá-la
   isoladamente.

2. O fluxo de leitura passo a passo em três cenários: cache frio + online,
   cache quente + online, cache quente + offline. Diga em cada um o que a UI
   renderiza em cada instante.

3. Como o liked_by_me é derivado a partir do estado do servidor mais o outbox
   pendente, e onde essa derivação mora.

4. Os três pontos onde essa arquitetura pode produzir dado incorreto para o usuário,
   e a mitigação de cada um.

5. Uma lista das decisões que você precisaria tomar e que o CLAUDE.md não cobre.
   Me pergunte sobre elas em vez de decidir sozinho.

Seja crítico: se alguma decisão registrada no CLAUDE.md estiver errada ou for
desnecessariamente complexa para o escopo, diga.
```

Não avance enquanto o item 5 não estiver resolvido. É nele que aparecem as perguntas
que a banca vai fazer.

---

## Fase 1 — domínio puro e testado

```
Implemente apenas a camada src/domain, sem nenhuma dependência de Expo, React ou
SQLite. Nada de I/O.

Inclua:
- os tipos Post, OutboxEntry e SyncState
- a função que deriva o estado de curtida visível a partir do post do servidor mais
  as entradas pendentes do outbox
- a função de merge do delta sync: recebe posts locais, posts recebidos e a lista de
  ids deletados, devolve o novo estado local
- a política de evicção LRU: recebe a lista de itens em cache com tamanho e último
  acesso mais o budget, devolve o que deve ser removido
- a política de retry do outbox com backoff exponencial e teto de tentativas

Escreva os testes junto, cobrindo os casos de borda: delta vazio, post deletado que
tem curtida pendente no outbox, budget menor que um único item, entrada de outbox
que excedeu o teto de tentativas.

Rode os testes e me mostre o resultado antes de seguir.
```

Esta fase é a que mais rende na apresentação: são as regras arquiteturais em forma
executável, e rodam em segundos sem emulador.

---

## Fase 2 — persistência e repositório

```
Agora a camada de dados.

1. Schema Drizzle para as três tabelas descritas no CLAUDE.md, com migration gerada
   pelo drizzle-kit. Verifique na documentação atual como configurar o drizzle com
   expo-sqlite nesta versão do SDK antes de escrever.

2. LocalStore com as queries necessárias, sem lógica de negócio dentro.

3. RemoteDataSource apontando para o mock server local, com os controles de teste
   (latência, taxa de erro, offline forçado, deleção de post no servidor).

4. FeedRepository implementando exatamente a interface aprovada na fase 0, com
   stale-while-revalidate: emite o local imediatamente, revalida, emite de novo.

A UI ainda não existe. Prove que funciona com um teste de integração que exercite
os três cenários de leitura.
```

---

## Fase 3 — cache de imagens com budget

```
Implemente o ImageCache em src/data/images usando expo-file-system, aplicando a
política de evicção que já foi escrita e testada na fase 1.

Requisitos:
- download de thumbnails apenas, sob demanda do repositório
- registro de tamanho em disco e último acesso de cada item
- evicção disparada quando o budget de config.ts é excedido
- uma função que reporte o uso atual, porque vou precisar mostrar isso na tela de
  debug

Não use o cache automático do expo-image para os thumbnails do feed: precisamos do
controle explícito do budget para satisfazer o RNF. Use expo-image apenas como
componente de renderização.
```

---

## Fase 4 — sync engine e outbox

```
Implemente o SyncEngine:

- pull: delta sync por cursor, aplica o merge do domínio, persiste o novo cursor
- push: drena o outbox em ordem, respeitando o backoff, marcando falhas
- gatilhos: abertura do app, retorno de foreground, transição offline para online
  via NetInfo, e uma task periódica de background
- garantia de execução única: duas sincronizações simultâneas não podem se sobrepor

O push tem que ser idempotente. Se a requisição de curtida sair mas a resposta se
perder, a repetição não pode dobrar o contador.
```

---

## Fase 5 — UI e a honestidade sobre o dado

```
Agora a interface. Feed simples, mas com os sinais de estado corretos:

- lista dos 20 posts observando o banco via useLiveQuery, nunca chamando rede
- banner de offline com "atualizado há X"
- botão de curtir com update otimista e indicador visual de pendência
- estado vazio explicativo quando não há cache e não há rede
- placeholder gracioso para imagem que foi evictada
- uma tela de debug acessível por gesto ou botão escondido, mostrando: uso do cache
  em MB, itens no outbox, cursor atual, timestamp da última sync, e botões para
  forçar offline, limpar cache e disparar sync

A tela de debug é o que eu vou usar para demonstrar o comportamento na apresentação,
então ela importa tanto quanto o feed.
```

---

## Fase 6 — validação dos critérios de aceite

```
Percorra a lista de critérios de aceite do CLAUDE.md um por um. Para cada um, me diga
como reproduzi-lo manualmente no app, passo a passo, usando a tela de debug.

Onde for possível cobrir com teste automatizado em vez de manual, escreva o teste.

No final, me dê um relatório do que está atendido, do que está parcialmente atendido
e do que ficou de fora, sem otimismo.
```

---

## Fase 7 — material da apresentação

```
Varra o código atrás dos comentários "// trade-off:" e monte um documento em
docs/adr.md no formato ADR: contexto, decisão, alternativas consideradas e
rejeitadas, consequências positivas e negativas.

Depois me diga quais são as três perguntas mais difíceis que uma banca poderia fazer
sobre esta implementação, e qual é a resposta honesta para cada uma — incluindo os
casos em que a resposta honesta é "essa parte está simplificada".
```

---

## Comandos úteis durante a sessão

- `/clear` entre fases, sempre
- Plan mode antes de qualquer fase que mexa em mais de uma camada
- Se o Claude Code começar a inventar assinatura de API do Expo, mande ele ler o
  `node_modules/<lib>/build/*.d.ts` em vez de confiar na memória dele
