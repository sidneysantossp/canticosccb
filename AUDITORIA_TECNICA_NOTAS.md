# Notas de Auditoria Técnica — CanticosCCB

> Documento de trabalho. As conclusões serão validadas pela execução local e pela navegação nos fluxos solicitados antes da entrega final.

## Evidências de arquitetura

| Item | Evidência observada | Implicação inicial |
|---|---|---|
| Frontend | React 18, TypeScript, Vite 6 e React Router 7 (`package.json`) | Aplicação SPA; a navegação e a indexação dependem de roteamento e SEO no cliente. |
| Dados e autenticação | Supabase JS + camada REST própria (`src/lib/supabaseRest.ts`) | Há duas vias de dados/autorização que precisam permanecer coerentes. |
| Domínios funcionais | Rotas públicas, área do usuário, compositor e grande painel administrativo (`src/App.tsx`) | Superfície de teste ampla; requer amostragem por tarefa crítica e não apenas revisão de tela. |
| Áudio | Howler e provedor global de player (`package.json`, `src/App.tsx`) | O teste precisa verificar continuidade de áudio, mídia indisponível e ações enquanto navega. |
| Conteúdo | Hinos, cifras, hinário, álbuns, playlists, compositores, coleções e instrumentos (`src/App.tsx`) | A descoberta deve ser analisada por intenção: número do hino, título, instrumento, álbum e compositor. |

## Achados preliminares — sujeitos à confirmação

| ID | Severidade preliminar | Evidência | Risco ou impacto provável | Validação pendente |
|---|---|---|---|---|
| SEC-01 | Crítica | `src/contexts/AuthContext.tsx`, linhas 405–457, cria uma sessão de contingência no navegador após erro 500 do provedor de autenticação e carrega dados de `users` por e-mail. | Uma autorização baseada em dados recuperados pelo cliente e armazenados localmente é frágil; se políticas RLS estiverem permissivas, pode haver elevação indevida de privilégios ou acesso sem sessão JWT válida. | Inspecionar políticas ativas e testar apenas em ambiente local controlado. |
| SEC-02 | Alta | `src/lib/supabaseRest.ts`, linhas 353–425 e 493–519, expõe operações públicas de inserção, upsert e exclusão com chave anônima. | Essas funções só são aceitáveis em tabelas com RLS estrita e validação no servidor; seu uso indevido pode permitir alteração de dados, fraude em métricas ou spam. | Mapear todos os chamadores e políticas RLS por tabela. |
| SEC-03 | Alta | `src/lib/supabaseRest.ts`, linhas 614–641, chama RPC com cabeçalhos anônimos. | Funções RPC devem validar `auth.uid()` e não confiar em parâmetros fornecidos pelo cliente. | Identificar as RPCs e revisar a definição SQL. |
| REL-01 | Alta | `src/lib/supabaseRest.ts`, linhas 10–24 e 226–230, retorna catálogo de emergência imediatamente para páginas públicas. | O usuário pode enxergar conteúdo desatualizado ou divergente do banco mesmo quando o serviço está disponível; isso prejudica confiança, busca, favoritos e compartilhamentos. | Validar comportamento e comunicação no preview. |
| REL-02 | Média | Cache em memória de dois minutos (`src/lib/supabaseRest.ts`, linhas 31–34) e invalidação distribuída. | Risco de dados defasados após operações editoriais e inconsistência entre páginas. | Testar propagação de alterações nos painéis. |
| UX-01 | Média | `ProtectedRoute` devolve `null` enquanto carrega (`src/components/ProtectedRoute.tsx`, linhas 18–21). | Rotas protegidas podem apresentar tela vazia, sobretudo em rede lenta, gerando sensação de falha. | Confirmar no preview com throttling/primeiro acesso. |
| UX-02 | Média | `ProtectedComposerRoute` tem verificação remota antes de renderizar (`src/components/ProtectedComposerRoute.tsx`, linhas 18–65). | Um compositor pode enfrentar bloqueio ou espera visível por indisponibilidade da API; fluxo deve ter estado de erro e rota de suporte. | Testar no preview e revisar mensagens. |
| PROD-01 | Média | Há itens assumidamente incompletos: fila do player, reprodução de álbum, integração de cupons, playlists e estatísticas (`grep` estático). | Recursos exibidos podem não cumprir a expectativa e criam dívida de confiança. | Validar se os controles são expostos ao usuário e priorizar correção/ocultação honesta. |

## Escopo de validação a seguir

A próxima etapa executará o ambiente, verificará compilação, lint, dependências, erros de console e o comportamento de carregamento. Em seguida, serão percorridos os fluxos de usuário, compositor e administrador, seguidos de benchmarking de experiência contra os concorrentes indicados.

## Evidências do preview local — página inicial

O preview iniciou em `http://127.0.0.1:5173/` e respondeu com HTTP 200. A tela inicial estabilizou após a animação inicial, com menu lateral, busca global, banner de entrada, blocos de hinos recentes, cantados, tocados e avulsos. A página é longa, com aproximadamente 2.580 px além da primeira viewport no ambiente de teste.

| ID | Severidade preliminar | Evidência no preview | Impacto na experiência |
|---|---|---|---|
| UX-03 | Média | A página inicial carrega um volume muito alto de cartões de conteúdo antes de explicitar os principais atalhos por intenção (hino por número, cifra por instrumento, coletânea/álbum e partitura). | A descoberta é visualmente rica, mas a tarefa diária do usuário recorrente pode exigir mais esforço de varredura do que o necessário. |
| UX-04 | Média | A busca é global e descreve bem as entidades pesquisáveis; porém o menu principal contém muitos destinos em um painel vertical estreito. | Em desktop, a navegação apresenta boa cobertura, mas a hierarquia entre "Hino", "Cifra", "Hinário", "Álbuns/Coletâneas" e "Partituras" ainda precisa ser avaliada pela jornada completa. |
| DATA-01 | Média | Os itens públicos exibem títulos e metadados com normalização inconsistente, por exemplo ausência de acentos e sufixos numéricos em nomes de compositor. | Afeta confiança editorial, legibilidade, filtragem e SEO. Pode ser corrigido no tratamento de metadados, sem alterar o layout. |
| DATA-02 | Média | Um cartão de hino recente apresenta duração `0:00`. | Usuário pode iniciar uma reprodução que não existe ou falha sem explicação; é preciso estado explícito para áudio pendente/indisponível e validação no cadastro. |
| PERF-01 | Média | A página renderiza um estado de carregamento em tela cheia antes de disponibilizar a interface. | A transição deve ser medida em rede móvel; excesso de bloqueio global pode piorar a percepção de velocidade. |

