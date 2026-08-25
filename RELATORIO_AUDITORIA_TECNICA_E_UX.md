# Auditoria Técnica e de Experiência — Cânticos CCB

**Data da auditoria:** 13 de agosto de 2026
**Escopo:** plataforma publicada, preview local, revisão estática do repositório e benchmark funcional.
**Objetivo:** identificar falhas técnicas, riscos de segurança, lacunas de produto e oportunidades de experiência para usuários, compositores e administradores, **sem recomendar uma troca do layout ou da identidade visual atual**.

> **Conclusão executiva.** A Cânticos CCB tem uma base visual coerente, um player global promissor e uma proposta de nicho muito forte: consulta de hinos CCB sem a interrupção publicitária que prejudica a experiência em plataformas generalistas. A prioridade, porém, não é adicionar mais telas. É restaurar a confiança no acervo: garantir que cada hino canônico tenha dados corretos, que letras/cifras/partituras estejam presentes quando anunciadas, que gravações e coletâneas vazias não sejam publicadas e que os fluxos de compositor tratem dados pessoais de forma segura. Só então recursos de ensaio, personalização e curadoria terão efeito real de retenção.

## 1. Escopo, método e limites

A análise combinou a execução do projeto local, verificação de build, inspeção do código React/TypeScript e das migrações, navegação pública na versão publicada, leitura dos fluxos de cadastro e de compositor, além de comparação funcional com a Cifra Club e com referências oficiais de experiência do Spotify. Foram percorridos os caminhos de descoberta por número, página de hino, player, cifras, hinário, coletâneas, cadastro e onboarding de compositor.

| Dimensão | Cobertura realizada | Limitação relevante |
|---|---|---|
| Plataforma pública | Home, busca, detalhe de hino, player, cifras, hinário, coletâneas, cadastro e login na versão publicada. | Não foram submetidos cadastros, uploads ou mudanças de conteúdo. |
| Código e arquitetura | Rotas, guards, contexto de autenticação, camadas Supabase/REST, onboarding, sidebars e dashboards. | Políticas RLS efetivamente implantadas e segredos de produção não foram acessados. |
| Dashboards | Revisão funcional-estática de usuário, compositor e admin; teste de rota anônima para compositor. | A inspeção visual com dados reais exige contas de homologação para os três papéis. |
| Qualidade técnica | Build, type-check, lint e auditoria de dependências. | Não houve teste de carga, pentest autenticado, análise de rede móvel ou SAST completo. |
| Benchmark | Cifra Club para consulta e prática de cifras; documentação oficial do Spotify para player, biblioteca e letras. | As referências foram usadas como princípios funcionais, não como modelo visual a copiar. |

A versão local não continha as variáveis funcionais de Supabase. Por isso, os fluxos dependentes de sessão, escrita, papéis e dados privados não puderam ser reproduzidos fielmente no computador de desenvolvimento. Esse fato é, por si só, um achado técnico: um ambiente de homologação seguro e reproduzível é necessário antes de qualquer evolução de funcionalidades críticas.

## 2. Diagnóstico geral e prioridade

A plataforma não requer redesenho. O tema escuro, o contraste com verde, o menu lateral e a linguagem visual do player são ativos a preservar. Os problemas prioritários estão em **integridade do conteúdo**, **promessas de recursos não entregues**, **segurança do onboarding de compositor** e **métricas apresentadas sem dados reais**.

| Prioridade | Foco | Objetivo de negócio e experiência | Prazo sugerido |
|---|---|---|---|
| **P0 — bloquear risco e frustração** | Segurança, conteúdo vazio, letras/cifras anunciadas sem entrega e dashboards enganosos. | Recuperar confiança e eliminar risco operacional/LGPD. | 0–30 dias |
| **P1 — converter uso recorrente em hábito** | Ficha canônica de hino, busca por número, biblioteca, modo ensaio e curadoria. | Tornar a plataforma o atalho diário mais rápido para quem consulta e ensaia hinos. | 31–90 dias |
| **P2 — diferenciação sustentável** | Revisão comunitária moderada, dados avançados, preferência de tom/instrumento e notificações. | Aumentar profundidade de uso sem aumentar ruído ou complexidade. | 3–6 meses |

