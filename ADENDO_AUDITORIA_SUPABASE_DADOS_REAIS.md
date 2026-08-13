# Adendo à Auditoria — Supabase com Dados Reais

**Data da validação:** 13 de agosto de 2026
**Ambiente:** preview local conectado à instância Supabase informada pelo responsável pela plataforma.
**Natureza da validação:** leitura, navegação e assinatura de tempo real. Nenhuma alteração persistente foi executada.

> **Conclusão prioritária.** A integração local com Supabase está funcional e o preview já consome dados reais. A auditoria, porém, confirmou um risco crítico de exposição anônima de tabelas privadas e evidenciou que gargalos de conteúdo, dashboard e cifras não são apenas efeitos de dados simulados. Eles ocorrem na instância real e devem ser corrigidos antes de adicionar novos recursos ou abrir mais fluxos de cadastro.

## 1. Escopo e garantias da validação

O arquivo local de configuração foi criado fora do versionamento, com permissões de leitura restritas ao usuário do ambiente. A chave recebida é uma chave de cliente público; ela foi utilizada somente para simular exatamente o contexto de navegador da aplicação. A conectividade do endpoint de Auth respondeu com HTTP 200, o preview carregou hinos, álbuns, categorias, capas e dados de painéis reais, e uma assinatura de canal Realtime foi concluída com o estado `SUBSCRIBED`.

Nenhum conteúdo privado foi baixado para a auditoria. Para testar permissões anônimas, foram usados apenas `select=id` e `limit=0`, com contagens retornadas em cabeçalho. Não foram criados usuários, playlists, cifras, hinos, documentos, aprovações ou eventos; tampouco foram feitas edições, deleções ou ações de publicação.

| Controle aplicado | Resultado | Consequência |
|---|---|---|
| Variáveis locais | `.env.local` ignorado pelo Git, modo `600`. | A credencial pública não foi incluída em commits. |
| Endpoint Auth | Resposta HTTP `200`. | A instância e a chave pública são válidas. |
| Preview local | Dados reais carregados na home, hinário, perfil e admin. | O ambiente deixa de depender do catálogo de emergência. |
| Teste RLS | Apenas contagens agregadas, sem registros retornados. | Permite constatar exposição sem coletar informações pessoais. |
| Realtime | Canal em modo leitura assinou com `SUBSCRIBED`. | Confirma conectividade, não entrega ponta a ponta de eventos. |
| Mutações | Nenhuma. | Ainda é necessário teste descartável autorizado em homologação. |

## 2. Achados críticos confirmados com a instância real

O achado mais urgente é a disponibilidade anônima de tabelas que, pelo propósito aparente, devem ser privadas ou estritamente filtradas por proprietário. Uma chave pública não é um segredo, mas ela não deve permitir que qualquer visitante sem sessão enumere usuários, documentos, notificações e playlists privadas. A documentação do Supabase estabelece que tabelas em schemas expostos devem ter RLS habilitado e políticas que concedam somente os privilégios necessários; também recomenda diferenciar explicitamente os papéis `anon` e `authenticated`. [1]

| ID | Severidade | Evidência real, sem baixar registros | Risco operacional | Ação imediata recomendada |
|---|---|---|---|---|
| **RLS-01** | **Crítica** | `users`: 1.088 linhas visíveis ao papel anônimo. | Enumeração de contas e possível exposição de campos pessoais, status ou papéis. | Revogar `SELECT` de `anon`; permitir somente o próprio usuário autenticado e uma view pública mínima, se necessária. |
| **RLS-02** | **Crítica** | `composer_documents`: 6 linhas visíveis ao papel anônimo. | Metadados de documentos de identidade e, eventualmente, caminhos para arquivos sensíveis podem estar expostos. | Bloquear imediatamente `anon`; permitir somente proprietário, revisor designado e administrador autorizado; usar storage privado e URLs assinadas curtas. |
| **RLS-03** | **Crítica** | `notifications`: 80 linhas visíveis ao papel anônimo. | Leitura indevida de mensagens, alertas ou dados de atividade de usuários. | Aplicar `auth.uid() = user_id` e regra administrativa explícita; remover qualquer política pública. |
| **RLS-04** | Alta | `playlists`: 200 linhas visíveis ao papel anônimo. | Playlists que deveriam ser privadas podem ser enumeradas. | Separar visibilidade pública/privada; liberar a `anon` somente `visibility = 'public'`. |
| **RLS-05** | Alta | `composers`: 8 linhas visíveis ao papel anônimo. | Pode ser aceitável apenas se a seleção for limitada ao perfil público aprovado. | Usar view pública com colunas mínimas e filtro de `status = 'approved'`. |
| **VIEW-01** | Alta a confirmar | A aplicação usa views de catálogo, incluindo `cifra_public_catalog`. | Views podem ignorar RLS por padrão, dependendo de como foram criadas. | Revisar views expostas; no PostgreSQL 15+, avaliar `security_invoker = true`, ou revogar acesso das roles públicas e usar schema não exposto. [1] |

