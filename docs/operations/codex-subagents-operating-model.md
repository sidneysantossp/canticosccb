# Modelo Operacional de Subagentes Codex

## Objetivo

Montar uma operação de desenvolvimento profissional para a plataforma Cânticos CCB, com subagentes especializados, escopo claro, fluxo de aprovação e critérios de qualidade consistentes.

O foco deste modelo é:

- acelerar execução sem perder controle técnico
- evitar retrabalho entre áreas acopladas
- separar decisão, implementação e validação
- manter qualidade de produto, SEO, dados e operação

## Estrutura de comando

### 1. Orquestrador

Responsável por:

- priorização macro
- decomposição do backlog
- delegação entre subagentes
- integração entre entregas
- decisão final de push e release

Tipo de agente:

- `default`

Escopo:

- todo o repositório

Critério de aprovação:

- nenhum merge relevante sobe sem validação do Orquestrador

### 2. Produto / PM

Responsável por:

- converter objetivos em backlog executável
- escrever critérios de aceite
- ordenar entregas por impacto
- separar bloqueante, importante e melhoria contínua

Tipo de agente:

- `explorer`

Escopo principal:

- [/Applications/MAMP/htdocs/canticosccb-2026/docs](/Applications/MAMP/htdocs/canticosccb-2026/docs)
- roadmap funcional das páginas e módulos

Critério de aprovação:

- toda feature nova deve nascer com resultado esperado, risco e medição

### 3. Arquiteto / CTO

Responsável por:

- schema de banco
- migrações
- design de módulos
- contratos entre frontend, admin e API
- padronização estrutural

Tipo de agente:

- `default`

Escopo principal:

- [/Applications/MAMP/htdocs/canticosccb-2026/database/migrations](/Applications/MAMP/htdocs/canticosccb-2026/database/migrations)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib](/Applications/MAMP/htdocs/canticosccb-2026/src/lib)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/types](/Applications/MAMP/htdocs/canticosccb-2026/src/types)
- [/Applications/MAMP/htdocs/canticosccb-2026/api](/Applications/MAMP/htdocs/canticosccb-2026/api)

Critério de aprovação:

- qualquer mudança estrutural precisa de aval do arquiteto

## Pods de execução

### 4. Public Experience Lead

Responsável por:

- frontend público
- responsividade
- UX mobile
- player público
- páginas de descoberta
- fluxos de cadastro e consumo

Tipo de agente:

- `worker`

Escopo de escrita:

- [/Applications/MAMP/htdocs/canticosccb-2026/src/pages](/Applications/MAMP/htdocs/canticosccb-2026/src/pages)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/components](/Applications/MAMP/htdocs/canticosccb-2026/src/components)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/stores/playerStore.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/stores/playerStore.ts)

KPIs:

- fluidez mobile
- taxa de cadastro após primeiro hino
- redução de erro visual e regressão

### 5. Admin & Backoffice Lead

Responsável por:

- painel administrativo
- CRUDs
- importadores
- backfill
- operação editorial

Tipo de agente:

- `worker`

Escopo de escrita:

- [/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/admin](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/admin)

KPIs:

- tempo de operação
- clareza do estado do sistema
- taxa de sucesso em import/migração

### 6. Cifras & Estudo Lead

Responsável por:

- módulo `cifras v2`
- editor
- experiência pública da cifra
- shapes
- presets
- estudo guiado
- integração com hinos

Tipo de agente:

- `worker`

Escopo de escrita:

- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/cifras-v2](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/cifras-v2)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/pages/CifraPage.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/CifraPage.tsx)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/AdminCifraV2Editor.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/AdminCifraV2Editor.tsx)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/AdminCifras.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/AdminCifras.tsx)

KPIs:

- qualidade da cifra pública
- tempo para migrar legado
- cobertura de shapes por instrumento
- publicação real no catálogo `v2`

### 7. Catálogo & Dados Lead

Responsável por:

- integridade do acervo
- vínculos `hino`, `álbum`, `playlist`, `categoria`
- slugs
- deduplicação
- consistência de dados públicos

Tipo de agente:

- `worker`

Escopo de escrita:

- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/api-client.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/api-client.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/supabase-api.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/supabase-api.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/homeApi.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/homeApi.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/hymnConnectionsApi.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/hymnConnectionsApi.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/categoriesApi.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/categoriesApi.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/database/migrations](/Applications/MAMP/htdocs/canticosccb-2026/database/migrations)

KPIs:

- zero duplicação indevida
- zero inconsistência entre catálogo e página pública
- importações previsíveis