## 3. Pontos fortes a preservar

A home publicada estabilizou sem erros de console no navegador da auditoria e mantém linguagem visual consistente entre home, busca, detalhe de hino e autenticação. O player global aparece após reprodução e cria uma base adequada para continuidade de escuta. O cadastro comum é curto, a tela de login inclui recuperação de senha e o onboarding de compositor possui um indicador de progresso claro. A proteção de rota do dashboard de compositor redirecionou corretamente o visitante anônimo para login.

| Ativo atual | Por que preservar | Ajuste recomendado, sem redesign |
|---|---|---|
| Tema escuro com verde | Já associa a marca a foco e audição; funciona bem para leitura de conteúdo musical. | Elevar o contraste de estados secundários e padronizar o verde em CTAs factíveis. |
| Menu lateral | Dá acesso rápido a categorias de consumo. | Reordenar por intenção diária e reduzir destinos duplicados; não trocar o componente. |
| Player global | É a ponte natural entre streaming e material de estudo. | Acrescentar contexto da obra e atalhos de letra/cifra/partitura quando disponíveis. |
| Cadastro simples | Reduz barreira inicial. | Explicar benefícios reais e remover opções indisponíveis. |
| Onboarding com progresso | Bom padrão para processo de compositor. | Transformar as sete etapas em etapas produtivas, com salvamento e requisitos explícitos. |

## 4. Achados críticos de produto e conteúdo

O problema mais urgente é o desalinhamento entre a intenção do visitante e o que a plataforma entrega. O público procura principalmente um **hino canônico por número**, sua letra, cifra, partitura e versões de áudio. A busca por `450` retornou uma gravação e uma coletânea, mas a rota canônica `/hinario/450` informou que o hino não foi encontrado. Em um hino disponível no hinário, a página indicou “Letras dos hinos”, mas a letra não apareceu na renderização. As áreas de cifras publicadas exibiram contagens zero e nenhuma cifra disponível, apesar de serem destacadas como recurso central.

| ID | Severidade | Evidência observada | Correção recomendada |
|---|---|---|---|
| **FUNC-01** | Crítica | Catálogo e hub de cifras publicados com `0 cifras` e rotas por instrumento vazias. | Não promover cifras antes de existir um catálogo inicial verificado. Enquanto a cobertura for baixa, mostrar uma página honesta de cobertura, pedidos de hino e itens em preparação. |
| **FUNC-02** | Crítica | Página de hinário disponível sem letra renderizada. | Tornar a letra um requisito de publicação do item canônico ou substituir a página por estado explícito “letra em revisão”, nunca por vazio silencioso. |
| **DATA-06** | Alta | Busca encontra gravação 450, mas hinário canônico 450 não existe; cobertura aparente é parcial. | Criar uma entidade mestre `hino_canônico` que relacione número, título, hinário, letra, cifra, partitura e gravações. |
| **FUNC-03** | Alta | Coletânea retornada na busca tem `0 faixas`, `0 min` e botão de reproduzir. | Impedir publicação, busca, recomendação e reprodução de álbuns/coletâneas sem ao menos uma faixa válida. |
| **UX-09** | Alta | Detalhe de hino prioriza uma gravação, não a ficha completa da obra. | Redefinir o detalhe como ficha de hino com abas/segmentos para `Ouvir`, `Letra`, `Cifra`, `Partitura` e `Versões`. |
| **DATA-05** | Alta | Títulos e nomes apresentam erros como `Jeasus`, `Joas`, ausência de acentos e espaçamentos inconsistentes. | Implantar revisão editorial, normalização de Unicode, campos separados e bloqueio de publicação para metadados inválidos. |

A correção recomendada é estrutural, porém não visual: preservar o card, o tema e a navegação existentes, substituindo a origem dos dados por uma ficha canônica confiável. A partir dessa ficha, a busca deixa de apontar apenas para uma gravação e passa a responder à tarefa do usuário: “quero o hino 450”.

