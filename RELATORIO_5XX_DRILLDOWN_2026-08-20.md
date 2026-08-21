# Relatório do drilldown 5xx — Cânticos CCB

## Fonte analisada

O ficheiro `https___www.canticosccb.com.br_-Coverage-Drilldown-2026-08-20.xlsx` contém 27 URLs no separador `Tabela`, com as respetivas datas de último rastreamento. O problema indicado pelo Search Console é `Erro no servidor (5xx)`.

## Diagnóstico inicial

Na primeira validação contra produção, **26 das 27 URLs já respondiam HTTP 200**. A única falha persistente era:

`https://www.canticosccb.com.br/hinos-avulsos-ccb`

Essa rota devolvia HTTP 503, `Cache-Control: no-store`, `Retry-After: 120` e uma página de serviço temporariamente indisponível. A causa estava no handler SSR `handleHymnHub`: a rota consultava o catálogo dinâmico através de `fetchHymnsByKeyword('avulsos')`; qualquer falha do Supabase propagava para o handler global e convertia uma página pública em 503.

## Correção aplicada

O handler agora captura a indisponibilidade dinâmica apenas nesse hub, serve o conteúdo editorial estático sem inventar itens de acervo, indica que o catálogo está temporariamente indisponível, mantém a rota em `noindex` enquanto não há dados dinâmicos e evita que uma falha transitória do Supabase gere um erro 5xx.

A alteração foi publicada no commit `9bab651` e acionou o deploy de produção.

## Validação pós-deploy

Após o deploy, todas as 27 URLs do Excel foram testadas novamente com User-Agent de Googlebot:

| Resultado | Quantidade |
|---|---:|
| HTTP 200 | 27 |
| HTTP 5xx | 0 |
| HTTP 404 | 0 |
| Redirecionamento como resultado final | 0 |

A rota anteriormente problemática passou a responder HTTP 200, com título `Hinos Avulsos CCB | Repertório Avulso da CCB | Cânticos CCB`, `X-Robots-Tag: noindex, follow` e fallback editorial explícito. A resposta continua sem indexação durante a indisponibilidade do catálogo, o que evita promover uma página incompleta ao índice.

## Conclusão

O drilldown fornecido pelo utilizador permitiu eliminar o único 5xx reproduzível no conjunto de 27 URLs. Os outros 26 já estavam recuperados no momento da auditoria, o que sugere que os erros registados pelo Google foram transitórios ou ocorreram antes das correções SSR anteriores. Recomenda-se agora solicitar no Search Console a validação do motivo `Erro no servidor (5xx)` e monitorizar novamente a rota `/hinos-avulsos-ccb` após a próxima leitura do Google.
