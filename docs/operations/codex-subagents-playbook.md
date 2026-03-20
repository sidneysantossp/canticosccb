# Playbook de Execução com Subagentes Codex

## Objetivo

Este playbook traduz o modelo operacional e o plano do ciclo atual para um conjunto de regras práticas dentro do Codex.

Ele responde a quatro perguntas:

1. quando usar `explorer`
2. quando usar `worker`
3. como escrever o prompt de cada subagente
4. como aprovar, integrar e publicar sem perder controle

Este documento é a referência de execução diária do Orquestrador.

## Princípios operacionais

- nenhum subagente trabalha sem objetivo claro
- nenhum worker escreve fora do write set atribuído
- nenhum resultado importante sobe sem QA
- toda mudança estrutural precisa de aprovação do Arquiteto
- toda entrega precisa deixar claro o que mudou, o que foi validado e o que ainda é risco residual

## Tipos de subagente

### `explorer`

Use quando a tarefa principal for:

- mapear código
- levantar dependências
- encontrar gargalos
- identificar riscos
- comparar alternativas
- auditar dados, SEO ou comportamento

Nunca use explorer para:

- implementação principal bloqueante
- editar arquivos de produção
- fazer um lote de mudanças integrado

Resultado esperado de um explorer:

- diagnóstico objetivo
- arquivos relevantes
- riscos
- próximos passos

### `worker`

Use quando a tarefa principal for:

- implementar
- corrigir bug
- editar telas
- alterar schema ou fluxo
- escrever testes
- adaptar integração existente

Nunca use worker sem:

- write set definido
- escopo claro
- expectativa explícita de saída

Resultado esperado de um worker:

- mudança implementada
- validação local
- resumo do que foi alterado
- riscos residuais

## Regra de decisão: `explorer` ou `worker`

### Use `explorer` primeiro quando

- o módulo é desconhecido
- o bug é difuso
- há suspeita de regressão estrutural
- a próxima decisão depende de leitura do código
- você precisa descobrir o estado real antes de implementar

### Use `worker` direto quando

- o escopo é claro
- o write set está definido
- o bug é localizável
- já existe contexto suficiente
- a implementação não depende de investigação externa

### Use os dois quando

- a feature é grande
- uma parte é leitura e outra é execução
- a arquitetura precisa ser confirmada antes da mudança

Fluxo ideal:

1. explorer mapeia
2. orquestrador decide
3. worker implementa
4. QA valida

## Receita de delegação do Orquestrador

### Passo 1. Classificar a demanda

Classifique toda demanda em um dos grupos:

- bug crítico
- melhoria operacional
- feature pública
- mudança estrutural
- ajuste SEO
- limpeza técnica

### Passo 2. Definir dono principal

Escolha um único responsável pela entrega.

Exemplos:

- `cifras v2`: Cifras & Estudo Lead
- `admin de rollout`: Admin & Backoffice Lead
- `chunk recovery`: Plataforma & Infra Lead
- `SSR/sitemap`: SEO & Discoverability Lead

### Passo 3. Definir write set

O worker deve receber explicitamente os arquivos ou diretórios pelos quais é responsável.

Exemplo:

- worker A: [/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin)
- worker B: [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/cifras-v2](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/cifras-v2)

### Passo 4. Definir critério de aceite

Cada subagente deve saber como o trabalho será julgado.

Exemplos:

- “o admin deve mostrar claramente se a versão `v2` está publicada e visível no catálogo”
- “o visitante deve receber o modal de cadastro após o primeiro hino”
- “a página pública da cifra deve abrir em mobile sem overflow horizontal”

### Passo 5. Definir validação

Toda delegação já deve incluir o que precisa ser validado:

- `npm run build`
- smoke test manual
- Playwright
- leitura do diff
- validação em banco

## Formato padrão do prompt de um subagente

Use sempre esta estrutura:

1. papel
2. objetivo
3. write set
4. restrições
5. critério de aceite
6. saída esperada

## Template base para `explorer`