## Linha de base automatizada

| Verificação | Resultado | Leitura inicial |
|---|---:|---|
| `npm run type-check` | Aprovado | Tipos TypeScript são compiláveis no estado atual. |
| `npm run build:check` | Aprovado | O bundle de produção é gerado sem falha de compilação. |
| `npm run lint` | Falhou | A configuração do ESLint não está interpretando módulos TypeScript/TSX; o relatório produz erros de parser em praticamente todos os arquivos, portanto não exerce função de controle de qualidade. |
| `npm audit --omit=dev` | Executado sem vulnerabilidades de produção relatadas pelo comando | O resultado não substitui revisão de lógica, RLS e configuração de plataforma. |

> A falha de lint é de **configuração de ferramenta**, não uma prova de erro sintático nos arquivos, pois o type-check e o build foram concluídos com sucesso. Mesmo assim, ela impede detectar regressões de qualidade automaticamente.


## Observação de ambiente

O preview local foi iniciado sem `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. O console confirmou que as chamadas diretas ao Supabase retornam vazio nesse cenário. Os arquivos alternativos de ambiente versionados contêm configuração de API/Firebase, mas não fornecem essas variáveis de Supabase. Por isso, testes que dependem de sessão, papéis, escrita e dados privados não podem ser concluídos com fidelidade no preview local atual.

A versão publicada em `https://www.canticosccb.com.br/` apresenta a mesma página pública e o mesmo conteúdo inicial observado no preview. Assim, os fluxos públicos serão validados diretamente nela em modo de leitura; ações de escrita, cadastro definitivo, publicação ou alteração administrativa não serão submetidas.

| ID | Severidade preliminar | Evidência | Impacto |
|---|---|---|---|
| ENV-01 | Alta | O ambiente de desenvolvimento não possui configuração Supabase funcional, enquanto o app contém fluxos críticos de autenticação, perfis e dashboards dependentes desse serviço. | A equipe não consegue reproduzir localmente, com fidelidade, parte relevante do produto nem testar regressões de permissões sem configuração segura de homologação. |
| ENV-02 | Média | Arquivos de configuração alternativos foram versionados (`.env.local.new` e `.env.local.new2`) e parecem ser legado de Firebase/API, mas não suprem a stack ativa de Supabase. | Sinaliza migração incompleta e aumenta a chance de configurações divergentes entre desenvolvedores e produção. |


## Linha de base na versão publicada

A página inicial publicada estabiliza sem erros de console no navegador de auditoria. Ela adiciona um banner de novidades e uma seção extensa de álbuns recomendados em comparação ao preview local. A renderização visual é consistente com a marca atual — tema escuro, acento verde e navegação lateral — e não há recomendação de troca de layout base.

| ID | Severidade preliminar | Evidência | Impacto |
|---|---|---|---|
| UX-05 | Média | A home publicada contém banner, recentes e uma grande sequência de álbuns recomendados, ultrapassando 3.700 px após a primeira viewport. | A página atende exploração, mas torna o acesso diário ao conteúdo instrumental/cifra/hinário mais lento; recomenda-se priorizar atalhos orientados à tarefa, não um redesenho. |
| DATA-03 | Média | O catálogo público apresenta nomes de álbuns com grafia ou curadoria inconsistente, incluindo títulos pouco descritivos e uso de "Desconhecido" como autoria. | Para um acervo religioso de consulta recorrente, a qualidade editorial do metadado impacta busca, credibilidade e recomendações. |
| QA-01 | Baixa | Não houve erro de console na home publicada após a estabilização. | Indica que o fluxo público básico está operacional no ambiente público, embora não valide sessões nem mutações. |


## Jornada pública — busca por número de hino

A busca por `450` retornou um hino e um álbum associado. O campo global de busca oferece sugestões imediatas e a página possui filtros por tipo de entidade.

| ID | Severidade preliminar | Evidência | Impacto |
|---|---|---|---|
| UX-06 | Média | O mesmo campo de busca aparece no cabeçalho e novamente na página, concorrendo visualmente com a área de resultados. | Há duplicidade de foco e espaço; ao entrar em busca, a barra do cabeçalho pode se tornar apenas um disparador/atalho, deixando a busca de página como campo dominante. |
| UX-07 | Média | A busca por número encontra uma gravação intitulada `Hino 450`, mas não demonstra de imediato o item canônico do hinário, letra, cifra e partitura como opções integradas. | O visitante pode encontrar uma versão específica sem perceber que existem outras representações do mesmo hino; a resposta ideal deve agrupar por obra/hino canônico e oferecer abas de letra, cifra, partitura e gravações. |
| UX-08 | Baixa | A página mostra estado de carregamento de resultados antes da estabilidade. | Deve usar skeletons no espaço dos resultados e preservar resultados anteriores durante refinamentos, reduzindo a sensação de quebra. |
| DATA-04 | Média | O resultado de álbum traz `Coletania` sem acento. | O mecanismo de normalização deve preservar apresentação editorial em todos os campos, independentemente do slug de busca. |


## Jornada pública — detalhe de hino e player

O detalhe do resultado `Hino 450` abre corretamente e a ação de reprodução exibe o player global. A página concentra recomendações de outras faixas do mesmo artista, além de links de contexto para cifras, categoria e hinos cantados.

| ID | Severidade preliminar | Evidência | Impacto |
|---|---|---|---|
| UX-09 | Alta | No detalhe de um hino canônico, a tela prioriza uma gravação específica e recomenda outras faixas; não apresenta letra, tonalidade, cifra, partitura, número canônico ou versões como conteúdo principal. | Para o objetivo do público — consultar hinos CCB diariamente — isso cria um desvio de tarefa: o usuário chega à gravação, não à ficha completa da obra. |
| UX-10 | Média | O player global apareceu após clique e mantém controles de fila, repetição e favorito. | É uma boa base semelhante a serviços de streaming; faltam, contudo, indicadores mais claros de fonte, disponibilidade e próxima faixa para transmitir confiança no acervo. |
| DATA-05 | Alta | A lista de sugestões contém erros editoriais visíveis, como `Jeasus`, `Joas`, ausência de acentos e espaçamento irregular após o número do hino. | Erros em títulos religiosos reduzem a qualidade percebida e contaminam busca, SEO, links e possíveis cifras/partituras relacionadas. |
| UX-11 | Média | O CTA `Explorar cifras CCB` está presente, mas é um link secundário em uma linha de ações de contexto. | O acesso a cifras deveria ter primazia quando houver cifra disponível, por exemplo em uma aba ou bloco principal da ficha de hino. |


