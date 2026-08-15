# Plano Integrado em Duas Frentes — Cânticos CCB

**Base:** auditoria técnica, de experiência e de dados reais realizada em 13 de agosto de 2026.
**Objetivo:** dividir a evolução da plataforma entre uma frente de **ações técnicas** e uma frente de **ações de interface e experiência**, sem redesenhar a identidade visual existente.

> **Princípio de execução.** A frente técnica remove riscos e cria fontes de dados confiáveis; a frente de interface transforma essas fontes em uma jornada simples, clara e musicalmente útil. As duas podem avançar em paralelo, mas nenhuma tela deve prometer uma função que o backend, o catálogo ou as permissões ainda não suportem.

## 1. Ordem entre as frentes

| Marco | Frente técnica | Frente de interface | Critério para avançar |
|---|---|---|---|
| **Marco A — contenção** | RLS, documentos privados, funções privilegiadas e homologação. | Estados de manutenção, indisponibilidade e cobertura honesta. | Nenhuma tabela privada é enumerável por `anon`. |
| **Marco B — acervo confiável** | Modelo canônico, validações de publicação, fila de moderação e correção de agregadores. | Busca por número, ficha de hino e navegação por formatos. | Cada conteúdo exibido tem status e material correspondente. |
| **Marco C — hábito diário** | Biblioteca, histórico, eventos e Realtime por papel. | Modo ensaio, favoritos, playlists e continuidade de reprodução. | Dados persistem corretamente entre sessões. |
| **Marco D — escala e gestão** | Métricas reais, observabilidade, CI e auditoria administrativa. | Dashboards com estados reais, filtros e ações produtivas. | Nenhum indicador é simulado ou apresentado sem período. |

# Frente 1 — Ações Técnicas

## 2. Prioridade P0: segurança e bloqueio de risco (0–48 horas)

A correção técnica começa pela privacidade. A instância real permitiu leitura anônima de 1.088 usuários, 6 documentos de compositor, 80 notificações e 200 playlists. As migrações identificadas usam políticas permissivas `USING (true)` e `WITH CHECK (true)` para documentos, notificações e compositores. Tabelas em schema exposto devem ter RLS ativo e políticas explícitas para `anon` e `authenticated`; ausência de acesso para `anon` é o comportamento correto para dados privados. [1]

| ID | Ação técnica | Escopo | Dependência | Critério de aceite |
|---|---|---|---|---|
| **TEC-P0-01** | Registrar snapshot de `pg_policies`, grants, views, buckets e funções privilegiadas. | Banco e Storage. | Acesso administrativo. | Snapshot anexado à mudança, com rollback documentado. |
| **TEC-P0-02** | Revogar todos os privilégios de `anon`/`PUBLIC` em `users`, `composer_documents`, `notifications`, playlists privadas e tabela operacional de `composers`. | RLS e grants. | TEC-P0-01. | Consulta sem sessão retorna `403` ou conjunto vazio; não há enumeração de IDs. |
| **TEC-P0-03** | Tornar o bucket `documents` privado e remover as políticas abertas de `storage.objects`. | Storage. | TEC-P0-01. | `storage.buckets.public = false`; URL pública antiga não entrega documento. |
| **TEC-P0-04** | Pausar upload de documentos e publicação automática até existir caminho privado e revisado. | Cliente e operação. | TEC-P0-03. | Interface impede upload inseguro e não persiste Base64 em tabela. |
| **TEC-P0-05** | Revogar execução pública de funções `SECURITY DEFINER` e inventariar RPCs administrativas/registro de compositor. | Funções SQL e Auth. | TEC-P0-01. | Nenhuma função privilegiada é executável por `anon`; todas têm `search_path` fixo. |
| **TEC-P0-06** | Congelar mudanças de papel, plano, status, bloqueio e aprovação feitas diretamente pelo navegador. | Auth e API. | TEC-P0-05. | Só serviço server-side/RPC validada modifica atributos de privilégio. |
| **TEC-P0-07** | Criar homologação Supabase separada, com dados sintéticos e contas de usuário, compositor, revisor e administrador. | Infraestrutura e QA. | Nenhuma. | Toda migração crítica é testada e revertida em homologação antes de produção. |

