# Dashboard Executivo da Operação Codex

## Objetivo

Dar a você uma visão executiva simples e recorrente da operação da plataforma Cânticos CCB.

Este dashboard existe para responder, rapidamente:

- o que está andando
- o que está travado
- onde está o maior risco
- quem é o dono de cada frente
- quais KPIs merecem atenção agora

## Como ler este dashboard

### Status oficiais

- `verde`: frente saudável
- `amarelo`: frente andando com risco ou dependência relevante
- `vermelho`: frente bloqueada, regressiva ou com risco alto de impacto

### Regra de leitura

Leia nesta ordem:

1. metas executivas
2. saúde das frentes
3. KPIs
4. riscos
5. decisões e ações da semana

## Metas executivas atuais

### Meta 1. Tornar o `cifras v2` o padrão real da plataforma

Definição de sucesso:

- legado migrado de forma operacional
- catálogo público `v2` visível
- estudo guiado funcional com defaults editoriais
- operação possível via admin sem depender de engenharia

Dono executivo:

- `Cifras & Estudo Lead`

Status:

- `amarelo`

Justificativa:

- fundação, editor, catálogo, shapes, estudo e defaults já existem
- o ponto crítico restante é a operação real do backfill e da publicação em lote

### Meta 2. Garantir operação admin previsível

Definição de sucesso:

- backoffice claro
- ações de rollout visíveis
- edição e importação estáveis
- menos necessidade de hotfix corretivo no admin

Dono executivo:

- `Admin & Backoffice Lead`

Status:

- `amarelo`

Justificativa:

- o admin evoluiu muito
- ainda precisa de validação recorrente com uso operacional real

### Meta 3. Entregar experiência pública superior no nicho CCB

Definição de sucesso:

- cifra pública com experiência de estudo madura
- mobile sólido
- fluxo público sem regressões
- ativação por cadastro sem ruído de premium

Dono executivo:

- `Public Experience Lead`

Status:

- `amarelo`

Justificativa:

- a experiência pública já ganhou metrônomo, canhoto, duas colunas, sync e loop
- ainda falta rodar QA final sobre catálogo `v2` real publicado

### Meta 4. Sustentar descoberta e estabilidade

Definição de sucesso:

- SSR e sitemap coerentes
- deploy estável
- auth consistente
- recuperação de chunk sem fricção para o usuário

Dono executivo:

- `Plataforma & Infra Lead` e `SEO & Discoverability Lead`

Status:

- `verde`

Justificativa:

- as fundações técnicas estão mais estáveis
- hoje o maior risco está mais no rollout e no acervo do que na estrutura

## Saúde das frentes

| Frente | Dono | Status | Leitura executiva |
| --- | --- | --- | --- |
| Rollout real de `cifras v2` | Cifras & Estudo Lead | `amarelo` | base pronta, precisa operar catálogo real |
| Operação admin previsível | Admin & Backoffice Lead | `amarelo` | painel forte, precisa validação em uso intenso |
| Experiência pública de estudo | Public Experience Lead | `amarelo` | produto forte, falta QA final em produção real |
| Ativação por cadastro após o primeiro hino | Growth & Activation Lead | `verde` | regra já implantada, precisa observar conversão |
| Integridade do catálogo e vínculos | Catálogo & Dados Lead | `amarelo` | precisa auditoria pós-backfill |
| Estabilidade de runtime/auth/deploy | Plataforma & Infra Lead | `verde` | principal risco estrutural está sob controle |
| Descoberta orgânica sustentada | SEO & Discoverability Lead | `verde` | base forte, depende de expansão real do acervo |

## KPIs executivos

### Produto

- `rollout_v2_percentual`
  - objetivo: crescer até que o `v2` domine as cifras públicas
  - status atual: depende da operação do backfill

- `catalogo_v2_publicado`
  - objetivo: aumentar continuamente o número de versões `v2` publicadas e visíveis
  - status atual: painel admin já mede isso

### Experiência

- `cadastro_apos_primeiro_hino`
  - objetivo: aumentar conversão sem criar fricção desnecessária
  - dono: Growth & Activation Lead

- `regressoes_publicas_criticas`
  - objetivo: zero regressão crítica escapada por ciclo
  - dono: QA & Release Lead