## Jornada pública — cifras

O catálogo geral e o hub de cifras de hinos estão publicados e indexáveis, mas ambos informam `0 cifras` ou `Nenhuma cifra disponível`. As três rotas por instrumento também exibem cobertura zero.

| ID | Severidade preliminar | Evidência | Impacto |
|---|---|---|---|
| FUNC-01 | Crítica de produto | O principal recurso anunciado no banner inicial — cifras — está acessível por várias rotas, mas não possui conteúdo publicado. | Cria uma promessa não cumprida na jornada principal e deixa a plataforma vulnerável frente ao concorrente especializado em cifras. A prioridade deve ser publicar um catálogo inicial consistente antes de ampliar landing pages. |
| UX-12 | Alta | O hub exibe textos institucionais e FAQ afirmando que há navegação para cifras individuais e por instrumento, porém todos os contadores estão em zero. | A página parece pronta para SEO, mas não para a necessidade imediata do usuário. Recomendação: quando não houver acervo, converter o hub em uma lista de "cifras em preparação", coletar pedidos e destacar repertório prioritário. |
| CONTENT-01 | Média | Há divergências de escrita em títulos/FAQ, como `Violao`, `voce` e `paginas` sem acentuação. | O conteúdo de apoio deve receber a mesma revisão editorial do catálogo e do SEO, preservando o layout atual. |


## Jornada pública — hinário

A rota direta `/hinario/450` mostra `Hino não encontrado`, embora a busca global encontre uma gravação com esse número. A listagem `/hinario` funciona e exibe apenas um subconjunto de números, com filtros de Hinário 5 e 4. Os cartões exibem contagem `0` sem rótulo visível de significado.

| ID | Severidade preliminar | Evidência | Impacto |
|---|---|---|---|
| DATA-06 | Alta | O número 450 é buscável como gravação, mas não existe como entrada do hinário; a lista contém apenas parte do repertório esperado. | A relação entre obra canônica, hinário e gravações está incompleta ou dissociada. Usuários que procuram pelo número tradicional encontram um caminho inconsistente. |
| UX-13 | Média | O hinário oferece filtro e busca local, mas não apresenta claramente cobertura total, últimas atualizações, letra/partitura disponível ou versão do hinário. | O usuário não sabe se o acervo é completo nem o que encontrar em cada cartão. |
| UX-14 | Baixa | A contagem `0` aparece em cada cartão sem legenda visual. | É ruído cognitivo e deve ser substituído por informação útil, como "0 gravações", ou ocultado quando zerado. |
| DATA-07 | Média | Alguns títulos de hinário incluem a autoria/intérprete no próprio título enquanto outros não. | O modelo de dados deve separar título canônico, número, autoria/compositor, versão e gravação; isso melhora busca e evita duplicação textual. |


## Jornada pública — leitura do hinário e coletâneas

Um item disponível do hinário (`/hinario/1`) abre uma página com título, autoria e atalhos para áudio, cifras e navegação anterior/próxima, porém não exibe a letra na renderização observada. A coletânea retornada pela busca (`Coletania 426 a 450`) abre com zero faixas e duração zero, mesmo sendo apresentada como resultado associado ao hino 450.

| ID | Severidade preliminar | Evidência | Impacto |
|---|---|---|---|
| FUNC-02 | Crítica de produto | A página do Hinário 1 anuncia "Letras dos hinos", mas a letra não é apresentada na renderização observada. | O recurso mais básico de consulta deixa de ser entregue. Deve ser validado e corrigido antes de campanhas de aquisição ou SEO para hinário. |
| UX-15 | Média | A página possui controle para trocar o número e aumentar/diminuir fonte, mas mostra `/ 28`, embora links institucionais indiquem repertório até 480. | A navegação sequencial e a cobertura do acervo parecem incoerentes; é necessário expor a fonte e o total real do catálogo. |
| FUNC-03 | Alta | Um álbum recomendado/retornado pela busca possui `0 faixas`, `0 min` e ainda oferece botão de reproduzir. | Conteúdo vazio não deve ser elegível a busca, recomendação nem reprodução. É necessário controle de publicação/qualidade no admin. |
| DATA-08 | Média | A descrição do álbum é genérica e contém marca de domínio em texto editorial. | Metadados devem ter campos separados de descrição, curadoria, fonte e direitos; textos de placeholder não podem atingir páginas públicas. |


## Jornada de visitante — cadastro e entrada

As telas de cadastro e entrada têm composição limpa, curta e coerente com o visual do produto. Elas pedem apenas nome, e-mail, senha e aceite no cadastro; login oferece recuperação de senha e opção de lembrar sessão.

| ID | Severidade preliminar | Evidência | Impacto |
|---|---|---|---|
| UX-16 | Média | O CTA `Continuar com Google` está visível nas duas telas, porém o código do projeto declara o login Google temporariamente indisponível. | Exibir uma alternativa inoperante frustra no momento de maior intenção. O botão deve ser habilitado de verdade ou removido/rotulado como indisponível até a conclusão da integração. |
| UX-17 | Média | A promessa de valor do cadastro é genérica: "Junte-se a milhares de ouvintes". | Para elevar conversão sem aumentar fricção, comunique benefícios específicos: favoritos, playlists, histórico, acesso rápido a hinos/cifras e seguir compositores. |
| UX-18 | Baixa | Não há sinal visível de requisitos de senha além do placeholder "Mínimo 6 caracteres", nem explicação de verificação de e-mail. | Orientação progressiva reduz erro e suporte; mantenha o formulário curto, mas ofereça validação em linha. |


## Jornada de compositor — entrada e onboarding

A página pública de captação de compositores apresenta benefícios claros e um CTA principal. O CTA leva ao onboarding de sete etapas, cuja primeira tela promete configurar perfil, publicar, conectar-se e acompanhar métricas.

| ID | Severidade preliminar | Evidência | Impacto |
|---|---|---|---|
| UX-19 | Média | O CTA afirma `Criar Conta e Cadastrar`, mas o fluxo abre imediatamente um onboarding de compositor sem explicar se é necessário já estar autenticado, quais dados/documentos serão solicitados ou quanto tempo levará a análise. | A expectativa de processo é ambígua; informar etapas, tempo estimado, documentos e o que será possível fazer antes/depois da aprovação reduz abandono. |
| UX-20 | Média | O onboarding possui sete etapas, porém a primeira apenas repete benefícios de marketing. | Em fluxo longo, cada etapa precisa gerar progresso real. Benefícios devem estar na landing; o onboarding deve iniciar com requisitos, perfil e consentimentos. |
| UX-21 | Baixa | A página de onboarding é renderizada dentro do layout público completo, com menu e rodapé extensos. | Para uma tarefa de cadastro concentrada, o usuário pode se dispersar ou sair sem salvar; use um shell simplificado com saída segura e indicador de salvamento. |