### Padrões técnicos mandatórios da P0

A tabela `users` deve ser privada por padrão. Usuário autenticado lê apenas o próprio perfil; o administrador lê por função de banco confiável; a busca pública usa uma view mínima que nunca contém e-mail, telefone, endereço, plano, status, flags administrativas ou identificadores internos. RLS controla linhas, não colunas: por isso, campos como `is_admin`, `is_composer`, `plan`, `status` e `is_blocked` também devem ser protegidos por privilégios de coluna, trigger ou RPC validada.

Documentos de compositor precisam ser objetos privados em Storage. A tabela deve guardar referência de arquivo, estado de revisão e metadados mínimos; documentos não devem ser persistidos em Base64. O acesso deve ocorrer por URL assinada de curta duração gerada após verificar proprietário, revisor designado ou administrador. O modelo de RLS do Supabase também recomenda declarar tanto `USING` quanto `WITH CHECK` para operações de proprietário, evitando que o usuário reassocie uma linha a outra conta. [1]

## 3. Prioridade P1: fonte de verdade, catálogo e operação (dias 3–14)

| ID | Ação técnica | Problema que resolve | Critério de aceite |
|---|---|---|---|
| **TEC-P1-01** | Criar políticas RLS definitivas para usuário, compositor, documento, notificação e playlist. | A contenção P0 não pode quebrar a experiência autenticada. | Matriz de testes por papel aprovada e automatizada. |
| **TEC-P1-02** | Separar views públicas de tabelas operacionais; revisar `cifra_public_catalog` e demais views expostas. | Views podem ignorar RLS ou expor colunas além do necessário. | Toda view pública tem colunas mínimas, filtro editorial e owner/regras revisados. |
| **TEC-P1-03** | Criar entidade mestre de `hino_canônico` e vínculos explícitos com letra, cifra, partitura, áudio, vídeo e álbum. | Busca por número e conteúdo fragmentado. | Um número de hino resolve para uma ficha única e consistente. |
| **TEC-P1-04** | Adicionar validações de publicação para letra, mídia, duração, faixas, metadados e direitos. | Páginas de hinário sem letra, coletâneas com zero faixas e dados inconsistentes. | Nenhum item publicado viola requisitos mínimos de seu tipo. |
| **TEC-P1-05** | Corrigir o agregador de cifras para falhar por fonte, e não zerar a lista completa. | Existem 10 cifras legadas ativas e 455 itens públicos v2, mas a UI mostra vazio. | `/cifras` exibe os itens publicáveis e informa falha parcial de modo explícito. |
| **TEC-P1-06** | Normalizar Unicode, acentuação, título, slug, compositor e campos editoriais. | Dados como `Jeasus`, `Joas` e variações de espaçamento. | Validador bloqueia publicação de metadado inválido; revisão mantém histórico antes/depois. |
| **TEC-P1-07** | Conciliar o backlog de 773 hinos por ID, status, idade, mídia, direitos e duplicidade. | Painel soma `draft` e `pending`, mas a fila atual lê apenas `pending`. | Relatório de estoque reconcilia 773 itens sem duplicidade e indica o próximo dono. |
| **TEC-P1-08** | Implantar máquina de estados de moderação e trilha de auditoria. | Aprovação/rejeição binária sem triagem, responsável ou motivo estruturado. | Cada decisão registra ator, data, estado anterior, estado novo e motivo. |
| **TEC-P1-09** | Corrigir resolução de compositor ativo e encerramento de loading. | Dashboard de compositor permanece carregando mesmo após resolver relação de gerente. | Sem spinner infinito; timeout e erro acionável em todos os caminhos. |

## 4. Prioridade P2: qualidade, dados e tempo real (semanas 3–8)

