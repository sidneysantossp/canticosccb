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