### Modelo mínimo de conteúdo recomendado

| Entidade | Campos essenciais | Regra de publicação |
|---|---|---|
| Hino canônico | número, título editorial, hinário/edição, letra, fonte, status. | Não publicar sem número, título e letra validada quando o item se apresentar como “hinário”. |
| Representação musical | tipo: áudio, cifra, partitura, instrumental, vídeo; instrumento; tom; versão; arquivo/referência. | Publicar apenas se houver arquivo/URL válida e metadados mínimos. |
| Gravação | intérprete, álbum/coletânea, duração, capa, fonte, disponibilidade. | Duração maior que zero e mídia verificável antes de entrar em busca/recomendação. |
| Coletânea/álbum | título, capa, descrição editorial, curadoria, faixas, duração calculada. | Pelo menos uma faixa publicada; proibir descrições de placeholder. |
| Correção sugerida | campo corrigido, antes/depois, justificativa, colaborador, status da revisão. | Toda alteração depende de moderação e gera trilha de auditoria. |

## 5. Jornada do usuário comum

A home apresenta grande quantidade de cartões e seções. Ela é boa para exploração, mas não para a consulta rápida e recorrente que caracteriza o público de hinos. O usuário precisa encontrar rapidamente número, letra, cifra, partitura, instrumental ou coletânea, sem procurar em uma página longa. A busca global tem boa amplitude, mas o resultado ainda não agrupa os conteúdos por obra canônica.

| Etapa da jornada | Problema | Melhoria sem alterar o layout base |
|---|---|---|
| Entrada na home | Muitos blocos aparecem antes dos atalhos de tarefa. | No topo do conteúdo, incluir uma faixa compacta de ações: `Buscar por número`, `Abrir hinário`, `Cifras`, `Partituras`, `Continuar ensaio`. |
| Busca | Campo duplicado e resultado focado em itens individuais. | Na rota de busca, tornar o campo principal dominante e agrupar por hino; abaixo, listar versões e formatos disponíveis. |
| Detalhe do hino | Áudio, letra, cifra e partitura não aparecem como uma experiência única. | Criar abas no corpo já existente; manter o player global e os cards de recomendação abaixo. |
| Hinário | Cobertura e significado de contagens não estão claros. | Exibir “X de Y hinos disponíveis”, edição do hinário e chips como `letra`, `cifra`, `partitura`, `áudio`. |
| Biblioteca pessoal | Favoritos, histórico e playlists estão fragmentados. | Consolidar `Sua biblioteca` em uma rota com abas: `Favoritos`, `Últimos ouvidos`, `Playlists`, `Seguindo` e `Downloads`, quando aplicável. |
| Cadastro | A proposta de valor é genérica e o botão Google pode não funcionar. | Comunicar benefícios concretos e esconder ou rotular alternativas indisponíveis até a integração estar ativa. |

### Recursos de maior impacto para experiência diária

| Recurso | Prioridade | O que entrega ao usuário | Dependência |
|---|---|---|---|
| **Ficha canônica de hino** | P0 | Um único lugar para letra, cifra, partitura, áudio e versões. | Modelo de conteúdo e saneamento do catálogo. |
| **Busca por número com resposta agrupada** | P0 | Resultado previsível para “Hino 450”, com todos os formatos. | Índice do hino canônico. |
| **Modo ensaio** | P1 | Fonte ampliada, rolagem ajustável, transposição e tela focada. | Cifras verificadas e rota imersiva existente. |
| **Continuar ensaio** | P1 | Retoma último hino, posição de leitura e tom escolhido. | Histórico autenticado e consentimento do usuário. |
| **Favoritos e playlists confiáveis** | P1 | Organização por culto, ensaio, instrumento e repertório pessoal. | Fonte de verdade única no backend. |
| **Pedidos de cifra/partitura** | P1 | Canaliza demanda quando o acervo ainda é incompleto. | Fila administrativa e status visível. |
| **Curadoria de coletâneas** | P1 | Acesso simples a faixas como “1–120”, “426–450”, instrumentais e repertórios de ensaio. | Validação de faixas antes de publicação. |

