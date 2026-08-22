# Classificação das URLs não indexadas — Fase 2

## Resultado real do Search Console

A propriedade `https://www.canticosccb.com.br/` apresenta **1.116 URLs não indexadas**, distribuídas por dez motivos, conforme relatório atualizado em 16/08/2026.

| Motivo | URLs | Percentagem aproximada | Decisão operacional |
|---|---:|---:|---|
| Detectada, mas não indexada no momento | 629 | 56,4% | Tratar como oportunidade editorial e de descoberta; não pedir indexação em massa. |
| Página alternativa com canonical adequada | 311 | 27,9% | Manter fora do sitemap quando forem variantes; confirmar destino canónico. |
| Rastreada, mas não indexada no momento | 100 | 9,0% | Auditar valor, duplicação, profundidade e links internos. |
| Soft 404 | 30 | 2,7% | Corrigir conteúdo vazio ou devolver 404 verdadeiro. |
| Erro no servidor (5xx) | 27 | 2,4% | Prioridade técnica máxima; investigar SSR, Supabase e logs. |
| `noindex` | 8 | 0,7% | Preservar apenas em áreas intencionalmente privadas ou de baixa qualidade. |
| Redirecionamento | 5 | 0,4% | Remover URL redirecionada do sitemap e manter apenas o destino. |
| Canonical escolhida pelo Google diferente | 3 | 0,3% | Corrigir divergência entre canonical, conteúdo e ligações internas. |
| Bloqueada por robots.txt | 2 | 0,2% | Desbloquear somente páginas públicas legítimas. |
| 404 | 1 | 0,1% | Retirar do sitemap; restaurar apenas se a página for necessária e válida. |

A soma dos motivos é 1.116 URLs. A maior parte não representa erro técnico: 729 URLs estão nas categorias “detectada” ou “rastreada”, enquanto 314 são variantes/canónicas. As correções de código devem concentrar-se primeiro nas 27 respostas 5xx e nos 30 soft 404.

## Cruzamento com o sitemap atual

O asset local `public/sitemap.xml` contém **2.238 URLs**. A distribuição sintática observada é:

| Tipo de URL | Quantidade aproximada |
|---|---:|
| `/hino/...` | 1.117 |
| `/album/...` | 629 |
| `/compositor/...` | 7 |
| `/cifra/...` | 469 |
| `/hinario/...` | 321 |
| `/categoria/...` | 26 |
| `/playlist/...` | 154 |
| Hubs estáticos de cifras | 5 |
| `/instrumentais` | 1 |
| Hubs `baixar...` | 3 |

Estas contagens são de famílias de URL e não provam que cada família corresponde a um motivo individual no Search Console. Em particular, a coincidência entre 629 URLs de álbuns no sitemap e 629 URLs “detectadas mas não indexadas” é apenas uma hipótese de trabalho, não uma identificação causal. O CSV de URLs individuais não ficou disponível no diretório de downloads durante a auditoria; por isso, não se deve solicitar validação em massa nem excluir uma família inteira sem essa correspondência.

## Revisão segura aplicada

O gerador de sitemap já evita promover hubs de cifras quando não existem cifras publicadas e seleciona `updated_at`/`created_at` para `lastmod` de compositores. A regra deve continuar conservadora: somente itens publicados, não vazios, acessíveis e com direitos documentados devem entrar no sitemap.

A próxima alteração de código recomendada é enriquecer os filtros de publicação das entidades dinâmicas, mas apenas depois de confirmar os nomes dos campos no schema real do Supabase. Não é seguro presumir que `hinos.ativo = true` seja equivalente a “publicado com direitos aprovados”, nem que todos os álbuns tenham conteúdo não vazio.

## Ordem de execução

1. Analisar as 27 URLs 5xx por amostragem no relatório de páginas e nos logs de produção.
2. Auditar as 30 soft 404 e distinguir páginas sem dados de páginas com resposta SSR inadequada.
3. Confirmar as 311 canonicals alternativas e retirar do sitemap somente variantes comprovadas.
4. Validar as 8 páginas `noindex`, 5 redirecionamentos, 2 bloqueios por robots e o 404.
5. Só depois ajustar definitivamente o sitemap e pedir nova leitura/validação no Search Console.

> O objetivo desta fase é reduzir sinais de baixa qualidade e erros técnicos, não maximizar artificialmente o número de URLs no índice.
