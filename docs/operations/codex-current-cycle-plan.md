# Plano Operacional do Ciclo Atual com Subagentes Codex

## Objetivo do ciclo atual

Executar a próxima fase da plataforma com foco em:

- consolidar o rollout de `cifras v2`
- aumentar a qualidade operacional do admin
- estabilizar frontend e backoffice
- manter avanço técnico de SEO e descoberta
- melhorar ativação por cadastro após o primeiro hino

Este plano transforma o modelo organizacional em operação prática.

## Meta do ciclo

Ao final deste ciclo, a plataforma deve sair de um estado de fundação robusta para um estado de operação previsível, com:

- catálogo `cifras v2` visível e migrado progressivamente
- admin capaz de operar rollout sem depender de engenharia para tudo
- experiência pública mais estável e mais forte que alternativas genéricas no nicho CCB
- funil de cadastro claro para visitante que terminou o primeiro hino
- backlog técnico dividido por dono, com gates de aprovação explícitos

## Subagentes ativos neste ciclo

### Núcleo de comando

#### A1. Orquestrador

Responsabilidade:

- controlar prioridades
- abrir e fechar frentes
- arbitrar dependências
- aprovar merge final

Escopo:

- repositório inteiro

Status no ciclo:

- sempre ativo

#### A2. Produto / PM

Responsabilidade:

- transformar objetivo em backlog
- escrever critérios de aceite
- separar fases do ciclo

Escopo:

- documentação
- backlog
- definição de entregáveis

Status no ciclo:

- ativo no início e na revisão semanal

#### A3. Arquiteto / CTO

Responsabilidade:

- decidir mudanças estruturais
- aprovar contratos e migrações
- vetar atalhos ruins

Escopo:

- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib](/Applications/MAMP/htdocs/canticosccb-2026/src/lib)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/types](/Applications/MAMP/htdocs/canticosccb-2026/src/types)
- [/Applications/MAMP/htdocs/canticosccb-2026/database/migrations](/Applications/MAMP/htdocs/canticosccb-2026/database/migrations)
- [/Applications/MAMP/htdocs/canticosccb-2026/api](/Applications/MAMP/htdocs/canticosccb-2026/api)

Status no ciclo:

- ativo em toda entrega estrutural

### Pods de execução ativos

#### A4. Cifras & Estudo Lead

Missão deste ciclo:

- levar o `cifras v2` para produção real
- garantir migração prática do legado
- melhorar o estudo guiado
- aproximar experiência pública da cifra do patamar de referência do mercado

Write set:

- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/cifras-v2](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/cifras-v2)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/pages/CifraPage.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/CifraPage.tsx)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/AdminCifraV2Editor.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/AdminCifraV2Editor.tsx)

#### A5. Admin & Backoffice Lead

Missão deste ciclo:

- tornar o rollout operável pelo time
- reduzir opacidade no admin
- melhorar fluxos de backfill, importação e edição

Write set:

- [/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/admin](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/admin)

#### A6. Public Experience Lead

Missão deste ciclo:

- revisar a experiência pública em mobile e desktop
- garantir que novas features não deteriorem o consumo
- melhorar leitura, clareza e comportamento do player/cadastro

Write set:

- [/Applications/MAMP/htdocs/canticosccb-2026/src/pages](/Applications/MAMP/htdocs/canticosccb-2026/src/pages)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/components](/Applications/MAMP/htdocs/canticosccb-2026/src/components)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/stores/playerStore.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/stores/playerStore.ts)

#### A7. Catálogo & Dados Lead

Missão deste ciclo:

- garantir que o acervo ligado ao `v2` esteja consistente
- revisar vínculos entre hino, álbum, categoria, playlist e cifra
- detectar inconsistências pós-import e pós-migração

Write set:

- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/api-client.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/api-client.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/homeApi.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/homeApi.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/hymnConnectionsApi.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/hymnConnectionsApi.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/database/migrations](/Applications/MAMP/htdocs/canticosccb-2026/database/migrations)

#### A8. Plataforma & Infra Lead

Missão deste ciclo:

- evitar regressão de build/deploy
- garantir estabilidade de auth, lazy loading e rotas
- manter compatibilidade entre banco, frontend e deploy

Write set:

- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/supabaseRest.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/supabaseRest.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/supabase-auth.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/supabase-auth.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/utils/chunkLoadRecovery.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/utils/chunkLoadRecovery.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/vercel.json](/Applications/MAMP/htdocs/canticosccb-2026/vercel.json)

#### A9. SEO & Discoverability Lead

Missão deste ciclo:

- sustentar o ganho de descoberta orgânica
- revisar impacto do rollout de páginas no render e índice
- manter hubs, SSR e sitemap coerentes com a base real

Write set:

- [/Applications/MAMP/htdocs/canticosccb-2026/api/ssr.ts](/Applications/MAMP/htdocs/canticosccb-2026/api/ssr.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/scripts/generate-sitemap.js](/Applications/MAMP/htdocs/canticosccb-2026/scripts/generate-sitemap.js)
- [/Applications/MAMP/htdocs/canticosccb-2026/scripts/generate-robots.js](/Applications/MAMP/htdocs/canticosccb-2026/scripts/generate-robots.js)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/utils/schemaGenerator.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/utils/schemaGenerator.ts)