## 6. Recursos de cifras e estudo: benchmark adaptado

A Cifra Club oferece ao detalhe de cifra controles de tom, rolagem, tela cheia, instrumento, capotraste, afinação, tablaturas, diagramas, texto, batidas, afinador e metrônomo. Ela também dá sinais claros de formatos, tom e popularidade no catálogo de CCB. Essas escolhas explicam por que a referência é forte para prática musical, mas a experiência observada inclui grandes áreas publicitárias que interrompem a leitura. [1] [2]

A diferenciação da Cânticos CCB não é replicar todas as ferramentas. É entregar as poucas ferramentas decisivas em um contexto CCB, com acervo correto e **sem interromper cifra, letra, partitura ou áudio com publicidade intrusiva**.

| Recurso inspirado no benchmark | Decisão recomendada | Detalhe de implementação e UX |
|---|---|---|
| Transposição | Implementar em P0 nas cifras verificadas. | Controle discreto `− / tom / +`; salvar preferência por usuário, sem mudar a cifra pública original. |
| Rolagem e tamanho de fonte | Implementar em P0. | Modo ensaio com velocidade, pausa, fonte grande, alto contraste e tela sempre ativa opcional. |
| Alternância por formato | Implementar em P0. | `Ouvir`, `Letra`, `Cifra`, `Partitura` na mesma ficha de hino; modo indisponível fica claro, sem link quebrado. |
| Metrônomo | Implementar em P1. | BPM/compasso quando dados existirem; permitir ajuste manual e não obrigar uso. |
| Diagramas de acordes | Implementar em P1. | Mostrar apenas em cifras verificadas e para instrumentos efetivamente suportados. |
| Correções comunitárias | Implementar em P1. | Botão “Sugerir correção”, comparação de versões, status e publicação somente após moderação. |
| Download/impressão | Avaliar depois de direitos e fonte. | Disponibilizar apenas para materiais com licença/autoridade verificadas; incluir marcação de versão e data. |

## 7. Onboarding e área de compositor

O onboarding de compositor promete publicação, analytics e proteção de direitos, mas coleta nome, e-mail, senha, telefone, endereço residencial completo, redes sociais e imagens de documento. Há sete etapas; a primeira repete benefícios da landing em vez de iniciar a coleta essencial. A página pública de publicação também é excessivamente curta para um processo que envolve direitos autorais, análise e possível envio de documento.

| ID | Severidade | Risco ou fricção | Recomendação |
|---|---|---|---|
| **PRIV-01 / PRIV-04** | Alta | Documento pode ser convertido em Base64 e persistido como fallback; número e imagem de documento são tratados no cliente. | Proibir fallback Base64 em banco comum. Usar armazenamento privado, criptografia, URL assinada curta, log de acesso e referência de arquivo no banco. |
| **PRIV-02** | Alta | Endereço residencial completo é obrigatório, sem finalidade evidente na experiência pública. | Aplicar minimização: coletar somente país/UF/cidade se necessário; pedir endereço completo apenas quando houver obrigação formal, com finalidade e retenção explícitas. |
| **SEC-04 / SEC-08** | Alta | Cliente faz upsert de usuário, promove `is_composer` e cria perfil/documentos. | Mover criação, mudança de papel, validação e documentos para função/serviço server-side autorizado, transacional e auditável. |
| **SEC-07** | Alta | Busca por e-mail pode enumerar usuários e expor dados para vincular gerente. | Endpoint neutro, rate limit e convite por e-mail sem revelar nome/avatar antes do aceite. |
| **UX-19 / UX-20** | Média | Processo de sete etapas não informa documentos, prazo, elegibilidade nem aprovação. | Landing com requisitos e prazo; onboarding começa diretamente em dados de perfil; oferecer salvar rascunho. |
| **UX-26** | Média | Confirmação não informa protocolo, análise, status ou próximo passo. | Exibir confirmação com protocolo, prazo estimado, status “em revisão”, suporte e aviso de e-mail. |

