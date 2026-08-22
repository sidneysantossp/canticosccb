# Baseline real do Google Search Console — 20/08/2026

Propriedade observada: `https://www.canticosccb.com.br/` na conta Google `sid.websp@gmail.com`.

A visão geral mostra **4.150 cliques da Pesquisa Google** no período visível de 19/05/2026 a 11/08/2026. O gráfico apresenta tendência de crescimento diário, mas não foi registado neste documento um total de impressões, CTR ou posição média porque a visão geral não os exibiu.

Na indexação, o Search Console mostra **796 páginas indexadas** e **1.116 páginas não indexadas**. Estes números confirmam que a limpeza do sitemap e a investigação de exclusões devem ser prioridade da Fase 2.

Na experiência, a área de Core Web Vitals apresenta 0 URLs boas e 0 com melhorias necessárias nos cartões visíveis, enquanto aparecem 45 URLs classificadas como ruins no telemóvel e 44 como ruins no computador. HTTPS mostra 45 URLs HTTPS e 0 não HTTPS. Indicadores de localização atual mostram 41 válidos e 0 inválidos.

Estas observações são uma fotografia da visão geral no momento da auditoria. Não devem ser convertidas diretamente em “visitas”; cliques da Pesquisa Google são uma métrica de aquisição diferente de sessões no site. É necessário abrir os relatórios de Desempenho, Páginas, Sitemaps e Core Web Vitals para identificar causas, páginas e períodos.

## Relatório de desempenho

No relatório de desempenho, com intervalo selecionado de 3 meses, foram observados **4,15 mil cliques**, **311 mil impressões**, **CTR média de 1,3%** e **posição média de 7,5**. O período visível é aproximadamente de 19/05/2026 a 11/08/2026 e a última atualização indicada era de cerca de 7 horas antes da consulta.

Estes dados mostram que já existe procura orgânica mensurável e que a plataforma aparece, em média, na primeira página, mas a CTR de 1,3% é uma oportunidade clara de melhoria através de títulos, descrições, canonicals, conteúdo da página e correspondência com a intenção da pesquisa. Estes cliques não equivalem às visitas/sessões totais da plataforma.

## Sitemaps

O Search Console mostra `/sitemap.xml` como **Processado**, com última leitura em 18/08/2026 e **2.237 páginas encontradas**. O sitemap foi enviado originalmente em 22/02/2026. Não foram observados erros de processamento nesta tela. A diferença entre 2.237 URLs encontradas pelo Google e 2.238 URLs verificadas localmente deve ser tratada como variação de contagem até a próxima leitura da versão publicada após o deploy.

O facto de o sitemap ser processado não significa que todas as URLs estejam indexadas: a visão geral mostra 796 indexadas e 1.116 não indexadas. A próxima ação deve ser abrir o relatório de Páginas e classificar as exclusões, especialmente páginas vazias, duplicadas, canónicas alternativas e páginas rastreadas mas não indexadas.

## Dados estruturados observados

A área de Indicadores de localização atual (breadcrumbs) mostra **41 itens válidos** e **0 entidades inválidas**, sem erro crítico, com atualização em 18/08/2026. Isto confirma que o Schema de breadcrumbs já está a ser reconhecido pelo Google; a prioridade de dados estruturados deve concentrar-se agora em páginas de hino, gravações, álbuns e perfis, sem degradar os breadcrumbs existentes.

## Consultas de maior procura

No relatório de desempenho, as principais consultas observadas foram: `hinos ccb` com 500 cliques e 77.025 impressões; `canticos ccb` com 321 cliques e 652 impressões; `ccb hinos` com 144 cliques e 8.787 impressões; `baixar hinos ccb` com 124 cliques e 671 impressões; `hinos ccb cantados hinário 5 do 1 ao 480 mp3 download` com 99 cliques e 2.851 impressões; `cânticos ccb` com 86 cliques e 254 impressões; `canticosccb` com 74 cliques e 131 impressões; e `hinos da ccb` com 47 cliques e 20.407 impressões.

A procura concentra-se em hubs de hinos, hinário, letras, áudio e downloads. O sitemap deve priorizar páginas reais que respondam a essas intenções, evitando indexar páginas vazias ou rotas que prometem cifras/partituras sem conteúdo.

## Categorias reais das 1.116 URLs não indexadas

O relatório de Indexação de páginas do Search Console, atualizado em 16/08/2026, apresenta dez motivos:

| Motivo | Páginas | Fonte | Tratamento inicial |
|---|---:|---|---|
| Detectada, mas não indexada no momento | 629 | Sistemas do Google | Prioridade de conteúdo, qualidade, links internos e amostragem; não forçar indexação em massa. |
| Página alternativa com tag canónica adequada | 311 | Site | Verificar se são variantes corretas; manter fora do sitemap se a canonical apontar para a página principal. |
| Rastreada, mas não indexada no momento | 100 | Sistemas do Google | Auditar conteúdo raso, duplicação, valor da página e ligações internas. |
| Erro soft 404 | 30 | Site | Corrigir conteúdo vazio/insuficiente, responder 404 real ou enriquecer a página se existir conteúdo legítimo. |
| Erro no servidor (5xx) | 27 | Site | Investigar rotas, SSR, Supabase e logs; é a categoria técnica mais urgente. |
| Excluída pela tag `noindex` | 8 | Site | Confirmar que são áreas privadas ou páginas intencionalmente excluídas; não remover noindex indiscriminadamente. |
| Página com redirecionamento | 5 | Site | Confirmar destino 301/308 e retirar variantes redirecionadas do sitemap. |
| Cópia com canonical diferente escolhida pelo Google e pelo utilizador | 3 | Sistemas do Google | Auditar divergência de canonical, links e conteúdo duplicado. |
| Bloqueada pelo robots.txt | 2 | Site | Confirmar se são áreas privadas; só desbloquear páginas públicas legítimas. |
| Não encontrado (404) | 1 | Site | Retirar do sitemap e manter 404/noindex, salvo se houver URL canónica válida a restaurar. |

A soma é 1.116 URLs. A categoria prioritária para alteração de código é `Erro no servidor (5xx)`; as categorias `soft 404`, canónicas alternativas, redirecionamentos e `noindex` devem ser cruzadas com o sitemap antes de qualquer pedido de validação no Search Console. A categoria `Detectada, mas não indexada` representa a maior oportunidade editorial, mas não deve ser tratada como erro técnico automaticamente.

Fonte: propriedade autenticada do Google Search Console `https://search.google.com/search-console/index?resource_id=https%3A%2F%2Fwww.canticosccb.com.br%2F`, atualização indicada de 16/08/2026.
