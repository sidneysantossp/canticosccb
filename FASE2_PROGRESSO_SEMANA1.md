# Fase 2 — progresso inicial

## Entregas concluídas

A política editorial de direitos e o modelo de consentimento foram criados. O sitemap passou a conseguir remover hubs de cifras sem itens publicados quando o build tiver acesso aos dados do Supabase; as rotas continuam disponíveis na aplicação. O gerador de sitemap dos compositores passou a selecionar datas de criação e atualização para produzir `lastmod` mais fiel. As alterações técnicas e os documentos foram publicados no branch `main` no commit `7071565`.

## Validação

Type-check, build SEO e auditoria de assets passaram. A auditoria SEO manteve as 26 verificações aprovadas. A produção respondeu corretamente nas rotas públicas verificadas e o Search Console confirmou que o sitemap está processado.

## Baseline real do Search Console

| Métrica | Valor observado | Interpretação |
|---|---:|---|
| Cliques orgânicos | 4.150 | Já existe procura orgânica mensurável. |
| Impressões | 311.000 | Há alcance relevante para otimizar. |
| CTR média | 1,3% | Prioridade para títulos, descrições, intenção e qualidade de snippets. |
| Posição média | 7,5 | O domínio aparece em média na primeira página, mas há margem para melhorar CTR. |
| Páginas indexadas | 796 | Base indexada atual. |
| Páginas não indexadas | 1.116 | Necessário classificar exclusões no relatório de Páginas. |
| Sitemap processado | 2.237 URLs encontradas | O sitemap é aceite pelo Google; isso não significa indexação integral. |
| Breadcrumbs válidos | 41 | Não há entidades inválidas nessa melhoria. |
| Core Web Vitals | 45 URLs ruins no telemóvel e 44 no computador | Prioridade técnica de performance na Fase 2. |

Os cliques do Search Console não são equivalentes a sessões ou visitas da plataforma. A definição operacional de “visita” continua a exigir analytics do site.

## Próximas ações prioritárias

A próxima execução deve abrir o relatório de Páginas do Search Console e classificar as 1.116 URLs não indexadas. Em seguida, deve rever as URLs do sitemap contra conteúdos publicados, excluir rascunhos, vazios e material sem autorização, e implementar os eventos mínimos de analytics. O Composer Panel deve manter o fluxo de consentimento e submissão real antes de aumentar a cadência de publicação.

O objetivo de 1 milhão de visitas deve ser recalculado depois de obter sessões reais do site, mas os 311 mil de impressões e 4.150 cliques fornecem a primeira baseline externa confiável para a estratégia SEO.