### Fluxo de compositor recomendado

| Passo | Conteúdo | Regra |
|---|---|---|
| 1. Elegibilidade | Requisitos de conteúdo, direitos, documentos e prazo. | Pode ser lido sem login. |
| 2. Conta e perfil | Autenticação, nome artístico, biografia, tipo de perfil. | Salvar rascunho após login. |
| 3. Dados de publicação | Créditos, gênero CCB, instrumentos e contato profissional. | Validar formatação e duplicidade com resposta segura. |
| 4. Verificação | Apenas dados realmente necessários, com finalidade e retenção. | Upload privado, revisão por papel administrativo específico. |
| 5. Confirmação | Termos, protocolo e situação da análise. | Nenhum privilégio de compositor antes da aprovação. |
| 6. Primeiro hino | Assistente para metadados, arquivo, letra, cifra e direitos. | Publicar somente após validações e moderação. |

## 8. Auditoria dos dashboards

A navegação visual autenticada dos dashboards permaneceu pendente de contas de teste, mas a revisão do código demonstrou limitações que devem ser tratadas antes de ampliar as promessas da interface. O ponto comum é a existência de cards e indicadores de aparência completa cuja fonte de dados é incompleta, simulada ou zerada.

### 8.1 Dashboard de usuário

| Achado | Impacto | Ação recomendada |
|---|---|---|
| Playlists podem gerar faixas artificiais com título, artista, capa e duração vazios a partir de um contador. | Card aparenta ser reproduzível sem dados suficientes e pode divergir entre dispositivos. | Usar API única como fonte de verdade; renderizar card de playlist sem faixas até carregar dados reais. |
| “Horas ouvidas” e “Seguidores” aparecem como indicadores apesar da camada de dados devolver zero. | Métrica vazia reduz o valor percebido do perfil. | Ocultar até haver coleta real ou trocar por “Favoritos”, “Playlists” e “Hinos ouvidos”. |
| Botões de play nos cards de playlist não têm ação conectada. | A interface promete interação que não acontece. | Conectar ao player ou remover temporariamente o botão visual. |
| Biblioteca está distribuída em múltiplas rotas. | O usuário não percebe um centro pessoal completo. | Reunir a área pessoal em “Sua biblioteca”, mantendo a sidebar atual. |

### 8.2 Dashboard de compositor

| Achado | Impacto | Ação recomendada |
|---|---|---|
| Plays, receita, downloads, ouvintes mensais e diversas tendências são inicializados em zero; destaque recebe tendência fixa positiva. | Pode criar interpretação errada de performance e desconfiança no compositor. | Exibir somente métricas coletadas; usar “sem dados para este período” e remover setas até comparação real. |
| Países principais usam placeholder “Sem dados ainda”. | Espaço de painel é consumido por bloco sem valor operacional. | Ocultar a seção até o endpoint existir ou substituí-la por métricas já disponíveis. |
| Notificação realtime de seguidores está desabilitada no código. | Diverge da promessa de atualização em tempo real. | Reativar com política de reconexão/permite ou ajustar o texto do produto. |
| Sidebar fecha todas as seções não ativas. | Dificulta alternar entre upload, catálogo e analytics no trabalho diário. | Permitir múltiplas seções expandidas ou manter “Conteúdo” e “Painel” fixas. |

### 8.3 Dashboard administrativo

| Achado | Impacto | Ação recomendada |
|---|---|---|
| Todos os cards apresentam `+0%` com seta positiva. | Induz leitura de tendência mesmo sem série histórica. | Trocar por “sem comparação disponível” e somente exibir crescimento calculado contra período anterior. |
| Três consultas bloqueiam a tela integral durante loading. | Lentidão/falha parcial torna o dashboard inteiro indisponível. | Carregar cards de modo independente, com skeleton por módulo, retry e timestamp real. |
| Atividade recente é uma composição simplificada de novos usuários/hinos, não uma trilha de eventos robusta. | Administração pode confundir resumo com auditoria. | Criar tabela de eventos administrativos/produto com ator, ação, entidade, IP/metadata mínima e retenção definida. |
| Menu possui mais de 40 destinos e atualiza três badges por polling a cada 30 s. | Sobrecarga cognitiva e chamadas repetidas em todas as telas. | Agrupar configurações, marketing e ferramentas em categorias secundárias; usar endpoint de contagens em lote e atualização sob demanda/realtime. |

