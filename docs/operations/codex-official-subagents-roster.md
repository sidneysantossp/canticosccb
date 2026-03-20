# Quadro Oficial de Subagentes Codex

## Objetivo

Transformar o modelo operacional de subagentes da plataforma Cânticos CCB em uma estrutura oficial, recorrente e executável no dia a dia.

Este documento responde:

1. quais são os subagentes oficiais do projeto
2. quais ficam permanentes e quais entram sob demanda
3. quem lidera cada tipo de entrega
4. quem aprova qualidade, publicação e rollout
5. em que ordem os agentes devem ser acionados

Este é o quadro oficial da operação.

## Estrutura executiva

### Agentes permanentes

Esses agentes compõem a mesa central de operação do projeto. Eles não são opcionais.

| Agente | Função | Tipo | Modelo sugerido | Responsabilidade central |
| --- | --- | --- | --- | --- |
| Orquestrador / CEO | comando geral | `default` | `gpt-5.2` high | priorização, delegação, integração e decisão final |
| Produto / PM | backlog e aceite | `explorer` | `gpt-5.4-mini` medium | transformar objetivo em backlog executável |
| Arquiteto / CTO | estrutura | `default` | `gpt-5.4` high | schema, contratos, migrações e compatibilidade |
| QA & Release Lead | validação final | `worker` | `gpt-5.3-codex` medium | regressão, smoke, release gate |

### Agentes de pod

Esses agentes são os donos dos módulos do produto.

| Agente | Pod | Tipo | Modelo sugerido | Write set principal |
| --- | --- | --- | --- | --- |
| Public Experience Lead | experiência pública | `worker` | `gpt-5.3-codex` medium | `/src/pages`, `/src/components`, `/src/stores/playerStore.ts` |
| Admin & Backoffice Lead | operação interna | `worker` | `gpt-5.3-codex` medium | `/src/pages/admin`, `/src/lib/admin` |
| Cifras & Estudo Lead | módulo de cifras | `worker` | `gpt-5.3-codex` high | `/src/lib/cifras-v2`, `/src/pages/CifraPage.tsx`, `/src/pages/admin/AdminCifraV2Editor.tsx` |
| Catálogo & Dados Lead | acervo e integridade | `worker` | `gpt-5.2-codex` high | `/src/lib`, `/database/migrations`, fluxos de importação e vínculos |
| SEO & Discoverability Lead | descoberta orgânica | `worker` | `gpt-5.2-codex` medium | `/api/ssr.ts`, `scripts/`, hubs, schema e páginas indexáveis |
| Plataforma & Infra Lead | deploy e runtime | `worker` | `gpt-5.3-codex` medium | auth, build, deploy, Supabase, Vercel, recovery e observabilidade |
| Growth & Activation Lead | cadastro e retenção | `worker` | `gpt-5.2-codex` medium | prompts de registro, funis, modais, ativação e análise |
| Editorial Musical Lead | qualidade musical | `explorer` | `gpt-5.4-mini` medium | coerência musical, tom, nomenclatura, seções e defaults |

### Agentes de auditoria

Esses agentes entram como camada de veto ou validação especializada.

| Agente | Tipo | Modelo sugerido | Aprovações |
| --- | --- | --- | --- |
| Auditor de Dados | `explorer` | `gpt-5.4-mini` medium | consistência do catálogo, vínculos, duplicidade, slug, publicação |
| Auditor SEO | `explorer` | `gpt-5.4-mini` medium | indexabilidade, canonical, sitemap, schema, render para bot |

## Regra oficial de ativação

### Ordem base

1. Orquestrador recebe a demanda
2. Produto / PM transforma em backlog curto e critérios de aceite
3. Arquiteto entra se houver impacto estrutural, banco, contrato ou rollout controlado
4. Lead do pod executa a frente principal
5. Agentes de apoio entram apenas se houver dependência real
6. QA & Release valida a integração final
7. Auditor especializado entra quando o risco exigir
8. Orquestrador aprova o push final

### Quando o Arquiteto é obrigatório

- alteração de schema
- migration
- mudanças em auth, RLS, SSR, catálogo ou publicação
- alterações em contratos entre admin e frontend público
- mudanças que afetem rollout ou compatibilidade

### Quando o QA é obrigatório

- qualquer bug crítico
- qualquer fluxo público com impacto em cadastro, player ou cifra
- qualquer fluxo admin que publique, importe ou edite catálogo
- qualquer mudança em deploy, lazy chunk, auth ou build

## Matriz oficial por cenário

