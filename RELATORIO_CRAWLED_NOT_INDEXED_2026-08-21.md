# Relatório de URLs rastreadas mas não indexadas — 21/08/2026

## Fonte e escopo

O drilldown `https___www.canticosccb.com.br_-Coverage-Drilldown-2026-08-21.xlsx` contém 100 URLs, com datas de último rastreamento, no motivo `Rastreada, mas não indexada no momento`.

## Validação em produção

| Resultado | Quantidade |
|---|---:|
| HTTP 200 | 82 |
| HTTP 404 real | 16 |
| HTTP 503 inicial | 1 |
| Falha de requisição por URL malformada no export | 1 |

Quanto ao sitemap, 70 URLs estavam presentes e 30 estavam fora dele. As URLs 200 presentes no sitemap concentram-se em páginas de hinos, hinário e álbuns, que são candidatos legítimos a indexação; não devem ser removidas em massa apenas por estarem no estado “rastreada, mas não indexada”.

## Exceções relevantes

A URL `https://www.canticosccb.com.br/categoria/hinos-cantados` devolvia 503 porque o handler SSR propagava falhas do Supabase durante a consulta de relações e hinos. Foi aplicado fallback seguro: o handler conserva nome, descrição, canonical e navegação da categoria, não inventa hinos, informa indisponibilidade do catálogo e marca a página como `noindex` enquanto os dados dinâmicos não estão disponíveis. Após o deploy, a URL passou a responder HTTP 200 com `X-Robots-Tag: noindex, follow`.

A URL `https://www.canticosccb.com.br/categoria/ingles` responde HTTP 200 com canonical correta, mas sem hinos publicados e sinal textual de conteúdo vazio. Ela deve permanecer fora do índice até existir conteúdo real ou relações válidas; o relatório do Search Console deve ser tratado como problema editorial, não como erro de servidor.

As 16 URLs com 404 pertencem a estruturas legadas (`/cds/`, `/musicas/`, `/radios/`, `/letras/`, `/categorias/`, `/2010/`, `/busca` e `/recem-chegados`) e estão fora do sitemap. Mantê-las como 404 real é mais seguro do que criar redirects sem correspondência comprovada. A URL com query e quebra de linha no Excel foi tratada como export malformado e respondeu 404 quando normalizada para o endereço observável.

## Interpretação editorial

As 81 URLs classificadas como candidatas 200 indexáveis precisam de uma análise de qualidade por família: títulos, descrição, canonical, links internos, diferenciação entre conteúdo de catálogo e páginas duplicadas. A ausência de indexação não demonstra, por si só, falha técnica. O próximo passo deve ser melhorar as páginas de maior procura e confirmar dados editoriais/direitos, não solicitar indexação em massa.

## Validação técnica

Type-check, auditoria SEO com 26 verificações e validação do sitemap com 2.238 URLs e 0 erros passaram antes do deploy. A correção foi publicada no commit `89684a9`.