| ID | Ação técnica | Resultado esperado | Critério de aceite |
|---|---|---|---|
| **TEC-P2-01** | Criar serviço/RPC de domínio para envio de notificações. | Cliente não insere/edita notificações arbitrariamente. | Notificação só é criada por evento autorizado e chega ao destinatário correto. |
| **TEC-P2-02** | Habilitar e testar Realtime apenas nas tabelas necessárias, com filtro por proprietário. | Atualização imediata sem vazamento de evento. | Duas contas de teste recebem somente seus eventos autorizados; mutação é revertida. |
| **TEC-P2-03** | Criar eventos de produto e trilha administrativa. | Dashboards deixam de inferir atividade a partir de tabelas soltas. | Evento tem ator, ação, entidade, data e retenção definida. |
| **TEC-P2-04** | Estabelecer CI: lint corrigido, type-check, build, teste de rota, teste RLS e auditoria de dependências. | Regressões de segurança e catálogo chegam antes do deploy. | Pull request não é liberado se qualquer verificação crítica falhar. |
| **TEC-P2-05** | Atualizar ou remover a cadeia vulnerável `pwa-asset-generator → puppeteer-core → @puppeteer/browsers → extract-zip`. | Corrige alerta alto de dependência reportado no `npm audit`. | Build PWA validado e `npm audit` sem alerta alto dessa cadeia. |
| **TEC-P2-06** | Criar observabilidade de API, Storage, Realtime e exceções de catálogo. | Erros deixam de virar estado vazio silencioso. | Alertas e logs permitem identificar fonte, rota e impacto sem coletar PII indevida. |

## 5. Frente técnica de moderação: plano de capacidade

A meta não é publicar 773 hinos. É encerrar corretamente 773 itens em estados terminais ou de próxima ação explícita. Para quatro semanas úteis, o plano é: **194 itens na primeira semana e 193 em cada uma das três semanas seguintes**, totalizando 773. A média necessária é de 38,65 itens por dia útil; com dois revisores, a meta média é 19,32 itens por revisor/dia.

| Etapa técnica da fila | Implementação mínima | Resultado operacional |
|---|---|---|
| Reconciliação | Export de IDs e deduplicação por hino/versão. | Uma fila única, sem diferença entre dashboard e tela de pendências. |
| Triagem | Estados `submitted`, `triage`, `needs_info`, `technical_review`, `rights_review`, `editorial_review`. | Item incompleto não ocupa fila de revisão final. |
| Decisão | Estados `approved_for_release`, `scheduled`, `published`, `rejected`, `duplicate_merged`, `archived`. | Aprovar não publica automaticamente; toda decisão é rastreável. |
| Auditoria | Eventos de transição, responsável, razão e prazo. | Administração mede qualidade e não apenas volume. |
| Realtime | Evento filtrado para compositor/revisor e atualização do lote. | Status muda sem recarregar toda a aplicação. |

## 6. Dependências técnicas que bloqueiam a interface

| Recurso de interface | Gate técnico obrigatório |
|---|---|
| Ficha unificada de hino | `hino_canônico`, cobertura por formato e regras de publicação. |
| Busca por número confiável | Índice canônico e normalização de título/número. |
| Aba de cifra/partitura | Catálogo publicado, arquivos válidos e direito/licença verificados. |
| Favoritos e playlists | RLS por proprietário, fonte de verdade única e dados reais de faixa. |
| Perfil público de compositor | View mínima de aprovados, sem PII. |
| Upload de compositor | Bucket privado, URL assinada e fluxo de revisão. |
| Notificações em tempo real | RLS, RPC de domínio e canal filtrado por destinatário. |
| Métricas e tendências de dashboards | Eventos de produto e janela temporal comparável. |

## Referências da frente técnica

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase — Row Level Security"

[2]: https://supabase.com/docs/guides/realtime/postgres-changes "Supabase — Postgres Changes / Realtime"

---

*Continua na Frente 2 — Ações de Interface e Experiência.*

# Frente 2 — Ações de Interface e Experiência

## 7. Direção de design: preservar e tornar confiável