## Jornada de compositor — classificação inicial

A segunda etapa pede o tipo de compositor e bloqueia o botão de avanço até uma seleção. As opções são artista solo, grupo e orquestra/coral.

| ID | Severidade preliminar | Evidência | Impacto |
|---|---|---|---|
| UX-22 | Baixa | A escolha é simples, visual e tem validação de avanço adequada. | É um padrão positivo a preservar. |
| UX-23 | Média | O modelo de perfil oferece apenas três tipos organizacionais e não explica como a classificação afeta publicação, créditos, permissões de gerentes ou análise de direitos. | Compositores podem escolher sem entender a consequência; mostre uma frase de efeito e permita alteração posterior. |
| UX-24 | Média | O fluxo de sete etapas pode ser percorrido sem autenticação visível no início. | É necessário salvar rascunho ou solicitar login antes de coletar dados pessoais/documentais para evitar perda de progresso e ambiguidades de segurança. |


## Auditoria de implementação — onboarding de compositor

A revisão do fluxo completo de sete etapas mostrou que ele coleta perfil, dados de contato e endereço completo, redes sociais e imagens de documento de identidade. O processo cria conta, faz upsert de usuário, cria compositor e, opcionalmente, convida um gerente diretamente a partir do cliente.

| ID | Severidade preliminar | Evidência de código | Risco ou impacto |
|---|---|---|---|
| PRIV-01 | Alta | `ComposerOnboarding.tsx`, linhas 545–590: quando o upload de documento falha, o arquivo é convertido para Base64 e usado como fallback de armazenamento. | Documentos de identidade podem ser persistidos em colunas comuns ou trafegados em payloads grandes, ampliando exposição, custo, risco LGPD e possibilidade de vazamento. O fluxo deve falhar com segurança, manter arquivo em storage privado criptografado e guardar somente referência/metadata. |
| PRIV-02 | Alta | Linhas 1045–1303 solicitam endereço residencial completo, incluindo CEP, rua e número, como requisito de cadastro de compositor. | O princípio de minimização de dados não está demonstrado; a finalidade de coletar endereço completo para publicar músicas precisa de fundamento explícito, política de retenção e alternativa de contato profissional. |
| SEC-04 | Alta | Linhas 624–691 realizam `upsert` do perfil de usuário e promovem `is_composer: true` do cliente. | A promoção de papel deve ser exclusivamente server-side/RPC segura, com validação de sessão e de aprovação. Se RLS falhar ou for permissiva, o cliente pode manipular atributos de privilégios. |
| PRIV-03 | Média | Linhas 352–380 fazem busca de usuário por e-mail para indicar possível gerente; 1012–1034 exibem nome, e-mail e avatar do encontrado antes de vínculo. | Isso pode permitir enumeração de contas e divulgação desnecessária de dados pessoais. O convite deve ser enviado por e-mail sem revelar o perfil até aceite e autorização. |
| UX-25 | Média | Linhas 1306–1359 coletam redes sociais, mas não mostra regras de formato/validação ou propósito. | Erros de perfil e links quebrados chegam à página pública; aplique normalização de URL e preview seguro. |
| UX-26 | Média | Linhas 1606–1689 exibem resumo e conclusão, mas o resumo não mostra status de revisão, uso de documentos, tempo de análise, canais de suporte ou próxima ação. | Para um processo que bloqueia o dashboard até verificação, a confirmação precisa definir expectativa de aprovação e comunicar persistência do protocolo. |
| DATA-09 | Média | Campos `avatar` e `coverImage` existem no estado do formulário (linhas 49–50), mas não há etapa renderizada correspondente nem envio desses valores no payload final. | Há recursos parcialmente implementados que aumentam complexidade sem gerar benefício e podem levar a expectativas de perfil incompleto. |


## Jornada de compositor — publicação e acesso

A rota pública `/compositor/publicar` mostra somente uma mensagem genérica e redireciona o não autenticado ao cadastro. O acesso direto a `/composer/dashboard` foi corretamente redirecionado para login.

| ID | Severidade preliminar | Evidência | Impacto |
|---|---|---|---|
| UX-27 | Média | A página `Publicar Composição` tem apenas uma frase e botão `Criar Conta`, repetindo a landing de cadastro de compositor. | O usuário com real intenção de publicar não recebe critérios de conteúdo, formatos, limites, direitos, processo de análise, prazo ou exemplo de publicação aprovada. Transforme-a em um guia de publicação conciso, mantendo o mesmo layout. |
| SEC-05 | Baixa | Acesso direto ao dashboard de compositor sem sessão retornou à tela de login. | A proteção de rota de primeiro nível funciona no cenário anônimo; a auditoria de autorização por papel ainda depende de ambiente de homologação e perfis controlados. |


## Auditoria dos dashboards — evidências estáticas

> A validação visual autenticada continua pendente de contas de teste, mas a revisão de implementação permite identificar comportamentos, lacunas e riscos que precisam ser confirmados em homologação.

### Dashboard de usuário

| ID | Severidade preliminar | Evidência de código | Risco ou impacto |
|---|---|---|---|
| USER-01 | Alta | `ProfilePage.tsx`, linhas 54–66 gera faixas vazias a partir de `songs_count`, com título, artista, capa e duração artificiais; linhas 70–121 misturam backend e stores locais. | O painel pode exibir número de músicas sem dados reais de playlist ou perder coerência entre dispositivos/sessões. A fonte de verdade deve ser uma API única e o card só pode renderizar itens reproduzíveis. |
| USER-02 | Média | O painel apresenta `Horas Ouvidas` e `Seguidores` (linhas 123–128), enquanto a API resumida retorna zeros para essas métricas conforme inspeção da camada de dados. | Métricas vazias em cards destacados diminuem valor percebido. Ocultar até implementar ou substituí-las por métricas reais como hinos salvos e playlists ativas. |
| USER-03 | Média | A biblioteca e o perfil concentram playlists, enquanto favoritos, histórico, downloads, notificações e configurações não aparecem juntos na navegação lateral (`UserSidebar.tsx`, linhas 73–106). | A área pessoal é fragmentada e reduz a sensação de um dashboard completo; agrupar "Sua biblioteca" com abas/subseções preserva o layout e reduz dispersão. |
| USER-04 | Média | Botões visuais de reprodução dentro de cards de playlist não têm ação associada (`ProfilePage.tsx`, linhas 428–430 e 479–481). | A interface sugere uma ação que não acontece, prejudicando confiança. Ou conecte ao player ou remova a affordance até que esteja pronta. |

