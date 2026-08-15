# Homologação RLS — 13 de agosto de 2026

## Pré-condições verificadas

Uma consulta somente leitura no SQL Editor do projeto de produção confirmou a existência de 37 políticas para as cinco tabelas prioritárias (`users`, `composers`, `composer_documents`, `notifications` e `playlists`). O conjunto ainda contém permissões históricas que precisam ser substituídas pela migração P0.

A consulta ao catálogo de Storage confirmou que o bucket `documents` está com `public = true`. Portanto, os documentos de compositores permanecem publicamente endereçáveis até a etapa controlada de endurecimento.

## Etapa 1/3 — View pública compatível

Com confirmação explícita do responsável, foi executada no projeto de produção a criação/atualização de `public.composer_public_profiles`. A view contém apenas campos públicos de compositores e concede exclusivamente `SELECT` para os papéis `anon` e `authenticated`.

A execução retornou **Success. No rows returned**. Esse resultado confirma a conclusão do DDL; ele não significa ausência da view. Nesta etapa, nenhuma política existente foi revogada, nenhum registro foi criado/alterado/excluído e o bucket `documents` não teve sua visibilidade modificada.

## Próximos controles

1. Verificar a distribuição dos valores `status` e `verified` em `public.composers`, pois a view pode legitimamente retornar zero perfis quando não há registros simultaneamente aprovados e verificados.
2. Validar a consulta pública no preview local.
3. Versionar e publicar o frontend que consome a view.
4. Somente após a publicação, solicitar confirmação específica para aplicar a migração RLS P0 transacional e tornar os documentos privados.

## Validação da cobertura da view

A consulta somente leitura agrupada por `status` e `verified` revelou: **5** compositores com `status = 'active'` e `verified = true`, **1** com `status = 'approved'` e `verified = true` e **2** registros excluídos, não verificados. Portanto, o filtro inicial que aceitava apenas `status = 'approved'` subrepresentaria perfis públicos válidos. A definição da view foi corrigida com sucesso para incluir os estados `active` e `approved`, preservando a exigência de verificação. O SQL Editor retornou **Success. No rows returned** para o ajuste.

O preview local em `http://127.0.0.1:5174/compositores` respondeu HTTP 200. O navegador de homologação ficou indisponível durante a renderização, por isso a verificação de dados foi concluída diretamente pela API REST pública, usando a chave anônima do ambiente local. A view respondeu registros de compositores com apenas `id`, `name`, `artistic_name` e `slug`, confirmando que os campos públicos selecionados estão acessíveis ao frontend sem expor e-mail nesta consulta. A API confirmou `content-range: 0-0/6`, equivalente a **6** perfis públicos. Por fim, `npm run build` e `npx tsc --noEmit` foram concluídos com sucesso.