#### A10. Growth & Activation Lead

Missão deste ciclo:

- otimizar a mensagem de cadastro após o primeiro hino
- remover ruído legado de premium
- melhorar a ativação real de usuário novo

Write set:

- [/Applications/MAMP/htdocs/canticosccb-2026/src/components/modals/FreePlayGateModal.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/components/modals/FreePlayGateModal.tsx)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/pages/RegisterPage.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/RegisterPage.tsx)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/pages/LoginPage.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/LoginPage.tsx)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/stores/playerStore.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/stores/playerStore.ts)

### Controle de qualidade

#### A11. QA & Release Lead

Missão deste ciclo:

- validar fluxo público
- validar admin
- validar `cifras v2`
- revisar regressões pós-deploy

#### A12. Auditor de Dados

Missão deste ciclo:

- verificar o que foi migrado
- conferir catálogo público
- conferir consistência por item

#### A13. Auditor SEO

Missão deste ciclo:

- validar render para bot
- validar impacto de páginas novas
- revisar sitemap e canonicals

## Roadmap operacional por sprint

## Sprint 1. Rollout real do Cifras V2

Objetivo:

- migrar legado para `v2`
- tornar a operação visível e auditável
- fazer a experiência nova aparecer no frontend

Agentes principais:

- A4 Cifras & Estudo
- A5 Admin & Backoffice
- A7 Catálogo & Dados
- A11 QA & Release

Entregas:

- painel de rollout por item
- lote controlado de backfill
- ação rápida `Levar ao catálogo`
- status por versão: publicado, busca, estudo, catálogo
- revisão funcional do editor e da página pública

Critério de aceite:

- o admin consegue ver o estado de cada cifra
- o time consegue migrar em lotes pequenos
- versões publicadas entram no catálogo sem depender de intervenção manual no banco

Aprovação:

- técnica: Orquestrador + Arquiteto
- funcional: QA
- dados: Auditor de Dados

## Sprint 2. Hardening da experiência pública

Objetivo:

- revisar tudo o que o usuário final enxerga
- remover fricção e regressão visual
- consolidar estudo guiado e player

Agentes principais:

- A4 Cifras & Estudo
- A6 Public Experience
- A10 Growth & Activation
- A11 QA & Release

Entregas:

- revisão mobile do fluxo de cifra
- validação do player dentro da cifra
- revisão do modal de cadastro pós-primeiro hino
- revisão dos modos de estudo
- correção de estados quebrados ou silenciosos

Critério de aceite:

- nenhum fluxo crítico quebra em mobile
- visitante entende o bloqueio pós-primeiro hino
- cifra pública abre, estuda e reproduz sem cair em erro

Aprovação:

- funcional: QA
- negócio/UX: Orquestrador

## Sprint 3. Catálogo, importação e integridade

Objetivo:

- impedir sujeira operacional no acervo
- melhorar previsibilidade de importação
- revisar vínculos e filtros

Agentes principais:

- A5 Admin & Backoffice
- A7 Catálogo & Dados
- A8 Plataforma & Infra
- A11 QA & Release

Entregas:

- revisão de importadores
- revisão de deduplicação por slug
- revisão de vínculos `album_hinos`, `categorias`, `playlists`
- revisão de CRUDs admin ainda sensíveis

Critério de aceite:

- importações não quebram por duplicidade comum
- páginas públicas batem com o catálogo real
- filtros do frontend refletem o banco corretamente

Aprovação:

- técnica: Arquiteto
- dados: Auditor de Dados

## Sprint 4. SEO e descoberta sustentada

Objetivo:

- garantir que a plataforma continue expandindo cobertura orgânica
- alinhar catálogo real e páginas indexáveis

Agentes principais:

- A9 SEO & Discoverability
- A6 Public Experience
- A7 Catálogo & Dados
- A13 Auditor SEO

Entregas:

- revisão de SSR em páginas críticas
- revisão de sitemap e rotas públicas reais
- ajuste de schema em páginas profundas
- revisão dos hubs de descoberta mais importantes

Critério de aceite:

- páginas estratégicas renderizam corretamente para bot
- sitemap não inclui lixo nem deixa de fora páginas críticas
- páginas novas ajudam descoberta em vez de gerar ruído

Aprovação:

- SEO: Auditor SEO
- técnica: Orquestrador

## Sprint 5. Operação recorrente

Objetivo:

- transformar a execução em rotina
- reduzir dependência de intervenção manual do Orquestrador

Agentes principais:

- todos os leads

Entregas:

- checklist operacional semanal
- sequência padrão de deploy
- sequência padrão de QA
- padrão de handoff entre agentes

Critério de aceite:

- qualquer lote novo pode seguir o fluxo padrão
- existe clareza de dono, aprovador e risco residual

## Delegação prática por tipo de tarefa