- `fluidez_mobile_cifra`
  - objetivo: manter leitura e estudo sem overflow, travamento ou confusão
  - dono: Public Experience Lead

### Operação

- `tempo_para_publicar_uma_cifra_v2`
  - objetivo: cair ao longo dos ciclos
  - dono: Admin & Backoffice Lead

- `taxa_de_sucesso_em_importacao_e_rollout`
  - objetivo: reduzir falhas operacionais
  - dono: Admin & Backoffice Lead + Catálogo & Dados Lead

### Estrutura

- `falhas_de_build_ou_deploy`
  - objetivo: zero regressão estrutural por ciclo
  - dono: Plataforma & Infra Lead

- `erros_de_chunk_auth_runtime`
  - objetivo: tendência de queda contínua
  - dono: Plataforma & Infra Lead

### Descoberta

- `novas_urls_indexaveis_utilizadas`
  - objetivo: ampliar cobertura útil, não só volume
  - dono: SEO & Discoverability Lead

- `ctr_e_impressao_das_rotas_de_cifra`
  - objetivo: crescer conforme o catálogo `v2` ganhar massa
  - dono: SEO & Discoverability Lead

## Principais riscos executivos

### Risco 1. `cifras v2` pronto em código, mas ainda fraco em catálogo real

Impacto:

- o produto parece pronto tecnicamente, mas o usuário ainda não percebe o ganho total

Mitigação:

- operar backfill
- publicar versões `v2`
- auditar catálogo público

Responsável:

- `Cifras & Estudo Lead`

### Risco 2. Admin forte em feature, mas ainda sem massa operacional suficiente

Impacto:

- gargalos só aparecem quando o time usa o admin em volume

Mitigação:

- rodada de uso real
- checklist de QA no admin
- auditoria pós-operação

Responsável:

- `Admin & Backoffice Lead`

### Risco 3. Catálogo inconsistente após importação, migração ou vínculo manual

Impacto:

- páginas públicas erradas
- filtros errados
- SEO e experiência degradados

Mitigação:

- auditoria de dados recorrente
- checagem de slugs, vínculos e publicação

Responsável:

- `Catálogo & Dados Lead`

### Risco 4. Crescimento orgânico limitado por acervo, não por código

Impacto:

- infraestrutura SEO pronta, mas sem massa suficiente para crescer

Mitigação:

- ampliar catálogo útil
- publicar mais cifras e páginas de valor
- fortalecer repertório público real

Responsável:

- `SEO & Discoverability Lead`

## Decisões executivas desta fase

### Decisão 1

O produto não terá assinatura premium.

Direção:

- ativação por cadastro após o primeiro hino

### Decisão 2

O `cifras v2` é o caminho oficial.

Direção:

- legado vira fonte de migração
- não de evolução estratégica

### Decisão 3

O admin deve operar rollout e publicação com o mínimo possível de dependência de engenharia.

### Decisão 4

SEO continua importante, mas o próximo gargalo relevante é catálogo e rollout real, não infraestrutura básica.

## Próximas ações executivas

1. Operar o backfill em `/admin/cifras`
2. Publicar um lote real de cifras `v2`
3. Fazer QA final nas rotas públicas de cifra com catálogo `v2` real
4. Auditar consistência de dados após o rollout
5. Revisar impacto em descoberta orgânica

## Perguntas executivas que este dashboard deve responder toda semana

1. O `cifras v2` já está visível para o usuário real ou ainda está mais em código do que em operação?
2. O admin está operável pelo time ou ainda depende de intervenção de engenharia?
3. O fluxo de cadastro após o primeiro hino está convertendo melhor?
4. O catálogo está consistente após os últimos lotes de migração e importação?
5. Existe alguma regressão crítica aberta em experiência pública, admin ou deploy?

## Relação com os demais documentos

- [codex-first-operational-assessment.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-first-operational-assessment.md)
- [codex-official-subagents-roster.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-official-subagents-roster.md)
- [codex-active-fronts-board.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-active-fronts-board.md)
- [codex-current-cycle-plan.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-current-cycle-plan.md)
- [codex-kickoff-templates.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-kickoff-templates.md)
- [codex-subagents-playbook.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-subagents-playbook.md)
- [codex-subagents-prompt-kit.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-subagents-prompt-kit.md)