```text
Você é o explorer responsável por diagnosticar esta demanda.

Objetivo:
<descreva o problema ou objetivo>

Escopo de leitura:
<arquivos, módulos, rotas, tabelas>

O que preciso de você:
- mapear como isso funciona hoje
- apontar arquivos críticos
- listar riscos e causas prováveis
- sugerir próximo passo de implementação

Restrições:
- não implemente
- não edite arquivos
- não refaça trabalho já confirmado

Saída esperada:
- diagnóstico curto
- lista de arquivos
- risco principal
- recomendação prática
```

## Template base para `worker`

```text
Você é o worker responsável por implementar esta entrega.

Objetivo:
<descreva o resultado esperado>

Seu write set:
<arquivos e diretórios onde pode escrever>

Restrições:
- você não está sozinho no código
- não reverta mudanças alheias
- não escreva fora do seu escopo
- preserve compatibilidade com o estado atual

Critério de aceite:
- <resultado 1>
- <resultado 2>
- <resultado 3>

Validação obrigatória:
- rodar build ou validação apropriada

Saída esperada:
- resumo do que mudou
- arquivos alterados
- validação executada
- risco residual
```

## Templates por lead

### Orquestrador

```text
Você coordena a entrega. Quebre o problema, defina donos, riscos, ordem de execução e gate final. Só aprove mudanças com validação técnica e funcional.
```

### Produto / PM

```text
Transforme o objetivo em backlog curto, com critérios de aceite, risco, prioridade e definição de pronto.
```

### Arquiteto / CTO

```text
Revise a solução do ponto de vista estrutural. Valide schema, contratos, compatibilidade e custo futuro de manutenção. Aponte se a solução deve ser aprovada, ajustada ou vetada.
```

### Public Experience Lead

```text
Implemente a experiência pública com foco em responsividade, clareza, estabilidade e continuidade do consumo. Preserve o design existente quando já houver padrão consolidado.
```

### Admin & Backoffice Lead

```text
Implemente o fluxo administrativo de forma operacionalmente clara. Priorize estados explícitos, ações rápidas, visibilidade do sistema e redução de retrabalho do time.
```

### Cifras & Estudo Lead

```text
Implemente e refine o módulo `cifras v2`. Priorize qualidade musical, publicação real, estudo guiado, editor confiável e experiência pública superior para o nicho CCB.
```

### Catálogo & Dados Lead

```text
Implemente correções e integrações preservando a verdade do acervo. Priorize consistência entre banco, admin e frontend, sem duplicidade indevida ou quebra de vínculo.
```

### SEO & Discoverability Lead

```text
Implemente mudanças com foco em render para bot, indexação, schema, sitemap e páginas de intenção. Não introduza páginas fracas ou ruído de indexação.
```

### Plataforma & Infra Lead

```text
Implemente com foco em build, deploy, auth, compatibilidade de ambiente e estabilidade pós-publicação. Priorize recuperação segura e previsibilidade operacional.
```

### Growth & Activation Lead

```text
Implemente ajustes que aumentem a ativação do usuário. Priorize o momento pós-primeiro hino, clareza de mensagem, continuidade do fluxo e baixa fricção.
```

### QA & Release Lead

```text
Valide a entrega como QA. Procure bug real, regressão, quebra de fluxo, inconsistência de estado, erro mobile e falha pós-deploy. Relate achados reproduzíveis.
```

### Auditor de Dados

```text
Audite a consistência dos dados após a entrega. Verifique catálogo, relações, visibilidade, contagens e publicação efetiva.
```

### Auditor SEO

```text
Audite a entrega do ponto de vista de indexação. Verifique SSR, canonicals, schema, sitemap, render para bot e risco de páginas fracas.
```

## Receitas prontas por cenário

### Cenário 1. Bug crítico no admin

Use:

- explorer de Admin & Backoffice
- worker de Admin & Backoffice
- QA

Prompt do explorer:

```text
Diagnostique por que a tela administrativa X não salva ou não carrega. Leia apenas os arquivos do módulo admin e as APIs internas relacionadas. Não implemente.
```

Prompt do worker:

```text
Corrija o bug da tela administrativa X. Seu write set é o módulo admin relacionado e a API admin correspondente. Preserve compatibilidade com o fluxo existente e valide com build.
```

### Cenário 2. Rollout do `cifras v2`

Use:

- explorer de Catálogo & Dados
- worker de Cifras & Estudo
- worker de Admin & Backoffice
- QA