| Cenário | Dono principal | Apoio | Aprovação obrigatória |
| --- | --- | --- | --- |
| Bug crítico no frontend público | Public Experience Lead | Plataforma & Infra Lead | QA + Orquestrador |
| Bug crítico no admin | Admin & Backoffice Lead | Catálogo & Dados Lead | QA + Orquestrador |
| Mudança estrutural no `cifras v2` | Cifras & Estudo Lead | Arquiteto + Editorial Musical | QA + Orquestrador |
| Backfill, importação ou deduplicação | Catálogo & Dados Lead | Admin & Backoffice Lead | Auditor de Dados + Orquestrador |
| Expansão SEO | SEO & Discoverability Lead | Public Experience Lead | Auditor SEO + Orquestrador |
| Ajuste de cadastro/ativação | Growth & Activation Lead | Public Experience Lead | QA + Orquestrador |
| Problema de deploy, chunk ou auth | Plataforma & Infra Lead | Public Experience Lead | QA + Orquestrador |
| Página pública nova | Public Experience Lead | SEO & Discoverability Lead | QA + Orquestrador |
| CRUD/admin novo | Admin & Backoffice Lead | Arquiteto quando houver schema | QA + Orquestrador |

## Cadeia de aprovação

### Aprovação de produto

- responsável final: você
- suporte: Produto / PM

### Aprovação técnica

- responsável final: Orquestrador
- validação estrutural: Arquiteto

### Aprovação funcional

- responsável final: QA & Release Lead

### Aprovação musical/editorial

- responsável final: Editorial Musical Lead

### Aprovação de dados

- responsável final: Auditor de Dados

### Aprovação de descoberta e indexação

- responsável final: Auditor SEO

## Rituais oficiais da operação

### Ritual diário

1. Orquestrador revisa backlog ativo
2. Produto destaca bloqueantes, importantes e melhorias
3. Leads assumem frentes do dia
4. QA lista regressões abertas
5. fechamento do dia com status:
   - concluído
   - em validação
   - bloqueado
   - risco residual

### Ritual de feature

1. PM escreve escopo e aceite
2. Arquiteto valida estrutura quando necessário
3. Lead implementa
4. QA executa validação mínima
5. Orquestrador decide push

### Ritual de bug crítico

1. Orquestrador classifica severidade
2. Lead do módulo assume
3. Infra entra se houver runtime, auth, build ou deploy
4. QA valida correção
5. Orquestrador publica hotfix

### Ritual semanal

1. revisar KPIs por pod
2. revisar regressões recorrentes
3. revisar backlog de dívida técnica
4. revisar rollout de `cifras v2`
5. revisar evolução SEO e ativação por cadastro

## Padrão de qualidade por agente

### Todo lead deve entregar

- mudança implementada
- write set respeitado
- validação local mínima
- resumo do que mudou
- risco residual claro

### Nenhum agente deve

- editar fora do escopo atribuído
- reverter trabalho alheio sem autorização
- publicar mudança estrutural sem aval do Arquiteto
- considerar uma entrega pronta sem QA quando houver risco de regressão

## KPIs de gestão

### Comando

- lead time da demanda ao deploy
- taxa de retrabalho
- taxa de regressão pós-push

### Produto

- clareza de aceite
- percentual de entregas aprovadas sem reescopo

### QA

- regressões detectadas antes do push
- falhas escapadas para produção

### Pods

- Public Experience: fluidez mobile, taxa de erro visual, ativação por cadastro
- Admin & Backoffice: sucesso operacional, clareza do estado, tempo de operação
- Cifras & Estudo: rollout `v2`, qualidade do estudo, cobertura de shapes e defaults
- Catálogo & Dados: consistência, duplicidade, integridade dos vínculos
- SEO & Discoverability: cobertura indexável, CTR, descoberta de novas URLs
- Plataforma & Infra: estabilidade de build, recuperação de chunk, erros de auth/runtime
- Growth & Activation: cadastro após primeiro hino, retenção, redução de abandono

## Relação com os demais documentos

Este quadro deve ser usado junto com:

- [codex-subagents-operating-model.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-subagents-operating-model.md)
- [codex-current-cycle-plan.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-current-cycle-plan.md)
- [codex-subagents-playbook.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-subagents-playbook.md)
- [codex-subagents-prompt-kit.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-subagents-prompt-kit.md)

## Decisão executiva

O time oficial da operação Codex do projeto é:

1. Orquestrador / CEO
2. Produto / PM
3. Arquiteto / CTO
4. QA & Release Lead
5. Public Experience Lead
6. Admin & Backoffice Lead
7. Cifras & Estudo Lead
8. Catálogo & Dados Lead
9. SEO & Discoverability Lead
10. Plataforma & Infra Lead
11. Growth & Activation Lead
12. Editorial Musical Lead
13. Auditor de Dados
14. Auditor SEO

Esse é o quadro oficial para operação profissional da plataforma.
