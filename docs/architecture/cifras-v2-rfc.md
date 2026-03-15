# RFC: Modulo de Cifras V2

## Objetivo
Construir um modulo de cifras para a plataforma Cânticos CCB que seja mais robusto do que portais generalistas, com foco em repertorio da CCB, integracao nativa com hino, hinario, compositor e audio, alem de fluxo editorial forte.

## Contexto Atual
O modulo atual de cifras possui as seguintes limitacoes tecnicas:

- uma cifra inteira fica concentrada em um unico campo `content`
- cada registro representa apenas uma versao simples por instrumento
- nao existe historico de revisoes
- nao existe workflow editorial forte (`draft -> review -> published`)
- nao existe AST estruturada para renderizacao, validacao e comparacao
- os diagramas de acordes vivem hardcoded no frontend e hoje cobrem essencialmente violao
- o vinculo com o repertorio principal e fraco, baseado principalmente em `hino_id` e heuristica
- nao existe suporte real a multiplas versoes por hino, dificuldade, arranjo, afinacao e estudo

Arquivos relevantes do estado atual:

- [src/api/cifras.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/api/cifras.ts)
- [src/pages/CifraPage.tsx](/Applications/MAMP/htdocs/canticosccb-2026/src/pages/CifraPage.tsx)
- [src/utils/chordUtils.ts](/Applications/MAMP/htdocs/canticosccb-2026/src/utils/chordUtils.ts)
- [database/migrations/CREATE_CIFRAS.sql](/Applications/MAMP/htdocs/canticosccb-2026/database/migrations/CREATE_CIFRAS.sql)

## Visao de Produto
O modulo novo deve permitir:

- varias versoes de cifra para o mesmo hino
- versoes por instrumento: violao, ukulele, teclado, cavaco e outros
- versoes por arranjo: simplificada, completa, estudo, culto, instrumental
- selo editorial: oficial, revisada, comunidade
- comparacao entre versoes
- capo, afinacao, compasso, andamento, tonalidade original e tonalidade sugerida
- blocos estruturados por secao: intro, verso, coro, ponte, final
- renderizacao consistente para web, mobile e impressao
- diagramas de acordes por instrumento
- historico de revisoes e rollback
- fila de revisao e aprovacao
- relato de erro por usuarios
- integracao com hino, letra do hinario, audio, compositor e hubs SEO

## Principios de Arquitetura
1. Separar write model de read model.
2. O conteudo de edicao deve ser estruturado, nao apenas texto cru.
3. A pagina publica deve ler um modelo pronto para renderizacao rapida.
4. O frontend deve parar de depender de heuristicas soltas para relacionar cifra e hino.
5. O modulo precisa suportar crescimento editorial sem quebrar URLs publicas.

## Modelo Conceitual

### 1. Cifra Song
Entidade canonica do repertorio que representa "o hino para o qual existem cifras".

Responsabilidades:

- identificar o hino base
- guardar slug canonico e metadados SEO
- vincular com hino, hinario e compositor
- centralizar contagem e status macro

### 2. Cifra Version
Representa uma versao especifica de cifra.

Exemplos:

- Hino 454 para violao, versao simplificada
- Hino 454 para teclado, arranjo completo
- Hino 454 para ukulele, tom alternativo

Responsabilidades:

- instrumento
- arranjo
- dificuldade
- tonalidade
- capo
- afinacao
- status editorial

### 3. Cifra Section
Representa um bloco estruturado de conteudo.

Exemplos:

- intro
- verso 1
- coro
- ponte
- final

Cada secao guarda AST e texto de apoio para renderizacao, busca e diff.

### 4. Chord Shape
Biblioteca de diagramas por instrumento.

Responsabilidades:

- acordes por instrumento
- variacoes
- prioridade de exibicao
- suporte para canhoto e futuras visualizacoes

### 5. Revision / Review / Report
Camada editorial e de qualidade.

Responsabilidades:

- historico de alteracoes
- aprovacao
- pedidos de ajuste
- relatos de erro

## Fluxo Editorial

1. Editor cria `cifra_song` se ainda nao existir.
2. Editor cria `cifra_version` em `draft`.
3. Editor preenche secoes e dados musicais.
4. Sistema gera preview, metadados e indice de acordes.
5. Editor envia para `in_review`.
6. Revisor aprova, pede ajustes ou rejeita.
7. Ao publicar:
   - status vai para `published`
   - read model publico e regenerado
   - SEO fields sao atualizados
   - historico da revisao e salvo

## Modelo de Renderizacao

### Write Model
Armazena estrutura rica para edicao:

- secoes
- linhas
- marcacoes
- acordes
- observacoes
- metadados musicais

### Read Model
Derivado do write model para leitura publica:

- HTML pronto
- texto plano
- indice de acordes
- blocos para SEO
- relacoes com letra e audio

## SEO e Descoberta
O modulo deve gerar paginas fortes para:

- `hino {numero} ccb cifra`
- `cifra hino {numero} ccb`
- `cifra violao hino {numero} ccb`
- `cifra teclado hino {numero} ccb`
- `cifra ukulele hino {numero} ccb`

Cada cifra precisa:

- link para a letra no hinario
- link para o audio do hino
- link para o compositor
- link para versoes alternativas
- schema consistente

## Estrategia de Migracao

### Fase 1
Criar novo schema sem quebrar a tabela atual `cifras`.

### Fase 2
Criar adaptador que converta um registro legado em `cifra_song + cifra_version + cifra_sections`.

### Fase 3
Publicar nova read model em paralelo.

### Fase 4
Migrar a pagina publica para ler o modelo novo.

### Fase 5
Migrar admin/editor.

### Fase 6
Descontinuar a tabela legada como fonte principal, mantendo compatibilidade de leitura enquanto necessario.

## Backlog por Sprints

### Sprint 1
- schema v2
- tipos de dominio
- repositorios de leitura/escrita
- migration compatibilizada

### Sprint 2
- editor v2
- parser e AST
- validacao de acordes
- geracao de preview

### Sprint 3
- pagina publica v2
- diagramas por instrumento
- versoes por arranjo
- SEO/read model

### Sprint 4
- fila editorial
- historico de revisoes
- reports
- indicadores de qualidade

### Sprint 5
- migracao do acervo atual
- comparador entre versoes
- recursos de estudo

## Decisoes Importantes

### Por que nao manter tudo na tabela `cifras`
Porque ela mistura identidade do hino, identidade da versao, conteudo, publicacao e estado editorial em um unico registro.

### Por que usar AST
Porque o modulo precisa suportar:

- renderizacao consistente
- diff entre revisoes
- destaque por secao
- exportacao futura
- validacao automatica

### Por que separar song e version
Porque um mesmo hino pode ter varias cifras relevantes e todas precisam apontar para um mesmo contexto canonico.

## Riscos

- migracao de conteudo legado mal formatado
- heuristicas fracas para vincular cifra e hino sem dados consistentes
- crescimento de complexidade do editor
- necessidade futura de funcoes server-side para publicacao segura

## Recomendacao de Implementacao
Comecar pela base de dados e pelas camadas de dominio. Nao migrar direto a pagina publica antes de existir:

- schema novo
- adaptador do legado
- pipeline de publicacao
- read model publico

## Entregaveis Desta Rodada

- migration inicial `CREATE_CIFRAS_V2_MODULE.sql`
- tipos de dominio `src/types/cifras-v2.ts`
- este RFC