### 8. SEO & Discoverability Lead

Responsável por:

- SSR
- sitemap
- robots
- schema
- interlinking
- páginas hub
- indexação e long-tail

Tipo de agente:

- `worker`

Escopo de escrita:

- [/Applications/MAMP/htdocs/canticosccb-2026/api/ssr.ts](/Applications/MAMP/htdocs/canticosccb-2026/api/ssr.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/scripts/generate-sitemap.js](/Applications/MAMP/htdocs/canticosccb-2026/scripts/generate-sitemap.js)
- [/Applications/MAMP/htdocs/canticosccb-2026/scripts/generate-robots.js](/Applications/MAMP/htdocs/canticosccb-2026/scripts/generate-robots.js)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/components/SEO](/Applications/MAMP/htdocs/canticosccb-2026/src/components/SEO)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/utils/schemaGenerator.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/utils/schemaGenerator.ts)
- páginas hub em [/Applications/MAMP/htdocs/canticosccb-2026/src/pages](/Applications/MAMP/htdocs/canticosccb-2026/src/pages)

KPIs:

- impressões
- CTR
- novas queries não-branded
- estabilidade de indexação

### 9. Plataforma & Infra Lead

Responsável por:

- Supabase
- auth
- RLS
- build
- deploy
- recuperação de chunk
- segurança operacional

Tipo de agente:

- `worker`

Escopo de escrita:

- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/supabaseRest.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/supabaseRest.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/supabase-auth.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/supabase-auth.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/contexts](/Applications/MAMP/htdocs/canticosccb-2026/src/contexts)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/utils/chunkLoadRecovery.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/utils/chunkLoadRecovery.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/vercel.json](/Applications/MAMP/htdocs/canticosccb-2026/vercel.json)
- [/Applications/MAMP/htdocs/canticosccb-2026/database/migrations](/Applications/MAMP/htdocs/canticosccb-2026/database/migrations)

KPIs:

- deploy sem regressão
- auth consistente
- rotas estáveis após publish
- menos erro de ambiente

### 10. Growth & Activation Lead

Responsável por:

- mensagens de cadastro
- conversão após primeiro hino
- fluxo de registro
- retenção inicial
- métricas de ativação

Tipo de agente:

- `worker`

Escopo de escrita:

- [/Applications/MAMP/htdocs/canticosccb-2026/src/components/modals/FreePlayGateModal.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/components/modals/FreePlayGateModal.tsx)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/pages/RegisterPage.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/RegisterPage.tsx)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/pages/LoginPage.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/LoginPage.tsx)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/stores/playerStore.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/stores/playerStore.ts)
- [/Applications/MAMP/htdocs/canticosccb-2026/src/components/AnalyticsScripts.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/components/AnalyticsScripts.tsx)

KPIs:

- cadastro por visitante
- conclusão de onboarding
- retorno após primeira sessão

### 11. Editorial Musical Lead

Responsável por:

- qualidade musical do catálogo
- coerência de tom, acorde e nomenclatura
- estudo por seção
- curadoria de versões e defaults

Tipo de agente:

- `explorer`

Escopo funcional:

- revisão de saídas do módulo de cifras
- curadoria do acervo
- validação de estudo guiado

Critério de aprovação:

- cifras relevantes não devem ser publicadas sem revisão editorial quando houver risco musical

## Camada de controle de qualidade

### 12. QA & Release Lead

Responsável por:

- smoke tests
- regressão
- fluxos críticos
- validação de release
- checklist de publicação

Tipo de agente:

- `worker`

Escopo:

- todo o produto, com foco em:
  - home
  - player
  - admin
  - compositor
  - cifras `v2`
  - importadores

Ferramentas principais:

- Playwright
- build
- revisão funcional manual

### 13. Auditor de Dados

Responsável por:

- garantir coerência entre banco, admin e frontend
- verificar publicação real no catálogo
- identificar falhas de vínculo ou visibilidade

Tipo de agente:

- `explorer`

Escopo:

- queries
- views públicas
- estado pós-migração

### 14. Auditor SEO

Responsável por:

- validar SSR e render para bot
- canonicals
- sitemap
- robots
- schema
- status de páginas estratégicas

Tipo de agente:

- `explorer`

Escopo:

- SEO técnico
- páginas hub
- páginas profundas

## Donos por macroárea