Sequência:

1. explorer confirma estado real do catálogo
2. worker de Cifras corrige/padroniza publicação
3. worker de Admin melhora operação
4. QA valida público e backoffice

### Cenário 3. Regressão pública mobile

Use:

- explorer de Public Experience
- worker de Public Experience
- QA

### Cenário 4. Problema de deploy, auth ou chunk

Use:

- explorer de Plataforma & Infra
- worker de Plataforma & Infra
- QA

### Cenário 5. Expansão SEO

Use:

- explorer de SEO
- worker de SEO
- auditor SEO

## Handoff entre subagentes

Todo handoff deve seguir este formato:

### Handoff curto

```text
Contexto:
- <o que foi verificado>

Achado principal:
- <problema ou oportunidade>

Arquivos críticos:
- <arquivo 1>
- <arquivo 2>

Recomendação:
- <próximo passo>

Risco:
- <risco residual>
```

### Handoff de implementação

```text
O que foi alterado:
- <resumo>

Arquivos alterados:
- <arquivo 1>
- <arquivo 2>

Validação:
- <build/teste>

Ainda pendente:
- <ponto pendente>
```

## Gate de aprovação

### Gate 1. Aprovação do dono do módulo

Perguntas:

- a entrega resolve o problema?
- o write set foi respeitado?
- a solução é coerente com o módulo?

### Gate 2. Aprovação técnica

Perguntas:

- existe risco estrutural?
- a integração entre módulos foi preservada?
- há dívida criada sem necessidade?

Aprovadores:

- Arquiteto
- Orquestrador

### Gate 3. Aprovação funcional

Perguntas:

- o fluxo principal funciona?
- há regressão visível?
- a entrega é operável pelo time?

Aprovador:

- QA & Release

### Gate 4. Aprovação específica

Use quando aplicável:

- Editorial Musical
- Auditor de Dados
- Auditor SEO

## Regras de paralelização

### Paralelize quando

- houver perguntas independentes
- os write sets não se sobrepõem
- o resultado de um não bloquear imediatamente o outro

### Não paralelize quando

- dois agentes escreveriam o mesmo arquivo
- a decisão de arquitetura ainda está aberta
- a segunda tarefa depende diretamente da primeira

### Exemplo correto

- explorer A lê `admin`
- explorer B lê `cifras v2`
- worker A edita [/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin)
- worker B edita [/Applications/MAMP/htdocs/canticosccb-2026/src/lib/cifras-v2](/Applications/MAMP/htdocs/canticosccb-2026/src/lib/cifras-v2)

### Exemplo incorreto

- dois workers editando [AdminCifras.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/admin/AdminCifras.tsx) ao mesmo tempo

## Padrão de release

### Lote pequeno

- 1 worker
- build
- revisão do diff
- push

### Lote médio

- 1 explorer
- 1 worker
- QA
- push

### Lote grande

- 1 orquestrador
- 1 a 2 explorers
- 2 ou mais workers com write sets separados
- QA
- auditor específico
- push

## Playbook do ciclo atual

### Frente 1. `cifras v2`

Ordem:

1. Catálogo & Dados audita o estado
2. Admin & Backoffice viabiliza rollout
3. Cifras & Estudo corrige publicação/estudo
4. QA valida
5. Orquestrador publica

### Frente 2. ativação após primeiro hino

Ordem:

1. Growth define a mensagem
2. Public Experience ajusta a UI
3. QA valida visitante deslogado
4. Orquestrador publica

### Frente 3. estabilidade operacional

Ordem:

1. Plataforma & Infra diagnostica
2. worker de Plataforma implementa
3. QA valida pós-build e pós-navegação
4. Orquestrador publica

## Checklist do Orquestrador antes de publicar

- o dono da entrega está claro
- o write set foi respeitado
- existe validação mínima
- o risco residual foi explicitado
- o lote não mistura mudanças não relacionadas
- arquivos locais gerados não entraram por acidente

## O que este playbook resolve

- reduz caos de delegação
- evita overlap entre agentes
- padroniza prompts
- padroniza handoffs
- deixa a aprovação previsível
- cria uma máquina operacional real dentro do Codex

