Confirmação do fecho da Fase 1
- Pode ser encerrada. Evidências: SSR com 503 + Retry-After:120 e noindex, follow quando o Supabase falha; cache público ajustado para s-maxage=86400 e stale-while-revalidate=604800; sitemap a usar created_at/updated_at para lastmod; smoke SEO atualizado e a passar em produção; rotas principais 200 com canonicals e indexação corretas; 404 conforme; redirecionamento legado ativo.
- Ressalvas a registar (devem transitar como tarefas iniciais da Fase 2):
  - Rever a amostragem do sitemap (2.238 URLs) para remover rascunhos, álbuns vazios e páginas sem conteúdo autorizado.
  - Ativar e dar acesso ao Search Console e analytics; aguardar janela real de observação (não inventar métricas).
  - Monitorização de uptime do Supabase e das rotas críticas ainda não confirmada.
  - Otimizações pendentes para Supabase Free: deduplicação de queries, ETag/If-None-Match e cache por chave em memória/edge.

Critérios de entrada para a Fase 2 (gate antes de iniciar publicação em escala)
- Master principal com type-check e build a 0 erros e smoke SEO a passar contra produção.
- Política de direitos aprovada por escrito (ver abaixo) e processos de prova/licença definidos.
- Sitemaps a excluir explicitamente páginas não publicáveis (ou, temporariamente, essas páginas marcadas noindex até revisão).
- Acesso a Search Console e analytics ativo no domínio de produção.
- Monitorização básica de uptime configurada (Supabase, rotas SSR de hino, hinário e compositores).

Ordem exata de execução da Fase 2 (priorizada por impacto, risco e dependências)

Backlog priorizado
1) Governança editorial e direitos (impacto alto, risco jurídico) — sem isto não escalamos conteúdo.
2) Instrumentação e monitorização (impacto alto, risco baixo) — medir antes de otimizar.
3) Composer Panel MVP (impacto alto, risco controlado com revisão) — desbloqueia aquisição de acervo com consentimento.
4) Remediação de “páginas vazias” e higiene do sitemap (impacto alto imediato em confiança/SEO).
5) Curadoria e escala do acervo + qualidade de página (impacto muito alto, risco moderado).
6) Estabilidade/performance para Supabase Free (impacto médio/alto, risco baixo) — acompanha a escala.
7) Métricas de publicação e painel editorial (impacto alto, risco baixo).

Calendário e execução (6 semanas)

Semana 1 — Direitos, higiene do índice e instrumentação
- Direitos autorais:
  - Entregáveis: rights_policy.md (licenciamento de letras + exigência de consentimento escrito para cifras/partituras), modelo de consentimento, tabela rights_consents no Supabase ligada a hinos/partituras, estados editoriais draft → submitted → approved → published.
  - Critérios de aceitação: nenhuma página com letra sem licença aparece no sitemap; páginas sem corpo licenciado ficam noindex.
- Sitemap e páginas vazias:
  - Tarefas: rever amostra das 2.238 URLs; excluir rascunhos, álbuns vazios e “cifras/partituras” sem itens; esconder de navegação o que não tiver ≥1 item.
  - Entregáveis: sitemaps por tipo (seed inicial: hinos e compositores publicados), job de build diário.
- Instrumentação:
  - Entregáveis: Search Console ligado; analytics de baixo overhead ativo; eventos frontend/backend mínimos (pesquisa interna, visualização de hino, clique em gravação, 404/503).
  - Monitorização: ping externo às rotas críticas + alerta; métrica 503_count por rota.
- Métricas de saída semana 1: sitemaps “limpos” (0 álbuns vazios), GSC a receber sitemaps, eventos a disparar em produção, 503_count a registar.

Semana 2 — Composer Panel MVP e proteção básica do Supabase Free
- Composer Panel:
  - Entregáveis: autenticação + verificação básica; aceitação de termos (com versão); upload de provas de autorização; submissão com anti-duplicado (match por número/título); fila de revisão com aprovar/rejeitar e registo de alterações.
  - Segurança/RLS: submissões só visíveis ao autor e editores; published só por editores.
  - Quotas/rate limits: máximo 5 submissões/dia/utilizador; cooldown de 60s por submissão; verificação de anexos (tipos/size).
- Supabase Free (proteção rápida):
  - Entregáveis: cache SSR básica confirmada; deduplicação de queries no SSR para páginas públicas; introdução de cache por chave em memória/edge para hino:{id} e hinário.
- Métricas: tempos de aprovação e taxa de rejeição por motivo; p95 TTFB de hino/hinário; contagem de leituras por pageview (baseline).

Semana 3 — Normalização e início da escala (+100 hinos)
- Normalização:
  - Entregáveis: títulos/números normalizados; constraints anti-duplicado seguras; ligação gravação ↔ hino canónico; remoção/merge de duplicados evidentes.
- Publicação:
  - Meta: +100 hinos com letra licenciada e metadados completos; zero placeholders.
- Métricas: percentagem de páginas de hino com relação a compositor e a pelo menos 1 gravação/álbum; p95 TTFB após cache.

Semana 4 — Interligação, qualidade de página e sitemaps por tipo
- Interligação e UX:
  - Entregáveis: breadcrumbs; blocos relacionados (álbuns, compositor, gravações); imagem OG por template (título+número+compositor).
- SEO técnico:
  - Entregáveis: sitemaps por tipo (hinos, compositores, álbuns, listas); schema.org revisto (MusicComposition, MusicRecording, MusicAlbum, Person com sameAs).