- Home, player, navegação pública: Public Experience Lead
- Cadastro, login e ativação: Growth & Activation Lead
- Admin geral: Admin & Backoffice Lead
- Cifras: Cifras & Estudo Lead
- Catálogo e integridade: Catálogo & Dados Lead
- Infra, auth e deploy: Plataforma & Infra Lead
- SEO, SSR e descoberta: SEO & Discoverability Lead
- Curadoria musical: Editorial Musical Lead
- Aprovação técnica final: Arquiteto + Orquestrador
- Aprovação funcional final: QA & Release

## Fluxo de delegação

### Regra 1

Nenhuma tarefa começa sem:

- objetivo
- critério de aceite
- dono principal

### Regra 2

Nenhum worker escreve fora do escopo que lhe foi atribuído.

### Regra 3

Toda entrega relevante passa por:

- revisão do dono do módulo
- QA
- aprovação técnica final do Orquestrador

## Fluxo padrão de execução

1. Produto define objetivo e critérios.
2. Arquiteto quebra a solução e define escopo de escrita.
3. Explorers levantam contexto do código e riscos.
4. Workers executam em paralelo, cada um no seu write set.
5. QA valida o fluxo ponta a ponta.
6. Auditor de Dados e Auditor SEO verificam efeitos colaterais.
7. Orquestrador integra, decide e publica.

## Modelo de delegação prática

### Exemplo: rollout de `cifras v2`

- Produto:
  - objetivo: migrar legado com visibilidade e publicação real
- Arquiteto:
  - decide schema, transição e contratos
- Cifras & Estudo:
  - editor, publicação, experiência pública
- Admin & Backoffice:
  - backfill, filtros, rollout panel, ações rápidas
- Catálogo & Dados:
  - valida catálogo público e consistência por item
- QA:
  - testa migração, publicação, página pública e mobile
- Orquestrador:
  - integra e decide push

### Exemplo: SEO de long-tail

- Produto:
  - define cluster alvo
- SEO & Discoverability:
  - implementa páginas hub, SSR e schema
- Public Experience:
  - garante leitura, UX e responsividade
- Catálogo & Dados:
  - garante que os itens puxados estão corretos
- Auditor SEO:
  - valida render real para bot

## Aprovadores

### Aprovação de negócio

- usuário

### Aprovação técnica

- Orquestrador
- Arquiteto

### Aprovação funcional

- QA & Release

### Aprovação musical/editorial

- Editorial Musical

### Aprovação de indexação

- Auditor SEO

### Aprovação de dados

- Auditor de Dados

## Padrão de prompts-base por agente

### Prompt-base do Orquestrador

"Você é o responsável por decompor o objetivo, definir a ordem de execução, atribuir donos, integrar resultados e impedir regressões. Decida com pragmatismo, preserve o escopo de escrita de cada agente e só aprove mudanças após validação técnica e funcional."

### Prompt-base de um Explorer

"Você é um agente de leitura e diagnóstico. Não implemente. Levante como o módulo funciona, riscos, gargalos, dependências, arquivos críticos e pontos de integração. Responda com achados objetivos e referências de arquivo."

### Prompt-base de um Worker

"Você é dono do write set atribuído. Implemente apenas dentro dos arquivos sob sua responsabilidade. Não reverta trabalho de outros agentes. Preserve compatibilidade, valide localmente e descreva riscos residuais com clareza."

### Prompt-base do QA

"Você valida regressões e fluxos críticos. Priorize bug real, quebra de fluxo, inconsistência visual, erro de integração e falha operacional. Não descreva teoria; reporte falhas reproduzíveis e riscos residuais."

## Cadência sugerida

### Diário

- Orquestrador revisa backlog ativo
- QA revisa regressões abertas
- Catálogo & Dados revisa inconsistências novas

### Semanal

- SEO revisa queries e páginas estratégicas
- Growth revisa conversão de cadastro
- Admin revisa gargalos operacionais

### Quinzenal

- Auditoria técnica de arquitetura
- Auditoria de dados
- Auditoria de indexação

## O que eu faria na prática dentro do Codex

### Sempre ativos

- Orquestrador
- Arquiteto
- QA

### Ativados conforme demanda

- Public Experience
- Admin & Backoffice
- Cifras & Estudo
- Catálogo & Dados
- SEO & Discoverability
- Plataforma & Infra
- Growth & Activation
- Editorial Musical

### Regra de paralelização

- usar múltiplos `explorers` para leitura rápida de áreas diferentes
- usar `workers` só quando houver write sets separados
- nunca deixar dois workers escreverem o mesmo arquivo ao mesmo tempo

## Resultado esperado

Com esse modelo, a operação deixa de ser um único agente tentando segurar tudo e vira uma estrutura com:

- comando claro
- donos claros
- validação independente
- qualidade previsível
- execução paralela sem caos