As tabelas de conteúdo público — banners, categorias, hinário e álbuns — podem ter leitura aberta, desde que exponham apenas registros publicados e colunas seguras. Ainda assim, a política deve ser explícita e testada. Acesso público por acaso, causado por ausência de RLS ou por uma view permissiva, não é substituto de uma política editorial.

## 3. Estado real do catálogo e da moderação

A auditoria confirmou que parte relevante das inconsistências observadas no primeiro diagnóstico existe de fato nos dados de produção. Há conteúdo suficiente no banco para que certas telas não apareçam vazias, mas regras de publicação, adaptadores e painéis não transformam essa base em uma experiência consistente para quem busca um hino ou uma cifra.

| Indicador real | Valor observado | Leitura de produto |
|---|---:|---|
| Álbuns acessíveis na consulta pública | 825 | O acervo tem volume, mas necessita controles de integridade para não sugerir álbuns vazios. |
| Itens de hinário acessíveis | 311 | A promessa de hinário completo e a cobertura real não estão alinhadas; a cobertura deve ser mostrada com transparência. |
| Cifras legadas ativas | 10 | O catálogo não deveria dizer “Em breve” sem antes tentar renderizar os itens existentes. |
| Versões de cifra v2 | 455 | Existe uma base importante de versões estruturadas, mas ela não chega corretamente à experiência pública. |
| Itens no catálogo público v2 | 455 | A view pública contém versões, confirmando que o vazio da tela é problema de integração/renderização, não ausência de dados. |
| Hinos totais no painel admin | 1.000 | Deve ser dividido por estado editorial para não parecer catálogo publicado. |
| Hinos publicados no painel admin | 227 | Somente cerca de um quinto do total aparece como publicado. |
| Hinos pendentes no painel admin | 773 | O backlog supera três vezes os publicados e é o maior bloqueio de produto. |
| Compositores pendentes | 2 | Fila pequena, adequada para tratamento rápido e manual com SLA. |

### 3.1. Catálogo de cifras: falha confirmada

A rota `/cifras` no preview conectado exibiu **“Nenhuma cifra disponível”**. Na mesma instância, as consultas de leitura controlada identificaram 10 cifras legadas ativas, 455 versões `v2` e 455 itens no catálogo público `v2`. O problema, portanto, está entre a consulta e a renderização: o agregador `fetchMergedPublicCifrasList`, seus mapeadores, uma exceção silenciosa ou uma incompatibilidade de formato está descartando resultados reais.

A correção deve seguir esta sequência: registrar em desenvolvimento o tamanho de cada fonte antes da mesclagem; proteger a execução paralela para que a falha de uma fonte não zere a outra; testar mapper e adaptador com um registro real anonimizado; renderizar resultados parciais quando houver falha em uma fonte; e substituir o estado “Em breve” por uma mensagem específica de indisponibilidade quando a consulta falhar. Essa intervenção preserva o layout atual e aumenta imediatamente o valor percebido da página.

### 3.2. Backlog administrativo: o centro do problema

O painel administrativo carregou dados reais com 773 hinos pendentes, 227 publicados e 1.000 totais. O desenho atual usa “+0%” e setas positivas para todos os cards, inclusive para métricas zeradas. Esse padrão deve ser removido: uma variação de zero não é crescimento, e um ranking de itens com zero reproduções não é um ranking acionável.