### Tipo A. Mudança estrutural

Exemplo:

- nova migration
- novo read model
- nova view pública

Fluxo:

1. Produto define objetivo.
2. Arquiteto define solução.
3. Worker dono implementa.
4. Auditor de Dados revisa efeito.
5. QA testa.
6. Orquestrador aprova push.

### Tipo B. Mudança pública de UX

Exemplo:

- modal de cadastro
- player
- página pública da cifra

Fluxo:

1. Produto define critério de uso.
2. Public Experience ou Cifras implementa.
3. Growth revisa impacto de conversão se houver.
4. QA valida desktop/mobile.
5. Orquestrador publica.

### Tipo C. Mudança operacional de admin

Exemplo:

- novo painel
- backfill
- importador

Fluxo:

1. Admin & Backoffice lidera.
2. Catálogo & Dados revisa coerência.
3. QA testa fluxo completo.
4. Orquestrador aprova.

### Tipo D. Mudança de indexação/SEO

Exemplo:

- hub novo
- SSR novo
- schema novo

Fluxo:

1. SEO propõe.
2. Arquiteto revisa risco técnico.
3. Worker implementa.
4. Auditor SEO valida render.
5. Orquestrador aprova.

## RACI resumido

### Cifras V2

- Responsible: A4
- Accountable: Orquestrador
- Consulted: A3, A5, A7, A11
- Informed: A9

### Admin / operação

- Responsible: A5
- Accountable: Orquestrador
- Consulted: A7, A8, A11
- Informed: A2

### Catálogo e dados

- Responsible: A7
- Accountable: Arquiteto
- Consulted: A5, A4, A11
- Informed: A9

### SEO

- Responsible: A9
- Accountable: Orquestrador
- Consulted: A3, A7, A13
- Informed: A2

### Ativação e cadastro

- Responsible: A10
- Accountable: Orquestrador
- Consulted: A6, A11
- Informed: A2

## Aprovações obrigatórias por entrega

### Entrega pequena

- validação do dono do módulo
- build
- aprovação do Orquestrador

### Entrega média

- dono do módulo
- QA
- aprovação do Orquestrador

### Entrega estrutural

- dono do módulo
- Arquiteto
- QA
- Auditor específico do tema
- Orquestrador

## Prompt-base operacional por agente neste ciclo

### A4. Cifras & Estudo

"Você é responsável por elevar o `cifras v2` até operação plena. Priorize publicação real, editor confiável, estudo guiado e experiência pública superior para o nicho CCB. Não escreva fora do módulo de cifras sem necessidade explícita."

### A5. Admin & Backoffice

"Você é responsável por tornar a operação do sistema clara e previsível. Priorize clareza de estado, ações rápidas, painéis úteis, migração segura e redução de dependência manual de engenharia."

### A6. Public Experience

"Você é responsável pelo que o usuário final vê e sente. Priorize responsividade, clareza, estabilidade, fluxo de consumo e cadastro sem atrito desnecessário."

### A7. Catálogo & Dados

"Você é responsável pela verdade do acervo. Priorize consistência entre banco, admin e frontend, elimine duplicidade indevida e preserve slugs, vínculos e leitura pública."

### A8. Plataforma & Infra

"Você é responsável por build, deploy, auth e estabilidade. Priorize confiabilidade, compatibilidade de schema, recuperação de erro de chunk e segurança operacional."

### A9. SEO & Discoverability

"Você é responsável por tornar o conteúdo descobrível e indexável. Priorize SSR correto, sitemap íntegro, schema útil e páginas com intenção de busca real."

### A10. Growth & Activation

"Você é responsável por transformar consumo em cadastro. Priorize o momento pós-primeiro hino, clareza de mensagem, continuidade de fluxo e medição do efeito na ativação."

### A11. QA & Release

"Você é responsável por vetar regressões. Priorize bug real, quebra de fluxo, divergência entre admin e frontend, erro mobile e falha pós-deploy."

## Agenda operacional semanal

### Segunda

- Orquestrador revisa backlog
- Produto redefine foco da semana
- Arquiteto valida mudanças estruturais abertas

### Terça a quinta

- workers executam
- QA faz smoke diário nas áreas mexidas
- Auditor de Dados revisa inconsistências novas

### Sexta

- Auditor SEO revisa páginas críticas
- Orquestrador fecha lote
- publicação do resumo da semana

## O que eu faria imediatamente neste projeto

1. manter A4, A5, A7 e A11 como frente principal até o catálogo `v2` estar realmente povoado
2. em paralelo, manter A6 e A10 revisando a experiência pública e o cadastro após primeiro hino
3. manter A9 em modo de sustentação para evitar regressão SEO durante o rollout operacional
4. usar A8 sempre que o ciclo tocar deploy, auth, lazy chunk ou compatibilidade de banco

## Resultado esperado do ciclo

Ao executar esse plano, a operação passa a ter:

- liderança clara
- trilha de rollout controlada
- menos decisão informal
- menos dependência de memória do time
- uma base real para operar por subagentes no Codex de forma profissional

