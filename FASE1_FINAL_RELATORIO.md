# Relatório final da Fase 1 — Cânticos CCB

## Correções aplicadas

Foram aplicadas três correções seguras. O SSR passou a devolver `Retry-After: 120` quando o Supabase está indisponível, mantendo 503 e `noindex, follow` em vez de mascarar uma falha de dependência como 404. O cache das páginas SSR públicas passou para `s-maxage=86400` com `stale-while-revalidate=604800`, reduzindo leituras repetidas ao Supabase para páginas públicas estáveis. O gerador de sitemap passou a selecionar `updated_at` e `created_at` dos perfis públicos de compositores, permitindo `lastmod` mais fiel.

O smoke test SEO também foi corrigido para distinguir um 404 confirmado de um 503 causado por indisponibilidade do Supabase. Quando encontra 503, exige `Retry-After`, robots `noindex, follow`, ausência de canonical e uma resposta HTML de erro estruturada.

## Validação final

| Verificação | Resultado |
|---|---:|
| `npm run type-check` | Aprovado, código 0 |
| `npm run build:check` | Aprovado, código 0 |
| `npm run audit:seo` | Aprovado, 26 verificações |
| Smoke SEO contra produção | Aprovado, código 0 |
| `/hinos-ccb` em produção | HTTP 200, SSR, canonical e indexação corretos |
| `/hinario/1` em produção | HTTP 200, SSR, canonical e indexação corretos |
| Rota desconhecida | HTTP 404, sem canonical e `noindex, follow` |
| Hino inexistente com Supabase indisponível | HTTP 503, `Retry-After`, sem canonical e `noindex, follow` |
| `/hinos` legado | Redirecionamento permanente para `/hinos-ccb` |

## Estado de saída

A Fase 1 está concluída e validada. A indexação técnica, o SSR público, os assets de descoberta e os headers de cache estão operacionais. O comportamento 503 em páginas que precisam de Supabase é explícito e não produz indexação de conteúdo incompleto. O próximo passo recomendado é a Fase 2: escalar o acervo e a confiança, começando por direitos, Composer Panel, páginas vazias, qualidade editorial e métricas reais.

## Pontos que continuam dependentes de dados/produção

A amostragem de 2.238 URLs do sitemap precisa ser revista contra os dados atuais para excluir rascunhos, álbuns vazios e páginas sem conteúdo autorizado. A análise do Search Console e de analytics ainda requer acesso configurado e uma janela real de observação; não foram inventados números de tráfego.