A plataforma **não precisa de redesign**. O tema escuro, o verde como cor de ação, o menu lateral e o player global já compõem uma linguagem coerente e devem permanecer. A mudança necessária é comportamental: a tela deve declarar com honestidade o que existe, levar o visitante rapidamente ao hino certo e nunca exibir botões, métricas, player ou cards que simulam uma ação ainda indisponível.

| Elemento atual | Decisão | Ajuste de interface, sem trocar o layout |
|---|---|---|
| Tema escuro com verde | Preservar. | Aumentar contraste de textos secundários, estados desabilitados e alertas de conteúdo incompleto. |
| Menu lateral | Preservar. | Reordenar por intenção diária; reduzir duplicações e agrupar destinos administrativos extensos. |
| Player global | Preservar. | Exibir título, versão, contexto do hino e atalhos para `Letra`, `Cifra` e `Partitura` quando existirem. |
| Cards de conteúdo | Preservar. | Adicionar sinais de disponibilidade, tipo, duração válida e estado editorial. |
| Onboarding com progresso | Preservar. | Reduzir etapas improdutivas e comunicar requisito, prazo e próximo passo. |
| Estrutura de dashboards | Preservar. | Substituir números artificiais por estados vazios, período de comparação e ações concretas. |

## 8. Prioridade P0 de interface: restaurar confiança e reduzir frustração

| ID | Ação de interface | Problema resolvido | Dependência técnica | Critério de aceite |
|---|---|---|---|---|
| **UX-P0-01** | Criar a ficha unificada de hino, com segmentos `Ouvir`, `Letra`, `Cifra`, `Partitura` e `Versões`. | O detalhe prioriza gravação e fragmenta a obra em páginas desconexas. | `hino_canônico` e cobertura por formato. | Um hino aberto mostra todos os formatos existentes em um único contexto; formato ausente declara por quê. |
| **UX-P0-02** | Transformar a busca por número em intenção prioritária. | Buscar `450` devolve gravação/coletânea, mas não a ficha canônica. | Índice canônico. | `450`, `Hino 450` e título levam à mesma ficha de hino no primeiro resultado. |
| **UX-P0-03** | Mostrar cobertura honesta no hinário e nas cifras. | Hinário parcial, letras ausentes e cifras vazias aparecem como promessa quebrada. | Regras de publicação e contagens reais. | Interface informa `X de Y disponíveis` e chips de formato sem links vazios. |
| **UX-P0-04** | Bloquear ou ocultar CTAs inoperantes. | Coletâneas de 0 faixas/0 min podem ser reproduzidas; play de playlist não faz nada. | Validação de dados. | Todo botão executa uma ação real ou exibe estado desabilitado com explicação. |
| **UX-P0-05** | Introduzir estado de carregamento, erro e retry por módulo. | Falha parcial transforma tela inteira em vazio ou spinner infinito. | Tratamento de erro por API. | Um card pode falhar sem esconder outros; o usuário recebe mensagem e botão `Tentar novamente`. |
| **UX-P0-06** | Remover `+0%`, setas positivas e rankings sem evento. | Métricas simuladas reduzem confiança de usuário, compositor e admin. | Eventos e métricas reais. | Card sem base mostra `Sem dados para este período`, sem tendência artificial. |
| **UX-P0-07** | Exibir status real para compositor e documentos. | Onboarding não informa protocolo, análise, pendência ou próximo passo. | Fluxo seguro de compositor e moderação. | Após envio, compositor vê número de protocolo, status, prazo e ação pendente. |
| **UX-P0-08** | Inserir aviso de segurança e finalidade antes de dados pessoais/documentos. | A interface pede endereço e documento sem explicar necessidade e retenção. | Storage privado e política de dados. | Formulário mostra finalidade, acesso, retenção e não pede campo não essencial. |

### 8.1. Padrões de estado que devem ser adotados em toda a aplicação

O mesmo componente de estado deve aparecer em home, catálogo, detalhe, biblioteca e dashboards. Isso evita mensagens genéricas como “Em breve teremos cifras disponíveis” quando o banco contém conteúdo ou a consulta falhou.