A prioridade operacional deve ser criar uma fila de moderação orientada por status, não adicionar outro módulo de conteúdo. Cada item precisa de um estado único — por exemplo, `rascunho`, `aguardando_mídia`, `aguardando_direitos`, `em_revisão`, `publicado`, `rejeitado`, `arquivado` —, motivo de pendência e responsável. O painel deve exibir contagens desses estados em vez de combinar tudo como “total de hinos”.

## 4. Dashboards com dados reais

A sessão já presente no navegador concedeu acesso de leitura aos painéis de usuário e administrador. O painel de compositor montou sua navegação, resolveu uma relação de gerente/compositor, mas manteve o conteúdo em carregamento indefinido. Isso confirmou, com instância real, que o dashboard de compositor possui uma falha funcional impeditiva.

| Área | Evidência observada | Diagnóstico | Correção preservando a identidade visual |
|---|---|---|---|
| Perfil de usuário | “Membro desde —”; quatro métricas em zero; estados vazios para playlists e históricos. | A interface não diferencia uma conta nova de falha de coleta ou ausência de dados. | Exibir datas reais; trocar zeros sem contexto por estado “ainda sem atividade”; adicionar primeira ação útil. |
| Dashboard admin | Carrega métricas reais; 773 pendências; cards com `+0%`; ranking de hinos com 0 plays. | Métricas e tendências não têm semântica confiável para decisão. | Mostrar período comparativo, timestamp de atualização, estados e filtros; ocultar ranking sem eventos. |
| Dashboard compositor | Sidebar monta, `composer_managers` retorna um vínculo, mas a tela permanece em “Carregando dados...”. | Resolução do compositor ativo ou consulta seguinte não conclui o ciclo de loading. | Implementar timeout, erro acionável e estados distintos de vínculo; nunca manter spinner infinito. |
| Navegação de papéis | Uma sessão administrativa alcançou a rota de compositor e renderizou sua sidebar. | A regra de admin como gerente/compositor precisa ser deliberada e visível, não um efeito implícito. | Se permitido, mostrar “Você está gerenciando: …”; se não, bloquear antes de montar a área. |

## 5. Tempo real e efeito após deploy

A conexão de canal Realtime foi validada, mas o teste não recebeu eventos porque nenhuma mutação foi autorizada. Para que mudanças de cadastro, publicação, favoritos e moderação apareçam em tempo real após o deploy, são necessários três controles independentes: a tabela precisa participar da publicação `supabase_realtime`, o usuário deve ser autorizado a receber o evento pelo RLS e a interface deve assinar o canal com filtro adequado. A própria documentação do Supabase exige adicionar as tabelas desejadas à publicação e recomenda assinaturas específicas por tabela e evento. [2]

| Componente | Estado atual | Próximo teste seguro |
|---|---|---|
| WebSocket Realtime | Conectado (`SUBSCRIBED`). | Manter monitoramento de reconexão e tempo de disponibilidade. |
| Publicação de tabelas | Não verificada sem acesso administrativo ao banco. | Conferir a publicação `supabase_realtime` para tabelas de domínio. |
| Entrega de evento | Não testada para evitar escrita em produção. | Criar/editar um registro descartável em homologação e ouvir apenas a própria linha. |
| Atualização da UI | Não comprovada ponta a ponta. | Abrir duas sessões de teste, alterar em uma, medir visibilidade na outra. |
| Reversão | Não testada. | Definir a mutação de teste e sua reversão antes da execução. |

## 6. Ordem de correção recomendada

O plano abaixo mantém a interface e prioriza proteção de dados, estabilidade e retorno imediato de valor ao usuário. Nenhuma ação deve ser aplicada diretamente à produção sem migração versionada, teste em homologação e plano de rollback.

