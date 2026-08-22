# Auditoria inicial do diretório de cifras — 21/08/2026

## Conclusão executiva

A auditoria **não confirma 480 hinos do Hinário 5 com cifras publicadas**. O sitemap público contém **464 URLs de detalhe `/cifra/`**, mas essa contagem inclui hinos avulsos e não equivale automaticamente a 480 hinos numerados. O snapshot local de emergência também não é uma fonte de produção: contém 613 hinos, apenas 28 números distintos entre 1 e 480 e somente cinco letras preenchidas, pelo que não deve ser usado para declarar cobertura do hinário.

A base Supabase correta é o projeto `canticosccb` da organização Canticos CCB, identificado no dashboard autenticado como `vxzyujmqiqenevoatmgy`. O dashboard apresenta alerta de esgotamento de múltiplos recursos. A consulta de metadados no SQL Editor não retornou tabelas e mostrou erro interno `Too small: expected string to have >=1 characters`; o conector Supabase MCP também não tem permissão para esse projeto. Assim, ainda não foi executada uma contagem SQL confiável da base.

## SEO público observado

As páginas de detalhe estão acessíveis e respondem HTTP 200. O template atual gera canonical e `robots: index, follow`. No entanto, o formato de título é inconsistente com o solicitado. Alguns exemplos públicos seguem `Hino 1 CCB - Cristo Meu Mestre - Elias Brandão - Cifra Hino 1 CCB`, enquanto outros usam `Hino Avulso Adoração | Tom E | Cânticos CCB` ou `Na Face Um Sorriso | Tom C | Cânticos CCB`. Portanto, não existe ainda um padrão universal `CIFRA Hino {número} - {título} - Cânticos CCB`.

As meta descrições também variam. Algumas contêm instrumento e tom, mas outras apenas indicam o tom e a disponibilidade da página. O template SSR atual usa `seo_title` e `seo_description` quando preenchidos e um fallback baseado em título/tom; ele ainda não garante, em todas as páginas, os termos `CIFRA`, `Hino`, número, `Violão`, `Ukulele` e `Teclado`.

## Instrumentos e hubs

O sitemap possui um hub geral de cifras e hubs de Violão, Ukulele e Teclado. Em produção, `/cifras` e `/cifras-violao-ccb` respondem 200, com canonical e `index, follow`. Porém, `/cifras-ukulele-ccb` e `/cifras-teclado-ccb` respondem 200 com `noindex, follow` e sem canonical observável, o que impede que esses hubs sejam usados como páginas SEO indexáveis.

## Próxima correção necessária

Antes de gerar ou alterar 480 cifras, é necessário obter uma contagem SQL autorizada das tabelas reais e confirmar a definição de “cifrado”: versão publicada, conteúdo de acordes, instrumento e relação com os hinos 1–480. Depois disso, a implementação deve normalizar títulos e meta descrições, adicionar os instrumentos suportados de forma verdadeira e só colocar no sitemap páginas que tenham conteúdo publicado e autorizado.