## 9. Segurança, privacidade e qualidade de engenharia

A análise estática identificou riscos que devem ser tratados antes de expandir cadastro de compositores ou permitir operações administrativas remotas. A existência de uma função SQL `SECURITY DEFINER` de registro de compositor concedida a `anon` é especialmente sensível: se ela estiver aplicada em produção, precisa de verificação e revogação/reestruturação imediatas. Como a auditoria não acessou o banco de produção, ela é classificada como **crítica a confirmar**, e não como exploração comprovada.

| ID | Severidade | Evidência técnica | Próximo passo seguro |
|---|---|---|---|
| **SEC-01** | Crítica a confirmar | Contexto de autenticação cria sessão de contingência no navegador após erro de autenticação e consulta usuário por e-mail. | Remover fallback de autorização client-side; qualquer sessão deve ser validada pelo provedor e pelas políticas de banco. |
| **SEC-06** | Crítica a confirmar | Migração define função `SECURITY DEFINER` para criar usuários e concede execução a `anon`. | Inventariar funções ativas em produção, revogar execução anônima, usar Auth oficial + serviço server-side com rate limit e CAPTCHA. |
| **SEC-02 / SEC-03** | Alta | Camada REST cliente expõe inserção, upsert, deleção e RPC com chave anônima. | Revisar RLS tabela por tabela e RPC por RPC; exigir `auth.uid()` e validar propriedade/role no servidor. |
| **DEP-01** | Alta | `npm audit` reportou 4 alertas altos na cadeia `pwa-asset-generator → puppeteer-core → @puppeteer/browsers → extract-zip`; advisory de path traversal em `extract-zip` tem CVSS 8,1. [5] | Atualizar/remover a dependência em branch separada, regenerar ativos PWA e validar build antes de deploy. |
| **ENV-01** | Alta | Preview local não possui variáveis Supabase ativas. | Criar ambiente de homologação com projeto Supabase separado, chaves não produtivas, dados sintéticos e documentação de setup. |
| **QA-01** | Média | Build e type-check aprovam; lint falha por configuração de parser TypeScript/TSX. | Corrigir ESLint, ativar CI com type-check, lint, build, auditoria de dependência e testes de rota. |

A política de dados deve tratar documentos de identidade como categoria de alto risco operacional. A implementação recomendada é separar PII de conteúdo público, limitar quem pode revisar, registrar todo acesso, definir retenção/exclusão e evitar completamente documentos em Base64 em tabelas de aplicação. A aprovação de compositor não deve conceder o papel por uma mutação disparada pelo cliente.

## 10. Roadmap de implementação sugerido

O roadmap abaixo privilegia a redução de risco e a melhoria percebida sem ruptura visual. Nenhuma fase depende de substituir React, Vite, o tema ou o menu lateral.

| Fase | Janela | Entregas | Critério de aceite |
|---|---|---|---|
| **Estabilização do acervo** | Semanas 1–2 | Bloquear conteúdo vazio; corrigir letra/hinário; normalizar títulos; remover CTAs inoperantes; esclarecer cobertura de cifras. | Nenhum álbum com 0 faixas é público; todos os hinos de hinário publicados exibem letra; não há botão que leve a recurso vazio sem aviso. |
| **Segurança e homologação** | Semanas 1–4 | Revisão de RLS/RPC, remoção de fallback de privilégios, fluxo seguro de compositor, storage privado de documentos, ambiente de homologação. | Matriz de permissões aprovada; mutation crítica só ocorre server-side; contas de teste disponíveis por papel. |
| **Ficha de hino e busca canônica** | Semanas 3–6 | Entidade mestre de hino, busca por número, abas de formatos, status de disponibilidade e ligação com versões. | “Hino 450” retorna uma ficha consistente, com todos os formatos existentes e ausência explícita do que ainda não existe. |
| **Biblioteca e modo ensaio** | Semanas 6–10 | Biblioteca unificada, retomar último ensaio, fonte/rolagem, transposição e favoritos confiáveis. | Usuário logado consegue salvar e retomar um hino sem inconsistência entre sessões. |
| **Compositor e moderação** | Semanas 8–12 | Guia de publicação, rascunho, protocolo de aprovação, fila de revisão de cifras/partituras e direitos. | Compositor entende requisitos, status e próxima ação; admin aprova sem acesso amplo a dados desnecessários. |
| **Analytics confiável** | Semanas 10–16 | Eventos, métricas por período, dashboards com estados de ausência e carregamento parcial. | Nenhum card apresenta tendência ou métrica sem fonte e período comparativo. |

