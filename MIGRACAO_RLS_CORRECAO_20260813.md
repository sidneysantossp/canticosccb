# Correção de Compatibilidade da Migração RLS — 13 de agosto de 2026

## Tentativa de aplicação

Após a publicação e a validação do frontend compatível, a migração `20260813_p0_secure_private_data_rls.sql` foi executada no SQL Editor do Supabase de produção com autorização explícita. O editor retornou o erro PostgreSQL `42883: operator does not exist: text = uuid`.

A migração está delimitada por `BEGIN` e `COMMIT`. Como a execução foi interrompida pelo erro, a transação não foi confirmada e nenhuma das revogações de políticas, alterações de bucket, funções ou gatilhos previstos foi aplicada parcialmente.

## Próxima ação controlada

O erro indica uma incompatibilidade entre uma coluna de relacionamento armazenada como texto no schema existente e o valor `auth.uid()` do Supabase, que é UUID. A consulta somente leitura confirmou que todas as chaves avaliadas são UUID, exceto `public.playlists.user_id`, que é `text`. Uma segunda consulta agregada confirmou 200 playlists, das quais 196 possuem identificador no formato UUID e nenhuma possui identificador ausente. A correção foi limitada às cinco comparações de proprietário da tabela `playlists`, convertendo explicitamente `auth.uid()` para texto. O patch foi versionado e publicado no commit `ce33adf`.

## Aplicação corrigida

A versão corrigida da migração foi reaplicada com autorização explícita e concluída com sucesso. O resultado final de verificação retornou `storage.buckets.documents.public = false`, confirmando que o bucket de documentos deixou de ser público.

## Validação anônima pós-RLS

Com a chave anônima, as rotas REST de `users`, `composer_documents`, `notifications`, `composers` e `playlists` retornaram HTTP 401, enquanto `composer_public_profiles` continuou disponível com 6 perfis. O bloqueio das quatro primeiras tabelas confirma a contenção da exposição privada. Para playlists, entretanto, a migração havia criado corretamente a política RLS de visibilidade pública, mas o `REVOKE ALL` anterior não era acompanhado do privilégio de tabela `SELECT` para `anon`; isso bloqueava também as playlists públicas. Uma consulta administrativa agregada confirmou 153 playlists públicas e 47 privadas. O patch complementar adiciona somente `GRANT SELECT ON public.playlists TO anon`, mantendo a política que limita as linhas anônimas a `is_public = true`. A concessão foi aplicada com sucesso e a validação REST final confirmou: `users`, `composer_documents`, `notifications` e `composers` continuam em HTTP 401; `playlists` retorna exatamente 153 linhas públicas; e `composer_public_profiles` retorna exatamente 6 perfis.
