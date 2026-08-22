# Análise do export Coverage — 20/08/2026

## Escopo do ficheiro recebido

O ZIP `https___www.canticosccb.com.br_-Coverage-2026-08-20.zip` contém quatro CSVs: `Gráfico.csv`, `Problemas críticos.csv`, `Problemas não críticos.csv` e `Metadados.csv`. O export é um resumo agregado do relatório de Coverage; não contém uma lista individual das URLs afetadas nem ficheiros separados por motivo.

O campo de metadados indica `Sitemap: Todas as páginas conhecidas`. Portanto, os números devem ser comparados com o relatório geral de indexação do Search Console, e não interpretados como “somente URLs presentes no sitemap”.

## Motivos e contagens confirmados

| Motivo | Páginas | Fonte | Validação |
|---|---:|---|---|
| Página alternativa com tag canónica adequada | 311 | Site | Não foi iniciado |
| Erro soft 404 | 30 | Site | Não foi iniciado |
| Erro no servidor (5xx) | 27 | Site | Não foi iniciado |
| Excluída pela tag `noindex` | 8 | Site | Não foi iniciado |
| Página com redirecionamento | 5 | Site | Não foi iniciado |
| Bloqueada pelo robots.txt | 2 | Site | Não foi iniciado |
| Não encontrado (404) | 1 | Site | Não foi iniciado |
| Rastreada, mas não indexada no momento | 100 | Sistemas do Google | Não foi iniciado |
| Cópia com canonical diferente escolhida pelo Google e pelo utilizador | 3 | Sistemas do Google | Não foi iniciado |
| Detectada, mas não indexada no momento | 629 | Sistemas do Google | Aprovado |
| **Total** | **1.116** |  |  |

## Evolução temporal

O CSV de gráfico contém 88 observações diárias de 21/05/2026 a 16/08/2026. No primeiro dia havia 1.171 páginas não indexadas e 681 indexadas; no último, 1.116 não indexadas e 796 indexadas. A variação líquida foi de **menos 55 não indexadas** e **mais 115 indexadas**.

| Indicador | Primeiro dia | Último dia | Mínimo | Máximo | Variação líquida |
|---|---:|---:|---:|---:|---:|
| Não indexadas | 1.171 | 1.116 | 1.103 | 1.208 | -55 |
| Indexadas | 681 | 796 | 639 | 796 | +115 |
| Impressões | 831 | 5.629 | 758 | 6.766 | +4.798 |

A série mostra uma melhoria estrutural até 16/08, mas com saltos de atualização: entre 13/08 e 14/08 as não indexadas caíram de 1.140 para 1.116 e as indexadas subiram de 763 para 796. Isto é compatível com reprocessamento do Google e não prova que uma alteração específica de código tenha causado toda a variação.

## Cruzamento com o sitemap

O sitemap local contém 2.238 URLs e já passou no validador estrutural com 0 erros. O ZIP não permite afirmar quais URLs do sitemap correspondem aos 27 erros 5xx, 30 soft 404 ou 311 canonicals alternativas, porque a exportação recebida não possui a coluna de URL nem amostras por motivo.

Consequentemente, não foram removidas famílias inteiras do sitemap por inferência. A ação segura continua a ser: obter o export de URLs individuais por motivo ou abrir cada motivo no Search Console e exportar a tabela detalhada; depois cruzar por URL com o sitemap, testar a resposta HTTP/canonical/robots e aplicar alterações apenas às URLs comprovadas.

## Próxima decisão técnica

Os 27 erros 5xx são o primeiro alvo porque representam falha do servidor. A seguir devem ser analisadas as 30 soft 404, as 311 URLs canónicas alternativas e as 100 rastreadas mas não indexadas. O export atual já é suficiente para consolidar a baseline e confirmar a evolução, mas não para editar o sitemap por URL.