| Ordem | Ação | Resultado esperado | Critério de aceite |
|---|---|---|---|
| **1** | Revogar leitura anônima em `users`, `composer_documents`, `notifications` e playlists privadas. | Elimina a exposição mais grave. | Consultas anônimas retornam `0` ou `403`; usuário autenticado vê apenas seus próprios dados. |
| **2** | Inventariar e corrigir views expostas, em especial as que agregam conteúdo e permissões. | RLS não é ignorado por objetos auxiliares. | Cada view possui política/role explícita ou está em schema não exposto. |
| **3** | Corrigir agregação e renderização de cifras. | As 10 cifras legadas e/ou 455 versões públicas aparecem conforme estado editorial. | `/cifras` não mostra vazio quando há itens publicáveis; erro parcial não zera as duas fontes. |
| **4** | Transformar 773 pendências em fila de moderação com status, filtros e ações em lote auditáveis. | Backlog passa a ter prioridade, dono e prazo. | Card e relatório mostram estados reais; primeira revisão pode ser concluída sem navegação excessiva. |
| **5** | Corrigir o loading infinito de compositor e definir regras de gerente. | O compositor chega a conteúdo, métricas ou uma explicação concreta. | Nenhum spinner persiste além de limite definido; cada caso tem mensagem/CTA. |
| **6** | Substituir métricas artificiais e `+0%`. | Painéis confiáveis e úteis. | Toda métrica exibe fonte, período e comparação válida, ou estado “sem dados”. |
| **7** | Criar homologação e roteiro ponta a ponta de Realtime. | Mudanças futuras são testadas antes do deploy. | Mutação descartável aparece em outra sessão, é revertida e deixa log. |

## 7. Matriz mínima de políticas a implementar

O desenho final de RLS deve ser revisado no banco por uma conta administrativa, mas a matriz abaixo estabelece o comportamento de produto esperado. A regra geral é: conteúdo editorial publicado pode ser lido publicamente; dados de conta, documento, conversa, relacionamento e operação são privados por padrão. Políticas de proprietário devem checar tanto `USING` quanto `WITH CHECK` para impedir que um usuário reassocie uma linha a outra conta. [1]

| Recurso | Leitura anônima | Leitura autenticada | Escrita | Observação |
|---|---|---|---|---|
| Banners, categorias, hinos e álbuns publicados | Permitida, com `is_published = true`. | Permitida. | Somente editorial/admin. | Nunca expor rascunho, arquivo interno ou metadado de revisão. |
| Perfil público de compositor | Permitida somente via view mínima de aprovados. | Permitida. | Proprietário limitado; admin para revisão. | Não incluir e-mail, telefone, documento ou endereço. |
| Usuários | Negada. | Somente a própria conta; admin com função explícita. | Somente a própria conta em campos permitidos. | Separar perfil público de PII. |
| Documentos de compositor | Negada. | Proprietário/revisor designado/admin. | Proprietário apenas no envio; status por revisor. | Bucket privado e URL assinada curta. |
| Notificações e chat | Negada. | Somente destinatário/remetente conforme caso. | Somente participantes. | Realtime sempre com filtro de proprietário/conversa. |
| Playlists | Somente as marcadas públicas. | Proprietário; outras públicas conforme flag. | Proprietário. | Favoritos devem ser sempre privados. |
| Fila de moderação | Negada. | Admin/revisor designado. | Admin/revisor designado. | Registrar ator, data, decisão e justificativa. |

## 8. Próxima validação necessária

A conexão está pronta para o próximo ciclo, mas a validação de escrita e evento em tempo real deve ocorrer exclusivamente com dados descartáveis. O ideal é criar um projeto de homologação Supabase separado, carregado com dados sintéticos e três contas de teste: usuário comum, compositor aprovado e administrador. Esse ambiente permitirá testar criação, edição, moderação, upload, mudança de status e Realtime com rollback, sem expor produção nem comprometer o acervo atual.

Até que essa homologação exista, a intervenção recomendada é somente de **bloqueio de risco**: corrigir as políticas anônimas, revisar views expostas e validar por contagem que tabelas privadas não retornam linhas a `anon`. Em seguida, o catálogo de cifras e o painel de compositor devem ser tratados como correções de funcionalidade, pois ambos já possuem dados reais para exibir.

## Referências

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase — Row Level Security"

[2]: https://supabase.com/docs/guides/realtime/postgres-changes "Supabase — Postgres Changes / Realtime"

---

**Status:** conexão real validada; exposição RLS e falhas de catálogo/dashboard confirmadas; nenhuma mutação persistente realizada.
