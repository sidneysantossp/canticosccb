# Relatório do drilldown soft 404 — Cânticos CCB

## Fonte analisada

O ficheiro `https___www.canticosccb.com.br_-Coverage-Drilldown-2026-08-20(1).xlsx` contém 30 URLs no separador `Tabela`, com as datas de último rastreamento. O Search Console classificou o conjunto como `Erro soft 404`.

## Diagnóstico individual

A validação em produção mostrou que 29 URLs são caminhos legados inexistentes, todos fora do sitemap atual, e respondem HTTP 404 real. Os caminhos pertencem principalmente a estruturas antigas como `/radios/`, `/musicas/`, `/cds/`, `/cantores/`, `/letras/`, `/categories/` e `/messages`. Como não há rota pública equivalente comprovada para cada endereço, manter 404 é a resposta correta; não foram criados redirects inventados.

A única exceção foi `/index.php`, que respondia HTTP 200 com a homepage e `robots: index, follow`. Isso é uma duplicação da homepage e corresponde a um soft 404 clássico: a URL antiga não era redirecionada nem identificada como canónica.

## Correção aplicada

Foi adicionado no `vercel.json` um redirect permanente de `/index.php` para `/`. O commit publicado foi `96cb495`.

Após a propagação do deploy, a validação confirmou:

| URL | Resultado pós-correção |
|---|---|
| `/index.php` | HTTP 308, `Location: /` |
| 29 caminhos legados restantes | HTTP 404 real, fora do sitemap |

## Resultado operacional

O sitemap atual não contém nenhuma das 30 URLs analisadas. Portanto, não foi necessário remover entradas do sitemap. A correção foi aplicada somente onde existia uma duplicação real; as restantes páginas permanecem 404 para evitar redirecionamentos incorretos e conteúdo fictício.

Recomenda-se agora clicar em **Validar correção** no Search Console para o motivo `Erro soft 404`. O Google deverá retirar gradualmente as 29 URLs legadas do relatório e deixar de considerar `/index.php` como duplicação quando processar o redirect 308.
