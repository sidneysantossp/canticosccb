# Correção de Compatibilidade da Migração RLS — 13 de agosto de 2026

## Tentativa de aplicação

Após a publicação e a validação do frontend compatível, a migração `20260813_p0_secure_private_data_rls.sql` foi executada no SQL Editor do Supabase de produção com autorização explícita. O editor retornou o erro PostgreSQL `42883: operator does not exist: text = uuid`.

A migração está delimitada por `BEGIN` e `COMMIT`. Como a execução foi interrompida pelo erro, a transação não foi confirmada e nenhuma das revogações de políticas, alterações de bucket, funções ou gatilhos previstos foi aplicada parcialmente.

## Próxima ação controlada

O erro indica uma incompatibilidade entre uma coluna de relacionamento armazenada como texto no schema existente e o valor `auth.uid()` do Supabase, que é UUID. A consulta somente leitura confirmou que todas as chaves avaliadas são UUID, exceto `public.playlists.user_id`, que é `text`. Uma segunda consulta agregada confirmou 200 playlists, das quais 196 possuem identificador no formato UUID e nenhuma possui identificador ausente. A correção foi limitada às cinco comparações de proprietário da tabela `playlists`, convertendo explicitamente `auth.uid()` para texto. A migração será então versionada em um commit complementar e reaplicada apenas após nova validação.