### Dashboard de compositor

| ID | Severidade preliminar | Evidência de código | Risco ou impacto |
|---|---|---|---|
| COMP-01 | Alta | `ComposerDashboard.tsx`, linhas 64–91 e 204–248 preenchem várias métricas como zero em cenários normais ou de erro; países ficam sempre vazios (linhas 221–276). | O painel promete analytics detalhados, mas exibe dados incompletos, placeholders ou ausência de dados sem distinguir o motivo. Deve usar estados "sem coleta ainda" e priorizar métricas factuais. |
| COMP-02 | Média | Crescimento de plays, receita, ouvintes mensais, downloads e várias métricas secundárias são definidos como `0`; destaques recebem tendência fixa `up` (linhas 72–90 e 94–106). | Indicadores de performance podem ser enganosos. Remover tendência até haver período comparativo e rotular métricas não coletadas. |
| COMP-03 | Média | A sidebar possui muitas áreas, mas só mantém uma seção expandida por vez (`ComposerSidebar.tsx`, linhas 126–148), e lista recursos como trending, mais curtidas, analytics e claims. | Em uma área de trabalho frequente, fechar seções dificulta navegação transversal. Permitir múltiplas seções expandidas ou fixar atalhos de publicação e conteúdo. |
| COMP-04 | Média | Realtime de novos seguidores está comentado/desabilitado (`ComposerDashboard.tsx`, linhas 143–202), enquanto a interface promete atualização em tempo real. | Há divergência entre promessa e comportamento. Atualize o texto ou implemente notificações com autorização e tratamento de reconexão. |

### Dashboard administrativo

| ID | Severidade preliminar | Evidência de código | Risco ou impacto |
|---|---|---|---|
| ADMIN-01 | Alta | `AdminDashboard.tsx`, linhas 54–123 renderizam tendência `+0%` com seta positiva para todos os indicadores. | A visualização sugere crescimento mesmo sem cálculo, induzindo decisões operacionais erradas. Exibir "sem comparação" até haver série temporal real. |
| ADMIN-02 | Média | O carregamento depende simultaneamente de três consultas e bloqueia a tela completa (`AdminDashboard.tsx`, linhas 51 e 143–152). | Uma falha ou lentidão parcial torna todo o painel indisponível. Carregar cards de modo independente, com retry e timestamp por módulo. |
| ADMIN-03 | Média | A atividade recente é apresentada como evento do produto, mas a camada de dados constrói eventos simplificados de usuários/hinos novos. | A equipe pode interpretar dados agregados como auditoria real. Separar "Eventos recentes" de "Atividade estimada" e investir em trilha de auditoria. |
| ADMIN-04 | Média | A navegação administrativa possui 11 seções e mais de 40 destinos (`AdminSidebar.tsx`, linhas 142–267), com três pollings de 30 s no menu (linhas 60–105). | Sobrecarga cognitiva e chamadas recorrentes em todas as telas administrativas. Agrupar ferramentas menos usadas, usar badges em batch e atualizar sob demanda/realtime. |

### Riscos adicionais da implementação de compositor

| ID | Severidade preliminar | Evidência de código/migração | Risco ou impacto |
|---|---|---|---|
| SEC-06 | Crítica — confirmar em produção | A migração `fix_register_composer_function.sql` cria uma função `SECURITY DEFINER` que insere diretamente em `auth.users`, `auth.identities`, `public.users` e `composers`, com execução concedida a `anon` (linhas 8–182). | Caso esteja aplicada, qualquer cliente anônimo pode acionar uma rotina privilegiada de criação de contas. A função deve ser retirada do acesso anônimo e substituída por fluxo seguro de Auth + Edge Function com rate limit, CAPTCHA/antiabuso e validação estrita. |
| SEC-07 | Alta | `composerOnboardingApi.ts`, linhas 75–86 consulta `users` por e-mail via catálogo público para informar disponibilidade. | Permite enumeração de e-mails se a política de leitura pública estiver ativa; a checagem deve ocorrer em endpoint com resposta neutra e limitação de requisições. |
| SEC-08 | Alta | `composerOnboardingApi.ts`, linhas 166–230 cria compositor e insere documentos com o cliente; há fallback entre REST e SDK. | A proteção depende integralmente de RLS e é difícil de auditar. Mutações que criam perfis, enviam documentos e alteram status devem ser servidor-side, transacionais e auditáveis. |
| PRIV-04 | Alta | `composerOnboardingApi.ts`, linhas 209–229 grava imagem de documento e número do documento na mesma operação lógica, com possibilidade de valor Base64. | É necessária separação entre PII e conteúdo público, armazenamento privado, retenção mínima, acesso administrativo auditado e exclusão controlada. |


## Benchmark público — Cifra Club / CCB

A página de CCB na Cifra Club estrutura a descoberta como catálogo musical: apresenta busca global, filtros explícitos por formato (cifra, letra, Guitar Pro, tabs de baixo), ranking de músicas com número, título, exibições e tom, além de álbum, conteúdo relacionado e ferramentas musicais no ecossistema.

| Referência observada | Como aparece na Cifra Club | Aplicação apropriada para Cânticos CCB, sem copiar layout |
|---|---|---|
| Descoberta de hinos | Lista classificada com número, título, popularidade e tom. | Manter o visual escuro atual, mas incluir `número`, `tom`, tipo de material (áudio/cifra/partitura) e um sinal discreto de popularidade ou atualização na busca e no hinário. |
| Filtros por formato | Alternância direta entre cifra, letra, Guitar Pro e tab de baixo. | Criar um seletor de modo `Ouvir`, `Letra`, `Cifra`, `Partitura` que use o mesmo hino como contexto; ocultar modos indisponíveis em vez de levar a páginas vazias. |
| Continuidade editorial | Discografia, artistas relacionados e conteúdos de estudo aparecem no mesmo contexto. | Oferecer coletâneas, hinos relacionados por temática/tonalidade e guias de ensaio abaixo do detalhe do hino, somente quando existirem dados válidos. |
| Ferramentas de prática | Afinador, metrônomo e dicionário de acordes fazem parte do ecossistema. | Priorizar metrônomo, transposição e modo de leitura/rolagem para hinos; não é necessário reproduzir o catálogo completo de ferramentas. |
| Sinais sociais | Favoritar, compartilhar, envio de cifra e volume de exibições. | Usar favoritos, compartilhar e solicitação de correção/contribuição com moderação, sem expor métricas vazias ou incentivar conteúdo não revisado. |