| Estado | Texto recomendado | Ação disponível |
|---|---|---|
| Conteúdo inexistente de verdade | `Ainda não há cifra verificada para este hino.` | `Pedir cifra` ou `Ver outros formatos`. |
| Conteúdo em revisão | `Esta cifra está em revisão editorial.` | `Receber aviso quando estiver disponível`. |
| Cobertura parcial | `Letra disponível. Partitura e cifra ainda não foram adicionadas.` | Navegar apenas nos formatos disponíveis. |
| Falha técnica temporária | `Não foi possível carregar este material agora.` | `Tentar novamente` e manter os módulos que carregaram. |
| Sem atividade pessoal | `Você ainda não salvou hinos.` | `Explorar hinário` ou `Buscar por número`. |
| Sem dados analíticos | `Ainda não há dados suficientes para comparação.` | Sem seta, sem porcentagem e sem ranking artificial. |
| Processo de compositor | `Recebemos seu cadastro. Próxima revisão prevista em até X dias.` | Ver status, complementar pendência ou falar com suporte. |

## 9. Prioridade P1 de interface: tornar a consulta diária mais rápida (semanas 2–6)

### 9.1. Home orientada por tarefa

A home é adequada para exploração, mas o público recorrente precisa consultar hinos por número e ensaiar com poucos passos. Sem alterar as seções existentes, inclua uma faixa compacta acima das recomendações com ações de alta frequência.

| Ordem no topo da home | Ação | Comportamento |
|---:|---|---|
| 1 | `Buscar por número` | Foco imediato no campo, teclado numérico preservado em celular e sugestão de hino canônico. |
| 2 | `Abrir hinário` | Lista paginada por número, edição e cobertura visual. |
| 3 | `Cifras` | Catálogo apenas de itens verificáveis, com filtro por instrumento. |
| 4 | `Partituras` | Filtro de disponibilidade/licença; evita área vazia. |
| 5 | `Continuar ensaio` | Retoma último hino, posição, tom e formato, quando o usuário autorizar histórico. |

A busca global deve agrupar os resultados por obra e não por cada arquivo. O primeiro card responde à pergunta principal: “Hino 450 — título — formatos disponíveis”. Abaixo dele ficam versões, gravações, coletâneas e conteúdos relacionados. Isso reduz duplicidade, facilita a validação editorial e preserva o padrão de cards atual.

### 9.2. Ficha canônica de hino

A ficha unificada é o principal ganho de experiência. O conteúdo não muda de identidade ao alternar entre áudio e cifra; apenas muda de formato no corpo da página. O player global continua tocando e a pessoa não precisa reaprender uma rota para cada recurso.

| Região da ficha | Conteúdo e comportamento | Regra de UX |
|---|---|---|
| Cabeçalho | Número, título editorial, edição do hinário, status de cobertura e favorito. | Número é o elemento de identificação predominante. |
| Segmentos | `Ouvir`, `Letra`, `Cifra`, `Partitura`, `Versões`. | Segmento sem material aparece desabilitado, com explicação curta. |
| Área `Ouvir` | Gravações, instrumentais, coletâneas e fila do player. | Não renderizar mídia sem duração/URL/faixa válida. |
| Área `Letra` | Texto editorial, fonte e versão. | Letra vazia nunca é tratada como página completa. |
| Área `Cifra` | Tom, instrumento, transposição e conteúdo verificado. | Mostrar ferramenta apenas para cifra válida. |
| Área `Partitura` | Visualização ou acesso controlado, edição e instrumento. | Disponibilizar conforme direito/licença. |
| Rodapé | Hinos próximos, versões relacionadas e sugestão de correção. | Recomendações só com dados completos. |

### 9.3. Modo ensaio

A diferenciação em relação a plataformas com publicidade é um ambiente de estudo contínuo, sem interrupção visual. O modo ensaio deve ser uma variação imersiva da mesma ficha, não uma nova arquitetura de página.

