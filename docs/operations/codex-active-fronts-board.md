# Quadro Vivo de Frentes Ativas com Subagentes Codex

## Objetivo

Dar ao Orquestrador um quadro operacional simples para saber:

- quais frentes estão abertas
- quem é o dono de cada frente
- qual é o status
- o que está bloqueando
- quem precisa aprovar

Este documento é a versão operacional do ciclo atual.

## Como usar

### Regra 1

Toda frente ativa deve ter:

- um dono principal
- um objetivo claro
- um status atual
- um gate de aprovação
- um próximo passo explícito

### Regra 2

Nenhuma frente fica “no ar”.

Ela deve estar em um destes estados:

- `backlog`
- `pronta para iniciar`
- `em execução`
- `em validação`
- `bloqueada`
- `pronta para push`
- `concluída`

### Regra 3

O dono principal é único.

Agentes de apoio podem existir, mas não substituem a responsabilidade do dono.

## Quadro atual do projeto

### Frente 1. Rollout real de `cifras v2`

- Dono principal: `Cifras & Estudo Lead`
- Apoio: `Admin & Backoffice Lead`, `Editorial Musical Lead`, `Auditor de Dados`
- Status: `em execução`
- Objetivo: tornar o `cifras v2` o catálogo público dominante de cifras na plataforma
- Escopo:
  - migração do legado
  - publicação no catálogo
  - defaults de estudo
  - overrides editoriais
  - consistência de seções, tempos e shapes
- Aprovação obrigatória:
  - QA & Release
  - Auditor de Dados
  - Orquestrador
- Próximo passo:
  - operar o backfill no `/admin/cifras`
  - validar publicação real de versões `v2`

### Frente 2. Operação admin previsível

- Dono principal: `Admin & Backoffice Lead`
- Apoio: `Catálogo & Dados Lead`
- Status: `em execução`
- Objetivo: reduzir dependência de engenharia para rollout, edição e operação editorial
- Escopo:
  - clareza do estado no admin
  - botões de promoção para catálogo
  - rollout visibility
  - estabilidade de edição/importação
- Aprovação obrigatória:
  - QA & Release
  - Orquestrador
- Próximo passo:
  - validar operação ponta a ponta com itens reais

### Frente 3. Experiência pública de estudo

- Dono principal: `Public Experience Lead`
- Apoio: `Cifras & Estudo Lead`, `Growth & Activation Lead`
- Status: `em execução`
- Objetivo: deixar a cifra pública mais forte que alternativas genéricas no nicho CCB
- Escopo:
  - metrônomo
  - canhoto
  - duas colunas
  - modo estudo
  - sync com áudio
  - loop por seção
  - clareza de tom, afinação e versão
- Aprovação obrigatória:
  - QA & Release
  - Editorial Musical Lead
  - Orquestrador
- Próximo passo:
  - QA final em cifras `v2` reais publicadas

### Frente 4. Ativação por cadastro após o primeiro hino

- Dono principal: `Growth & Activation Lead`
- Apoio: `Public Experience Lead`
- Status: `em execução`
- Objetivo: maximizar cadastro sem criar fricção excessiva
- Escopo:
  - prompt de cadastro
  - mensagem de continuidade
  - clareza do motivo do bloqueio
  - consistência do player para visitante
- Aprovação obrigatória:
  - QA & Release
  - Orquestrador
- Próximo passo:
  - revisão textual e teste mobile/desktop do fluxo completo

### Frente 5. Integridade do catálogo e dos vínculos

- Dono principal: `Catálogo & Dados Lead`
- Apoio: `Admin & Backoffice Lead`
- Status: `em execução`
- Objetivo: manter coerência entre hinos, álbuns, categorias, playlists, cifras e páginas públicas
- Escopo:
  - deduplicação
  - slugs
  - vínculos entre tabelas
  - filtros corretos em home e categorias
  - compatibilidade de imports
- Aprovação obrigatória:
  - Auditor de Dados
  - Orquestrador
- Próximo passo:
  - rodada de auditoria pós-backfill do `cifras v2`

### Frente 6. Estabilidade de runtime, auth e deploy

- Dono principal: `Plataforma & Infra Lead`
- Apoio: `Public Experience Lead`
- Status: `monitoramento`
- Objetivo: evitar regressões de chunk, auth, build e leitura de schema em produção
- Escopo:
  - stale chunk recovery
  - auth consistente
  - compatibilidade com schema real do Supabase
  - estabilidade do deploy na Vercel
- Aprovação obrigatória:
  - QA & Release
  - Orquestrador
- Próximo passo:
  - manter hotfix rápido para qualquer regressão de runtime

### Frente 7. Descoberta orgânica sustentada

- Dono principal: `SEO & Discoverability Lead`
- Apoio: `Public Experience Lead`
- Status: `monitoramento`
- Objetivo: sustentar avanço orgânico sem abrir regressão de render, canonical ou sitemap
- Escopo:
  - SSR
  - sitemap
  - schema
  - hubs
  - render para bot
- Aprovação obrigatória:
  - Auditor SEO
  - Orquestrador
- Próximo passo:
  - revisar impacto do rollout `v2` nas páginas indexáveis de cifras

## Prioridade oficial de execução

1. Rollout real de `cifras v2`
2. Operação admin previsível
3. Experiência pública de estudo
4. Ativação por cadastro após o primeiro hino
5. Integridade do catálogo e dos vínculos
6. Estabilidade de runtime, auth e deploy
7. Descoberta orgânica sustentada

## Limites de WIP por agente

### Comando

- Orquestrador: no máximo `3` frentes em paralelo com dependência crítica

### Pods

- cada lead: no máximo `2` entregas em execução ao mesmo tempo
- qualquer terceira entrega deve ficar em `pronta para iniciar`

### QA

- no máximo `3` validações pesadas em paralelo

## Reunião curta diária

Cada agente responde apenas:

1. o que concluiu
2. o que está executando
3. o que está bloqueando
4. o que precisa de aprovação

## Checklist de mudança de estado

### Para sair de `pronta para iniciar` para `em execução`

- dono definido
- write set definido
- aceite definido

### Para sair de `em execução` para `em validação`

- implementação concluída
- validação local mínima feita
- resumo da mudança pronto

### Para sair de `em validação` para `pronta para push`

- QA aprovado
- auditoria aprovada quando necessária
- risco residual conhecido

### Para sair de `pronta para push` para `concluída`

- push realizado
- deploy aceito
- frente atualizada no quadro

## Relação com os demais documentos

- [codex-official-subagents-roster.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-official-subagents-roster.md)
- [codex-current-cycle-plan.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-current-cycle-plan.md)
- [codex-subagents-playbook.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-subagents-playbook.md)