## 11. Métricas de sucesso sugeridas

A plataforma deve medir melhoria de experiência, e não apenas pageviews. Abaixo estão indicadores que podem ser implementados com dados pseudonimizados e consentimento apropriado.

| Objetivo | Métrica | Sinal de sucesso |
|---|---|---|
| Encontrar um hino | Taxa de busca por número que abre uma ficha canônica em até um clique. | Crescimento semanal após lançamento da busca agrupada. |
| Entregar material de estudo | Percentual de hinos acessados com letra, cifra ou partitura realmente disponível. | Aumento progressivo da cobertura e queda de páginas vazias. |
| Retenção | Sessões com “continuar ensaio” e retorno em 7/30 dias. | Usuário volta para hino salvo/recente, não reinicia a busca do zero. |
| Qualidade do acervo | Taxa de publicação bloqueada por metadado/mídia inválida e tempo de correção editorial. | Menos erros públicos sem paralisar a curadoria. |
| Experiência de compositor | Abandono por etapa, prazo de análise e aprovação sem suporte manual. | Redução de abandono antes do envio e mais clareza de status. |
| Confiabilidade operacional | Percentual de cards de dashboard com fonte real e janela temporal identificada. | Eliminação de `0%`/setas artificiais e de painéis inteiros bloqueados. |

## 12. Decisões recomendadas para o produto

A Cânticos CCB deve posicionar-se como a referência CCB para **consulta sem ruído**, não como uma cópia de um serviço de streaming ou de um portal generalista de cifras. Isso significa priorizar uma jornada curta e confiável: digitar o número do hino, abrir uma ficha completa, ler/tocar/ensaiar e salvar para o próximo culto ou ensaio. A ausência de propaganda intrusiva é um diferencial válido, mas somente se for acompanhada por velocidade, precisão editorial e transparência quando um formato ainda não estiver disponível.

O primeiro marco de produto deve ser: **“todo hino publicado no hinário é consultável, tem letra correta e mostra exatamente quais materiais estão disponíveis.”** O segundo marco deve ser: **“o músico consegue abrir uma cifra verificada, transpor, aumentar a fonte, rolar e continuar ouvindo sem sair da experiência.”** Depois disso, biblioteca, curadoria e o painel de compositor passam a ter base suficiente para gerar hábito e contribuição de qualidade.

## Referências

[1]: https://www.cifraclub.com.br/ "CCB – repertório CCB | Cifra Club"

[2]: https://www.cifraclub.com.br/ "115 – Minha Alma Engrandece | Cifra Club"

[3]: https://support.spotify.com/us/article/web-player-help/ "Spotify Web Player Help"

[4]: https://support.spotify.com/us/article/lyrics/ "View Lyrics | Spotify Support"

[5]: https://github.com/advisories/GHSA-jmr9-qjv8-65gv "extract-zip unvalidated symlink path traversal"

---

**Próxima validação recomendada:** disponibilizar contas de teste de usuário, compositor aprovado e administrador em homologação. Com isso, a auditoria pode executar os testes visuais autenticados, validar o comportamento real de permissões e transformar os achados estáticos dos dashboards em evidências reproduzíveis por fluxo.