- Publicação:
  - Meta: +50 hinos licenciados adicionais.
- Métricas: ≥90% dos hinos novos com 1 link para compositor e 1 para gravação/álbum; GSC com ≥90% das URLs dos novos sitemaps como “Válidas” (após indexação).

Semana 5 — Performance/índices e invalidação de cache, primeiras cifras/partituras
- Supabase Free (profundidade):
  - Entregáveis: ETag/If-None-Match nos fetches; índices seguros nas queries com scans; invalidação de cache por tag/chave ao publicar/editar.
- Conteúdo:
  - Meta: +50 hinos licenciados; primeiras cifras/partituras publicadas com consentimento arquivado.
- Métricas: TTFB p95 SSR < 800 ms; 5xx p95 < 0,5%; leituras por página reduzidas face ao baseline semana 2.

Semana 6 — QA editorial, conformidade de direitos e fecho da fase
- QA editorial:
  - Entregáveis: revisão abrangente; limpeza final de álbuns vazios; checklist de direitos cumprida em 100% das páginas com cifras/partituras.
- Painel de redação:
  - Entregáveis: dashboard semanal com conteúdos publicados, taxa de aprovação, tempo médio de revisão, distribuição por tipo.
- Retrospetiva:
  - Entregáveis: relatório de métricas comparativas (4 semanas), lições e backlog da Fase 3.
- Métricas: mediana do tempo de aprovação < 5 dias úteis; 0 incidências de remoção por direitos.

Direitos autorais — política e execução
- Letras:
  - Publicar integrais apenas com licença/autorizações documentadas; sem licença, publicar só metadados e marcar noindex e fora do sitemap.
  - Arquivar prova de licença em rights_consents ligada ao hino; registar: titular, tipo de licença, data, escopo, ficheiro.
- Cifras/partituras:
  - Exigir consentimento escrito do titular; sem consentimento, não publicar placeholders nem promessas.
  - Só expor secções/listas quando houver ≥3 itens publicados.
- Fluxo editorial:
  - Estados: draft → submitted → approved → published; validações obrigatórias: identificadores canónicos, letra validada (se licenciada), créditos, tonalidade/compasso (se aplicável), ligações internas, imagem OG.
- Conformidade contínua:
  - Amostragem mensal de páginas publicadas; 0 reclamações ativas como critério de manutenção.

Composer Panel — requisitos e proteção
- Funcional:
  - Autenticação e verificação básica; aceitação de termos versionados; upload de provas; submissão com anti-duplicado; editor review com histórico.
- Segurança e RLS:
  - RLS: utilizadores só acedem às suas submissões; apenas editores/setor legal podem aprovar e publicar; logs de auditoria.
- Quotas e rate limits:
  - 5 submissões/dia/utilizador; limite de anexos por submissão; controlo de tamanho e MIME; proteção contra abuso no edge/API.
- Telemetria:
  - Registar tempos por etapa, taxa de rejeição por motivo (direitos, duplicado, qualidade).

Proteção do Supabase Free — práticas mandatórias
- Cache:
  - SSR público com s-maxage=86400 e stale-while-revalidate=604800 (já em vigor); cache por chave hino:{id}, hinario; invalidação por tag em alterações.
- Eficiência de queries:
  - Deduplicar queries no SSR; SELECT só colunas necessárias; batch onde aplicável; implementar ETag/If-None-Match para reduzir transferências.
- Índices:
  - Rever planos de execução localmente; criar índices apenas onde houver scans consistentes; validar impacto antes de produção.
- Resiliência:
  - Manter 503 com Retry-After e noindex quando dependências falham; monitorização de uptime e alertas; métrica 503_count por rota.
- Observabilidade:
  - Logs de 4xx/5xx por rota; p95 TTFB; LCP p75 mobile nas páginas críticas.

Métricas e critérios de saída da Fase 2
- Definir “visita” antes do fecho (ex.: sessão de 30 min no analytics).
- Conteúdo e qualidade:
  - ≥ 400 hinos com metadados completos e letra licenciada ou, sem licença, noindex e fora do sitemap.
  - ≥ 100 hinos com cifras/partituras com consentimento arquivado.
  - 0 álbuns vazios indexáveis; 0 páginas “promessa sem conteúdo” no sitemap.
  - ≥ 90% dos hinos com 1 relação para compositor e 1 para gravação/álbum.
- SEO e indexação:
  - Search Console: ≥ 90% das URLs dos sitemaps “Válidas”.
  - Tendência positiva de impressões e cliques orgânicos por 4 semanas consecutivas.
- Estabilidade e performance:
  - 5xx p95 < 0,5% durante 30 dias; 503_count ~0 em hinos inexistentes (distinção 404/503 correta).
  - TTFB p95 SSR < 800 ms; LCP p75 mobile < 2,5 s (amostra de hinos e listagens).
  - Supabase dentro dos limites Free: sem throttling e com leituras médias por página reduzidas pós-cache.
- Processo e direitos:
  - Composer Panel com ≥ 5 compositores verificados; mediana de aprovação < 5 dias úteis.
  - 100% das cifras/partituras com consentimento comprovado; 0 remoções por reclamações.

Definição de pronto para Fase 3
- Quando todos (ou ≥ 85%) dos critérios acima forem cumpridos, avançar para aquisição e expansão, mantendo a política de não publicar dados fictícios e respeitando os limites do Supabase Free.