| Recurso | Valor para o músico | Regra de lançamento |
|---|---|---|
| Fonte ampliada | Leitura a distância durante ensaio. | P0 quando houver letra/cifra válida. |
| Rolagem controlada | Acompanhamento sem tocar na tela. | P0 com pausa, velocidade e retorno ao ponto atual. |
| Transposição `− / tom / +` | Ajuste rápido para instrumento/voz. | P0 somente em cifras estruturadas e testadas. |
| Tela focada | Menos distrações durante a prática. | P1, sem esconder controles de saída e acessibilidade. |
| Persistir posição | Retomar ensaio no mesmo trecho. | P1, com consentimento e histórico privado. |
| Metrônomo | Preparação de conjunto. | P1 quando BPM/compasso forem confiáveis; ajuste manual opcional. |
| Diagramas de acordes | Apoio a iniciantes. | P1 somente para instrumentos suportados. |

### 9.4. Biblioteca pessoal e coleções

Favoritos, histórico, playlists e itens seguidos devem aparecer como uma única área `Sua biblioteca`, usando abas no conteúdo e mantendo a sidebar. Cards de playlist não podem inventar faixa, capa, artista ou duração a partir de um contador; antes dos dados reais, a interface deve representar a playlist como coleção, não como player falso.

| Aba | Conteúdo | Estado vazio útil |
|---|---|---|
| Favoritos | Hinos/versões salvos, com formato disponível. | `Salve um hino para encontrá-lo rapidamente no próximo ensaio.` |
| Últimos ouvidos | Histórico opt-in e retomada. | `Quando você ouvir um hino, ele aparecerá aqui.` |
| Playlists | Coleções por culto, ensaio, instrumento ou repertório. | `Crie sua primeira coleção de hinos.` |
| Seguindo | Compositores e curadorias públicas. | `Siga compositores e coleções que ajudam seu repertório.` |
| Downloads | Apenas materiais licenciados e realmente disponíveis. | `Nenhum material disponível para acesso offline.` |

## 10. Prioridade P2 de interface: dashboards que ajudam a trabalhar (semanas 4–10)

### 10.1. Dashboard de usuário

| Ação | Resultado de experiência | Dependência |
|---|---|---|
| Trocar métricas vazias por resumo real de biblioteca. | Perfil parece útil mesmo para conta nova. | Eventos de favoritos, histórico e playlists. |
| Exibir `Membro desde` com data real. | Reduz sensação de dados quebrados. | Perfil autenticado confiável. |
| Conectar play de playlist ao player ou remover a ação. | Nenhum controle finge ser reproduzível. | Fonte de faixas consistente. |
| Consolidar áreas pessoais em `Sua biblioteca`. | Menos navegação para tarefa recorrente. | Rotas e dados unificados. |

### 10.2. Dashboard de compositor

| Ação | Resultado de experiência | Dependência |
|---|---|---|
| Resolver spinner infinito e mostrar estado de vínculo. | Compositor entende se está aprovado, pendente ou sendo gerenciado. | Resolução de compositor ativo. |
| Exibir status por hino: rascunho, revisão, pendência, aprovado, agendado, publicado. | Próxima ação fica clara; reduz tickets de suporte. | Máquina de estados de moderação. |
| Substituir plays/receita/downloads zerados por estado sem dados. | Não há promessa de analytics inexistente. | Eventos e agregações reais. |
| Manter seções úteis expandidas na sidebar. | Trabalho diário alterna com menos cliques entre catálogo, publicação e status. | Ajuste de estado local da UI. |
| Mostrar protocolo, SLA e motivo de devolução. | Onboarding e publicação ganham previsibilidade. | Trilha de auditoria/moderação. |

### 10.3. Dashboard administrativo e fila de moderação

A interface de revisão atual é uma lista plana de itens pendentes, com aprovar/rejeitar. Ela deve se tornar uma área de trabalho de decisão, mas pode manter os cards, cores e modais existentes.