**Nota de experiência:** a Cifra Club fornece referências funcionais úteis, mas a Cânticos CCB pode se diferenciar ao ser **sem publicidade intrusiva, especializada em repertório CCB, com acervo verificado e fluxo único entre ouvir, letra, cifra e partitura**.


## Benchmark público — Spotify

As páginas oficiais de suporte consultadas confirmam que o player web é um canal de uso principal e documentam recursos como filas, atividade recente, playlists, rádio, letras e atalhos. A documentação de letras apresenta a leitura como recurso contextual à faixa em reprodução e explicita que a disponibilidade pode variar por música/dispositivo, com comportamento de ausência claro.

| Princípio de experiência | Referência Spotify | Adaptação recomendada para Cânticos CCB |
|---|---|---|
| Continuidade no contexto de audição | Letras são abertas a partir do player em execução; o player web reúne recursos de fila, playlists e atividade recente. | Ao iniciar um hino, disponibilizar atalhos `Letra`, `Cifra`, `Partitura` e `Próximo hino` no player/detalhe, preservando a reprodução. |
| Transparência de cobertura | O Spotify informa que letras podem não estar presentes em todas as faixas/dispositivos. | Mostrar status objetivo: `Partitura disponível`, `Cifra em revisão`, `Áudio indisponível`, com alternativa prática (ex.: sugerir versão disponível), em vez de CTA que abre página vazia. |
| Biblioteca como memória do usuário | A documentação do player cita playlists, fila e atividade recente como funções de uso recorrente. | Centralizar `Favoritos`, `Últimos ouvidos`, `Continuar ensaio`, `Playlists` e `Downloads` (se houver) em uma biblioteca única, não em rotas dispersas. |
| Descoberta com propósito | A descoberta é sustentada por busca, biblioteca e mecanismos de recomendação, mas o foco no CCB deve ser explicável. | Substituir recomendação genérica por curadoria transparente: mesma coletânea, mesma tonalidade, hinos do mesmo período, mais acessados no hinário ou escolhidos pelo usuário. |

**Referências a citar no relatório:** Spotify Web Player Help — `https://support.spotify.com/us/article/web-player-help/`; Spotify View Lyrics — `https://support.spotify.com/us/article/lyrics/`.


## Benchmark público — detalhe de cifra na Cifra Club

No detalhe do hino 115, a Cifra Club oferece controles de tom/transposição, rolagem, mídia, impressão/salvamento/compartilhamento, tela cheia em colunas, escolha de instrumento, capotraste, afinação, tablaturas, diagramas, tamanho de texto, batidas, afinador e metrônomo. O conteúdo também é interrompido por anúncios e reserva grandes áreas para publicidade, o que reforça a oportunidade de diferenciação do Cânticos CCB.

| Recurso de referência | Prioridade | Proposta adaptada ao Cânticos CCB |
|---|---|---|
| Tom / transposição | P0 para cifras | Controlador `− / Tom atual / +` com cifra recalculada, salvando a preferência apenas para o usuário conectado. |
| Rolagem e tamanho de texto | P0 para ensaio | Modo ensaio com rolagem ajustável, bloqueio de tela opcional, contraste alto e aumento de fonte; não requer mudança no design base. |
| Tela imersiva de cifra | P1 | Evoluir a rota imersiva existente para ocultar distrações, manter o player e alternar `Cifra`, `Letra`, `Partitura`. |
| Diagramas de acordes | P1 | Mostrar diagramas somente para instrumentos escolhidos e cifras verificadas; atender violão, viola, violino/teclado conforme escopo musical real. |
| Metrônomo | P1 | Metrônomo nativo de baixo peso no modo ensaio, com BPM por hino e predefinição de compasso quando o dado existir. |
| Revisão comunitária moderada | P1 | Botão `Sugerir correção` com comparação de versões, atribuição ao colaborador e fila administrativa; não publicar automaticamente. |
| Ausência de anúncios | Diferencial estratégico | Definir `Sem interrupções publicitárias durante a leitura, o ensaio e a audição` como promessa de produto. Monetização futura não deve sobrepor mídia/cifra nem deslocar o conteúdo. |

**Fonte de evidência:** `https://www.cifraclub.com.br/congregacao-crista-no-brasil/hino-115-minha-alma-engrandece/`.


## Qualidade de build e dependências

A recompilação de produção concluiu com sucesso. A auditoria de dependências reportou quatro alertas de severidade alta, todos encadeados pela dependência direta de desenvolvimento `pwa-asset-generator`, passando por `puppeteer-core`, `@puppeteer/browsers` e `extract-zip`.

| ID | Severidade | Evidência | Recomendação |
|---|---|---|---|
| DEP-01 | Alta | `npm audit` reportou `extract-zip` com vulnerabilidade de path traversal via symlink (GHSA-jmr9-qjv8-65gv; CVSS 8,1), dependência transitiva de `pwa-asset-generator`. | Atualizar ou remover `pwa-asset-generator` em uma branch de manutenção, regenerar ativos PWA e executar build/teste completo. A correção disponível indicada pelo auditor exige mudança de versão principal, portanto não aplicar automaticamente em produção. |
| QA-01 | Positivo | `npm run build` foi concluído com código 0 durante a auditoria. | Manter o build como gate de CI, mas adicionar lint efetivo, checagem de tipos, auditoria de dependências e testes de rota/integração. |


## Validação com Supabase real — preview local

A configuração local do Supabase foi criada em arquivo ignorado pelo Git, com permissões 600. A chamada pública de configurações do Auth respondeu HTTP 200. Após reiniciar o preview em porta isolada, a página inicial carregou dados reais da instância: hinos recentes, autores, durações, álbuns e capas remotas. Isso confirma que o preview local passou a consultar a fonte real de dados, em vez do catálogo de emergência.

| Evidência | Resultado |
|---|---|
| Variáveis de cliente | Configuradas somente em `.env.local`, ignorado pelo Git. |
| Conectividade de Auth | Endpoint público de configurações respondeu HTTP 200. |
| Carregamento real | Home do preview exibiu títulos, durações e álbuns presentes na instância Supabase. |
| Escrita/mutações | Ainda não executadas; qualquer criação, edição, exclusão ou publicação continua bloqueada até autorização explícita. |


