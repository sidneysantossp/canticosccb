# Templates de Kickoff da Operação Codex

## Objetivo

Padronizar a abertura de trabalho entre subagentes para reduzir ambiguidade, retrabalho e perda de contexto.

Use estes templates sempre que uma nova frente for aberta.

## Template 1. Kickoff de sprint

```text
Você está entrando no kickoff de sprint da plataforma Cânticos CCB.

Objetivo da sprint:
<descreva o resultado principal>

Contexto:
- estado atual do projeto
- motivo da sprint
- impacto esperado

Frentes da sprint:
1. <frente 1>
2. <frente 2>
3. <frente 3>

Defina:
- ordem de execução
- dono principal por frente
- dependências
- riscos
- critério de aceite por frente
- o que precisa de explorer e o que precisa de worker

Não implemente. Estruture a sprint.
```

## Template 2. Kickoff de feature pública

```text
Você é o lead desta feature pública da plataforma Cânticos CCB.

Objetivo:
<descreva a feature>

Escopo:
<páginas, componentes, stores, rotas>

Restrições:
- preservar mobile
- evitar regressão no player e cadastro
- manter compatibilidade com SSR/SEO quando aplicável

O que eu preciso:
- plano curto
- write set
- critérios de aceite
- riscos
- validação mínima
```

## Template 3. Kickoff de bug crítico

```text
Você está assumindo um bug crítico na plataforma Cânticos CCB.

Sintoma:
<descreva o erro>

Impacto:
<usuários, páginas, admin, SEO, deploy>

Escopo provável:
<módulos e arquivos suspeitos>

Entregue:
- hipótese principal
- confirmação rápida dos pontos de falha
- correção mínima segura
- validação para hotfix
- risco residual

Priorize tempo de recuperação sem criar dívida estrutural desnecessária.
```

## Template 4. Kickoff de rollout controlado

```text
Você está liderando um rollout controlado na plataforma Cânticos CCB.

Mudança:
<descreva o módulo ou fluxo>

Estado atual:
<legado, novo modelo, percentuais, backfill, catálogo>

Objetivo do rollout:
<o que precisa ficar dominante ao final>

Preciso que você defina:
- etapas do rollout
- pré-requisitos
- riscos de compatibilidade
- sinais de sucesso
- rollback ou fallback
- critérios para considerar o rollout concluído
```

## Template 5. Kickoff de mudança estrutural

```text
Você é o Arquiteto desta mudança estrutural na plataforma Cânticos CCB.

Objetivo:
<descreva a mudança>

Escopo técnico:
<schema, migrações, contratos, frontend, admin, SSR>

Entregue:
- proposta estrutural
- impacto em compatibilidade
- plano de migração
- ordem correta de implementação
- riscos operacionais
- validação obrigatória antes do push
```

## Template 6. Kickoff de auditoria de dados

```text
Você é o Auditor de Dados desta frente.

Escopo:
<tabelas, vínculos, catálogo, imports, slugs, publicação>

Objetivo:
<o que precisa ser auditado>

Entregue:
- inconsistências encontradas
- gravidade
- impacto público e operacional
- arquivos e fluxos relacionados
- correção recomendada

Não implemente. Foque na auditoria.
```

## Template 7. Kickoff de auditoria SEO

```text
Você é o Auditor SEO desta frente.

Escopo:
<SSR, sitemap, schema, páginas públicas, canonicals, render>

Objetivo:
<o que precisa ser validado>

Entregue:
- riscos de indexação
- render problemático
- inconsistências de canonical, robots ou sitemap
- recomendações de correção

Não implemente. Foque em indexabilidade e descoberta.
```

## Template 8. Kickoff de QA funcional

```text
Você é o QA & Release Lead desta entrega.

Mudança:
<descreva a entrega>

Escopo funcional:
<rotas, páginas, admin, player, catálogo, auth>

Eu preciso:
- plano de smoke test
- fluxos críticos
- regressões prováveis
- critérios de aprovação
- riscos residuais se o push for feito agora

Não implemente. Valide e decida o gate de release.
```

## Template 9. Kickoff de Growth & Activation

```text
Você é o Growth & Activation Lead desta frente.

Objetivo:
<cadastro, retenção, recuperação, continuidade de escuta>

Escopo:
<modais, páginas, mensagens, player, tracking>

Entregue:
- hipótese de conversão
- mudanças recomendadas
- impacto esperado
- risco de fricção
- critérios de teste
```

## Template 10. Kickoff do Editorial Musical

```text
Você é o Editorial Musical Lead desta frente.

Objetivo:
<tom, cifra, estudo, seções, defaults, shapes, nomenclatura>

Escopo:
<páginas, versões, acordes, estudo guiado>

Entregue:
- problemas de coerência musical
- sugestões de melhoria
- o que precisa de override editorial
- risco para a experiência do músico

Não implemente. Foque em coerência musical e usabilidade prática.
```

## Handoff padrão entre agentes

Use este bloco ao passar o trabalho de um agente para outro:

```text
Handoff:
- objetivo da frente:
- status atual:
- o que já foi feito:
- arquivos envolvidos:
- riscos abertos:
- validação já realizada:
- próximo passo esperado:
```

## Checklist mínimo antes de qualquer kickoff

- objetivo claro
- dono principal claro
- escopo e write set claros
- tipo de agente correto: `explorer` ou `worker`
- critério de aceite definido
- necessidade de aprovação identificada

## Relação com os demais documentos

- [codex-official-subagents-roster.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-official-subagents-roster.md)
- [codex-current-cycle-plan.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-current-cycle-plan.md)
- [codex-subagents-playbook.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-subagents-playbook.md)
- [codex-subagents-prompt-kit.md](/Applications/MAMP/htdocs/canticosccb-2026/docs/operations/codex-subagents-prompt-kit.md)