| Ação | Como aparece na interface | Dependência técnica |
|---|---|---|
| Filtros de estado, idade, tipo, responsável e bloqueio. | Barra superior compacta e chips de filtro. | Dados reconciliados e máquina de estados. |
| Lote de trabalho do revisor. | Card `Meu lote de hoje` e limite de WIP. | Atribuição de responsável. |
| Motivo estruturado. | Modal de devolução/rejeição com categoria e mensagem ao compositor. | Enum/registro de motivos. |
| Comparação de duplicidade. | Bloco de itens semelhantes antes da decisão. | Índice de título, áudio e compositor. |
| Progresso real da força-tarefa. | Meta semanal de 194/193 itens, itens encerrados e idade do backlog. | Eventos de transição. |
| Carregamento por módulo. | Skeleton apenas no card em consulta; resto do painel fica disponível. | Consultas independentes e erro parcial. |
| Atividade auditável. | Linha de evento com ator, ação, entidade e horário. | Tabela de eventos administrativos. |

## 11. Backlog de interface priorizado

### Interface P0 — entregar junto ou após a contenção técnica

| ID | Tarefa | Dependência | Critério de aceite |
|---|---|---|---|
| **UI-001** | Implementar estado global de disponibilidade, erro e retry por módulo. | TEC-P1-04 e TEC-P2-06. | Nenhuma página crítica usa vazio silencioso para falha de consulta. |
| **UI-002** | Reordenar topo da home por ações diárias. | Nenhuma. | Busca por número é o primeiro CTA do conteúdo. |
| **UI-003** | Criar busca agrupada por hino e destaque de resultado canônico. | TEC-P1-03. | Consulta por número chega à ficha certa em um clique. |
| **UI-004** | Construir segmentos da ficha unificada e estados desabilitados honestos. | TEC-P1-03 e TEC-P1-04. | Áudio, letra, cifra, partitura e versões coexistem na mesma ficha. |
| **UI-005** | Ajustar catálogo/hub de cifras para refletir o conteúdo realmente publicável. | TEC-P1-05. | Nenhum contador diz `0` quando há cifras publicáveis. |
| **UI-006** | Ocultar CTAs de player para coletâneas inválidas e cards sem faixas. | TEC-P1-04. | Todo play inicia mídia válida ou não aparece. |
| **UI-007** | Remover métricas artificiais dos três dashboards. | TEC-P2-03. | Sem `+0%`, seta positiva fixa ou ranking sem eventos. |
| **UI-008** | Reformular confirmação e status do onboarding de compositor. | TEC-P0-03, TEC-P1-01 e TEC-P1-08. | Compositor vê protocolo, status, SLA e motivo de pendência. |

### Interface P1 — hábito, ensaio e operação (semanas 3–8)

| ID | Tarefa | Dependência | Critério de aceite |
|---|---|---|---|
| **UI-009** | Entregar modo ensaio com fonte, rolagem e transposição. | TEC-P1-03 e TEC-P1-05. | Recurso funciona apenas em material verificado e salva preferência sem alterar obra pública. |
| **UI-010** | Consolidar `Sua biblioteca` em abas. | TEC-P1-01 e eventos de produto. | Favoritos, histórico e playlists são consistentes em outra sessão. |
| **UI-011** | Adicionar pedidos de cifra/partitura com status visível. | TEC-P1-08. | Pedido entra em fila, não cria promessa sem acompanhamento. |
| **UI-012** | Criar curadorias de coletâneas somente com faixas válidas. | TEC-P1-04. | Cada coletânea exibe faixas, duração e progresso corretos. |
| **UI-013** | Transformar a fila administrativa em área de trabalho de revisão. | TEC-P1-07 e TEC-P1-08. | Revisor filtra, assume lote, devolve e decide com trilha auditável. |
| **UI-014** | Corrigir dashboard de compositor e estados de gerente. | TEC-P1-09. | Sem carregamento infinito; sempre há próxima ação. |

### Interface P2 — diferenciação e escala (semanas 8–16)