## Validação Supabase real — leitura anônima e RLS

Uma consulta de contagem sem retorno de registros foi executada com a chave pública anônima contra a API REST. Ela confirmou conectividade real, mas identificou exposição anônima de tabelas que deveriam ser privadas. Não foram baixados documentos, e-mails, mensagens nem quaisquer dados de usuários; foram coletados apenas status HTTP e contagens agregadas.

| Tabela consultada sem sessão | Resultado | Interpretação |
|---|---:|---|
| `banners` | 4 linhas visíveis | Leitura pública compatível com conteúdo de vitrine. |
| `categories` | 6 linhas visíveis | Leitura pública compatível com catálogo. |
| `albums` | 825 linhas visíveis | Pode ser esperado para catálogo público, sujeitando-se a filtro de publicados. |
| `hinario` | 311 linhas visíveis | Pode ser esperado para conteúdo canônico público, sujeitando-se a publicação/qualidade. |
| `cifras` | 10 linhas visíveis | Confirma que há cifras no banco, embora a UI tivesse exibido cobertura zero; investigar divergência de query/status. |
| `composers` | 8 linhas visíveis | Pode ser esperado apenas se o view expuser dados públicos mínimos de perfis aprovados. |
| `playlists` | 200 linhas visíveis | Suspeito: playlists de usuários normalmente devem ser privadas ou explicitamente públicas. |
| `users` | 1.088 linhas visíveis | **Crítico:** lista de usuários está acessível sem sessão; validar quais colunas estão expostas e revogar política pública de leitura. |
| `composer_documents` | 6 linhas visíveis | **Crítico:** metadados de documentos de compositores estão acessíveis sem sessão; negar acesso anônimo imediatamente e validar storage privado. |
| `notifications` | 80 linhas visíveis | **Crítico:** notificações/chat estão acessíveis sem sessão; restringir por proprietário e papel administrativo. |

> Nenhum registro ou campo pessoal foi exibido nesta auditoria. A leitura foi limitada a `select=id&limit=0` com contagem, justamente para confirmar o comportamento sem coletar dados. Os resultados representam uma falha de política RLS ou de exposição PostgREST a ser corrigida antes de qualquer ampliação de cadastro ou acesso de administradores.


## Validação Supabase real — sessão existente e hinário

Ao abrir o preview conectado ao Supabase, a navegação exibiu uma sessão já presente sob o nome público `Administradores` e os atalhos de biblioteca do usuário. A origem e a validade atual do papel não foram assumidas: a verificação de console foi minimizada para não retornar identificadores ou dados pessoais, mas o console não forneceu resultado estruturado. A sessão será tratada como contexto de leitura até a validação explícita do papel pelo comportamento de rota e pelo token.

A listagem do hinário conectada mostra diversos itens reais, enquanto a contagem anônima REST retornou 311 linhas. A UI, contudo, renderiza uma amostra menor e mantém em todos os cartões o contador `0` sem legenda. Há títulos com autoria incorporada ao próprio campo do hino, reforçando a necessidade de normalização já apontada.


## Validação Supabase real — falha de gerenciamento em sessão existente

O console do preview conectado revelou que, ao montar a navegação autenticada, a consulta a `composer_managers` atingiu o timeout interno de 3,5 s e caiu no catálogo de emergência. O identificador técnico de sessão observado no console não foi reproduzido nem incluído neste registro. Isso confirma que a navegação pode aparentar funcionar enquanto uma dependência de gerenciamento falha silenciosamente.

| ID | Severidade preliminar | Evidência real | Impacto |
|---|---|---|---|
| REL-03 | Alta | Consulta a `composer_managers` excedeu 3,5 s e acionou fallback de emergência durante a montagem da sidebar autenticada. | Relações de gerente/compositor podem ser omitidas ou ficar desatualizadas, alterando a navegação e a autorização percebida. Substituir timeout fixo curto por retry limitado, estado de erro explícito e consulta/index apropriados. |


## Dashboard administrativo com dados reais

A sessão existente acessou efetivamente `/admin` no preview conectado, confirmando acesso administrativo de leitura. O dashboard carregou após a espera inicial e exibiu dados reais: 8 compositores, 227 hinos publicados, 1.000 hinos totais, 773 hinos pendentes, 2 compositores pendentes e 1 novo usuário no dia. Também confirmou que os indicadores de plays e curtidas permanecem zerados e que as variações são exibidas como `+0%` com seta positiva.

| ID | Severidade | Evidência real | Impacto |
|---|---|---|---|
| ADMIN-05 | Crítica de operação | Há 773 hinos pendentes contra 227 publicados, um backlog superior a três vezes o catálogo publicado. | A moderação/publicação é o principal gargalo de produto e explica a baixa cobertura de cifras/conteúdo. O admin deve priorizar uma fila operacional com filtros, validações em lote, SLA e bloqueio de itens inválidos. |
| ADMIN-06 | Alta | Dashboard mostra simultaneamente 1.000 hinos totais e 227 publicados, sem esclarecer os status no card principal. | A informação é ambígua; o usuário administrativo pode interpretar o acervo como publicado. Explicitar `publicados`, `em revisão`, `rascunho`, `rejeitados` e `sem mídia`. |
| ADMIN-07 | Alta | Ranking de hinos mais tocados apresenta itens reais com 0 plays, enquanto o painel mostra 0 plays totais e 0 curtidas. | A ordenação/ranking não comunica valor e pode ser baseada apenas em fallback ou tabela sem eventos. Ocultar ranking até haver eventos, ou exibir “ainda sem dados de reprodução”. |
| ADMIN-08 | Média | Atividade recente mostra pessoas reais com a descrição genérica “realizou uma atividade”. | Dados de auditoria precisam de taxonomia concreta (cadastro, publicação, aprovação, edição, denúncia) e privacidade apropriada; a frase genérica não apoia decisão. |


## Dashboards com dados reais — usuário e compositor

O painel de perfil da sessão existente foi acessado com dados reais. Ele exibiu nome, e-mail, avatar e quatro métricas zeradas; não há data de cadastro visível, atividade, favoritos ou playlists para essa conta. A navegação para `/composer/dashboard` foi permitida para a mesma sessão e montou a sidebar de compositor, mas permaneceu inicialmente em carregamento de dados.

