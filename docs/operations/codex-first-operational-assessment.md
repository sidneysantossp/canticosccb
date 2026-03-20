# Primeira Rodada Operacional dos Subagentes Codex

## Objetivo

Registrar a primeira leitura operacional real do projeto após a montagem da estrutura de subagentes.

Este relatório resume o estado das três frentes mais relevantes neste momento:

1. `cifras v2`
2. `admin/backoffice`
3. `experiência pública`

O foco aqui não é reexplicar a arquitetura. É dizer, com base no código atual, o que já está forte, o que ainda está frágil e qual deve ser a próxima execução.

## Leitura executiva

### O que já está forte

- a base estrutural do `cifras v2` está muito avançada
- a página pública da cifra já tem uma experiência de estudo madura
- o admin de rollout de cifras está bem mais operável do que no início
- a recuperação de chunk e a estabilidade de rotas melhoraram bastante
- o gate de cadastro após o primeiro hino já está implantado no player

### O que ainda está frágil

- o `cifras v2` ainda depende de operação real de backfill e publicação em lote
- o admin ainda carrega resíduos de uma linha de `premium` que já não faz parte do produto
- a experiência pública ainda tem rotas e superfícies de `premium/assinatura` que hoje só geram ruído
- o gate de cadastro é funcional, mas depende de `localStorage`, logo é fraco como mecanismo de controle e de medição

### Maior desalinhamento estratégico

Hoje o maior desalinhamento entre produto e código é:

- a decisão de negócio é `sem premium`
- mas ainda existe um conjunto relevante de páginas, filtros, campanhas, painéis e tipos de usuário relacionados a `premium`

Isso não é só dívida técnica. É ruído operacional e de produto.

## Frente 1. `cifras v2`

### O que já está forte

- publicação estruturada por seções, AST, índice de acordes e defaults editoriais em [cifraPublicationService.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/cifras-v2/cifraPublicationService.ts)
- leitura pública com seções, overrides e defaults de estudo em [publicCifrasApi.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/cifras-v2/publicCifrasApi.ts)
- editor admin forte, com seções, tempos, defaults, overrides e shapes em [AdminCifraV2Editor.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/AdminCifraV2Editor.tsx)
- página pública com metrônomo, estudo, loop, sync, shapes, canhoto e layout avançado em [CifraPage.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/CifraPage.tsx)
- painel de rollout, backfill e promoção para catálogo em [AdminCifras.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/AdminCifras.tsx)

### O que ainda está frágil

- o ganho do `v2` ainda depende da operação real do backfill e da publicação das versões, não mais da engenharia
- o módulo já parece pronto do ponto de vista técnico, mas ainda pode estar sub-representado no catálogo público se o rollout não for executado
- a experiência final ainda depende de massa crítica de seções, tempos e shapes bem preenchidos

### Risco principal

Risco de o projeto parecer “pronto em código” sem ainda estar “dominante em catálogo”.

### Próximo passo de maior impacto

1. operar o backfill no `/admin/cifras`
2. levar versões publicadas ao catálogo
3. fazer QA nas cifras `v2` reais, não só em casos isolados

## Frente 2. Admin & Backoffice

### O que já está forte

- o admin de cifras evoluiu para uma operação de rollout visível e acionável em [AdminCifras.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/AdminCifras.tsx)
- a fachada admin do `v2` está consistente em [cifrasV2AdminApi.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/admin/cifrasV2AdminApi.ts)
- o admin já ganhou leitura autenticada e status mais claros do rollout `v2`

### O que ainda está frágil

- a linha de `premium` ainda existe no backoffice em forma de operações e filtros que não refletem mais a direção do produto
- há resquícios operacionais em:
  - [premiumAdminApi.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/admin/premiumAdminApi.ts)
  - [AdminUsersPremium.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/AdminUsersPremium.tsx)
  - [AdminSettingsPremium.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/AdminSettingsPremium.tsx)
  - [AdminCampaignForm.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/AdminCampaignForm.tsx)
  - [AdminCampaigns.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/AdminCampaigns.tsx)
  - [AdminNotifications.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/notifications/AdminNotifications.tsx)
  - [AdminUsers.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/users/AdminUsers.tsx)

### Risco principal

Risco de o time operar estados, filtros e mensagens que não deveriam mais existir no produto.

### Próximo passo de maior impacto

Limpar a linha operacional de `premium` do admin e converter qualquer conceito remanescente para o modelo real de produto:

- cadastro
- usuário comum
- admin
- compositor

## Frente 3. Experiência pública

### O que já está forte

- o gate após o primeiro hino está ativo no player em [playerStore.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/stores/playerStore.ts) e [freePlayGateStore.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/stores/freePlayGateStore.ts)
- o modal de continuidade está claro e bem orientado para cadastro em [FreePlayGateModal.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/components/modals/FreePlayGateModal.tsx)
- a cifra pública virou um produto de estudo de verdade em [CifraPage.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/CifraPage.tsx)
- a recuperação automática de chunks está centralizada e consistente em [chunkLoadRecovery.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/utils/chunkLoadRecovery.ts)

### O que ainda está frágil

- o gate de cadastro é baseado em `localStorage` e contagem local por navegador em [freePlayGateStore.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/stores/freePlayGateStore.ts)
- a lógica do gate está duplicada no fluxo de `play`, `next` e `playNext` em [playerStore.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/stores/playerStore.ts), o que aumenta risco de divergência futura
- ainda existem superfícies públicas de `premium` que não pertencem mais à estratégia:
  - [SubscriptionPage.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/SubscriptionPage.tsx)
  - [PremiumPage.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/PremiumPage.tsx)
  - [AdsSidebar.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/components/layout/AdsSidebar.tsx)
- o header ainda importa busca a partir de [mockApis.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/mockApis.ts), apesar de a busca já ser real; o nome do módulo induz leitura errada do sistema

### Risco principal

Risco de UX limpa no consumo principal, mas com ruído residual de produto morto em páginas e componentes periféricos.

### Próximo passo de maior impacto

1. remover ou arquivar rotas e superfícies públicas de `premium`
2. consolidar o gate de cadastro em um fluxo menos espalhado no player
3. revisar a camada pública final depois do backfill real do `cifras v2`

## Conclusões por agente

### Cifras & Estudo Lead

Situação:

- muito forte em fundação
- precisa de operação real para virar valor percebido

### Admin & Backoffice Lead

Situação:

- forte para rollout `v2`
- ainda poluído por operações que não pertencem mais ao produto

### Public Experience Lead

Situação:

- forte na jornada principal
- ainda com ruído periférico e dívida de simplificação

## Prioridade recomendada da próxima execução

1. operar rollout real do `cifras v2`
2. remover a linha de `premium` do admin e do público
3. rodar QA final das cifras públicas já com catálogo `v2` real
4. consolidar a lógica do gate de cadastro no player

## Decisão operacional recomendada

A próxima rodada de subagentes deve abrir três workers:

1. `Cifras & Estudo Lead`
   - foco: rollout e catálogo real
2. `Admin & Backoffice Lead`
   - foco: limpeza operacional de `premium`
3. `Public Experience Lead`
   - foco: limpeza pública de `premium` e consolidação do gate de cadastro

## Relação com os demais documentos

- [codex-executive-dashboard.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-executive-dashboard.md)
- [codex-active-fronts-board.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-active-fronts-board.md)
- [codex-official-subagents-roster.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-official-subagents-roster.md)
- [codex-kickoff-templates.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-kickoff-templates.md)