| ID | Tarefa | Dependência | Critério de aceite |
|---|---|---|---|
| **UI-015** | Metrônomo, diagramas de acordes e atalhos de instrumento. | Estrutura de cifras e metadados musicais. | Ferramentas aparecem só quando os dados permitem uso correto. |
| **UI-016** | Correções comunitárias moderadas. | TEC-P1-08 e identidade de colaborador. | Sugestão mostra antes/depois, status e decisão editorial. |
| **UI-017** | Notificações Realtime de status, favoritos e revisão. | TEC-P2-01 e TEC-P2-02. | Usuário recebe apenas eventos que pode ler por RLS. |
| **UI-018** | Painéis com período, comparação e fonte de dados. | TEC-P2-03. | Cada métrica mostra janela temporal e estado `sem dados` quando necessário. |

## 12. Regras de priorização conjunta

A equipe não deve iniciar uma melhoria de interface se ela depende de dados ainda inseguros ou inexatos. A relação abaixo evita desperdício e preserva a credibilidade da plataforma.

| Não iniciar antes de… | Porque a interface ficaria enganosa |
|---|---|
| Perfil público de compositor antes da RLS/view mínima. | Pode expor PII e dados de verificação. |
| Upload visualmente refinado antes de Storage privado. | Melhoraria a aparência de um fluxo inseguro. |
| Analytics “bonito” antes de eventos reais. | Reproduziria os atuais `+0%` e métricas vazias. |
| Transposição em todas as cifras antes de validar cifra estruturada. | Geraria acordes incorretos e perda de confiança. |
| Player em qualquer álbum/coletânea antes da validação de faixas. | Manteria cards reproduzíveis sem mídia. |
| Notificações em tempo real antes de RLS e RPC de domínio. | Pode vazar evento e permitir spam/escrita indevida. |

## 13. Indicadores por frente

| Frente | Indicador | Sinal de sucesso |
|---|---|---|
| Técnica | Linhas privadas retornadas a `anon`. | Zero em `users`, documentos, notificações e playlists privadas. |
| Técnica | Itens de backlog com estado, motivo e responsável. | 100% dos 773 itens reconciliados e rastreáveis. |
| Técnica | Catálogos que falham silenciosamente. | Zero; toda falha tem log e estado parcial. |
| Técnica | Mutações críticas em homologação com rollback. | Todas validadas antes de produção. |
| Interface | Busca por número que abre ficha canônica em até um clique. | Crescimento semanal e queda de buscas repetidas. |
| Interface | Páginas que exibem formato sem material. | Zero; ausência sempre é explícita. |
| Interface | Ações de play/CTA sem efeito. | Zero em rotas auditadas. |
| Interface | Tempo até iniciar ensaio. | Menor número de passos entre busca e letra/cifra em modo foco. |
| Interface | Dashboard com dado simulado ou sem período. | Zero. |

## 14. Sequência recomendada para o primeiro ciclo de trabalho

A primeira sprint deve formar duas trilhas sincronizadas. A trilha técnica executa `TEC-P0-01` a `TEC-P0-07` e prepara `TEC-P1-07`; a trilha de interface implementa somente `UI-001`, `UI-002` e estados honestos de `UI-005`/`UI-006`, sem abrir novas promessas de catálogo. Após os testes RLS e a reconciliação da fila, a segunda sprint entrega a ficha canônica, busca agrupada e máquina de estados de moderação. O modo ensaio, a biblioteca unificada e dashboards analíticos entram somente quando a fonte de verdade estiver pronta.

> **Resultado esperado do ciclo inicial:** a plataforma torna-se segura para dados de usuário/compositor, deixa de mostrar conteúdo inexistente como disponível, responde corretamente à busca de um hino e passa a operar uma fila de revisão mensurável. A identidade visual permanece reconhecível; o ganho vem da precisão, do estado claro e da redução de passos.

## Referências de experiência

[3]: https://www.cifraclub.com.br/congregacao-crista-no-brasil/ "CCB – Congregação Cristã no Brasil | Cifra Club"

[4]: https://www.cifraclub.com.br/congregacao-crista-no-brasil/hino-115-minha-alma-engrandece/ "115 – Minha Alma Engrandece | Cifra Club"

[5]: https://support.spotify.com/us/article/web-player-help/ "Spotify Web Player Help"

[6]: https://support.spotify.com/us/article/lyrics/ "View Lyrics | Spotify Support"