| ID | Severidade preliminar | Evidência real | Impacto |
|---|---|---|---|
| USER-05 | Média | Perfil real exibe `Membro desde —` e todas as quatro métricas em zero, sem distinguir conta nova, ausência de coleta e indisponibilidade da API. | Mesmo estados vazios devem explicar a situação e orientar uma próxima ação concreta. |
| AUTH-01 | Alta a confirmar | A mesma sessão com acesso admin alcançou a rota de compositor e renderizou toda a navegação de compositor antes de confirmação de dados. | Validar no servidor se admin pode atuar como compositor; caso seja permitido, exibir banner explícito de papel/impersonação. Caso não seja, bloquear antes de renderizar o painel. |


## Dashboard de compositor com dados reais — bloqueio de carregamento

Após mais de uma atualização de tela, o dashboard de compositor permaneceu em `Carregando dados...`. O console confirmou que a consulta `composer_managers` terminou com HTTP 200 e retornou um registro para a sessão, ou seja, a relação de gerenciamento foi resolvida; contudo, a página não avançou para as métricas. O comportamento sugere bloqueio posterior na resolução do compositor ativo ou em uma das consultas agregadas do dashboard, e não ausência completa de dados de gerenciamento.

| ID | Severidade | Evidência real | Impacto |
|---|---|---|---|
| COMP-05 | Crítica de funcionalidade | Rota de compositor monta a interface, resolve a relação de gerente, mas permanece indefinidamente no estado de carregamento. | O compositor/gerente não consegue acessar métricas, upload ou gestão de catálogo. É necessário timeout de tela, erro acionável e diagnóstico das queries subsequentes. |


## Diagnóstico adicional do bloqueio do compositor

A inspeção agregada de rede do navegador não mostrou chamadas subsequentes de métricas do compositor no trecho analisado; os únicos registros funcionais confirmados foram as consultas bem-sucedidas a `composer_managers`. Em conjunto com o carregamento indefinido, isso fortalece a hipótese de que a resolução do compositor ativo não finaliza ou não propaga `composerId` após restaurar o contexto de gerente persistido.

Recomendação técnica: instrumentar `resolveActiveComposer` e `useActiveComposer` com timeout, logs estruturados sem PII, e estados distintos para `sem compositor associado`, `gerente sem vínculo ativo`, `compositor inativo` e `erro de dados`. Nenhuma dessas condições deve manter o spinner indefinidamente.


## Catálogo de cifras com dados reais — divergência confirmada

A página local `/cifras` conectada ao Supabase exibiu `Nenhuma cifra disponível`. Porém, consultas de contagem sem retorno de conteúdo confirmaram 10 registros legados em `cifras`, todos com `is_active = true`, e 455 versões em `cifra_versions`. A consulta direta do catálogo v2 com `select=*` respondeu normalmente; a falha anterior com `select=id` foi causada pelo fato de essa view não expor uma coluna `id`, e não por indisponibilidade do catálogo.

| ID | Severidade | Evidência real | Hipótese de causa a validar |
|---|---|---|---|
| CIFRA-04 | Alta | Há 10 cifras legadas ativas no banco, mas a UI conectada apresenta catálogo vazio. | O agregador `fetchMergedPublicCifrasList` pode falhar silenciosamente em uma fonte, receber formato divergente ou não propagar o resultado para o estado. É necessário instrumentar o comprimento de cada fonte e renderizar erro/estado parcial em vez de “em breve”. |
| CIFRA-05 | Alta | Existem 455 versões v2, mas não há apresentação pública confirmada no catálogo. | Verificar a view `cifra_public_catalog`, seu filtro de publicação e os campos esperados pelo mapper. Não publicar/contabilizar versões que não estejam prontas para leitura. |


### Nota de validade da verificação de cifras

A tentativa auxiliar de reproduzir as chamadas REST diretamente no console do navegador retornou autorização inválida por divergência no cabeçalho montado manualmente. Esse resultado foi **descartado** e não altera as evidências válidas: a aplicação conectada exibiu estado vazio, enquanto as consultas de contagem realizadas com a configuração local correta confirmaram 10 cifras legadas ativas e a existência das versões v2. O diagnóstico continuará baseado nas chamadas reais da aplicação e nas consultas REST autenticadas com a mesma configuração local.


## Validação de tempo real e segurança de mutações

Uma assinatura de canal Supabase Realtime em modo exclusivamente leitura foi estabelecida com sucesso (`SUBSCRIBED`) a partir da configuração local. Isso comprova conectividade com o serviço Realtime, mas não comprova entrega de eventos de tabelas específicas: a propagação de alterações depende de publicação da tabela, políticas RLS de réplica, filtro de canal e listener da interface.

Nenhuma inserção, edição, exclusão, aprovação, publicação, alteração de perfil ou aumento de contador foi executado. Assim, a reversibilidade das mutações e a entrega de eventos reais permanecem pendentes de uma conta de teste e de autorização explícita para uma alteração descartável em homologação.

| Validação | Estado | Limite |
|---|---|---|
| Conectividade REST/Auth | Confirmada. | Não avalia escrita. |
| Conectividade Realtime | Confirmada com assinatura de canal. | Não confirma eventos por tabela. |
| Regras de leitura anônima | Falhas críticas confirmadas por contagem. | Não coletados dados pessoais. |
| Inserção/edição/exclusão | Não executadas. | Requer autorização e ambiente de homologação. |
| Reversão e evento ponta a ponta | Não executados. | Requer mutação descartável autorizada. |


## Validação da primeira sprint — catálogo de cifras

Em 13/08/2026, o preview local conectado ao Supabase foi validado visualmente em `/cifras`. Antes da correção, a rota pública selecionava o catálogo de emergência para `cifra_public_catalog` e mostrava um estado vazio, embora a instância real retornasse 455 versões públicas. Após remover `cifras` e `cifra_public_catalog` do fallback obrigatório em `supabaseRest.ts`, a listagem passou a renderizar as cifras reais. A paginação visual, a busca e os filtros mantêm o layout existente; estados de falha total, indisponibilidade parcial e catálogo efetivamente vazio agora são distintos.

A migração RLS criada nesta sprint permanece apenas versionada no repositório e não foi aplicada à instância Supabase.

## Pré-condição Supabase RLS — 13/08/2026

No SQL Editor autenticado do projeto `canticosccb`, uma consulta somente leitura em `pg_policies` retornou 37 políticas para `users`, `composers`, `composer_documents`, `notifications` e `playlists`. Entre as políticas atuais aparecem leituras públicas em `composers` e políticas diretas de inserir, atualizar, excluir e selecionar em documentos/notificações. A migração P0 continua necessária para substituir esse conjunto permissivo por regras de proprietário, gerente aceito e administrador; ela ainda não foi executada.
