-- Amplia o catálogo de cifras para os instrumentos disponíveis na base editorial.
-- A migração preserva todas as versões existentes e só ajusta a validação da coluna.

alter table public.cifra_versions
  drop constraint if exists cifra_versions_instrument_check;

alter table public.cifra_versions
  add constraint cifra_versions_instrument_check
  check (instrument in (
    'violao', 'ukulele', 'teclado', 'cavaco',
    'baixo', 'bateria', 'gaita', 'viola',
    'guitarra', 'outro'
  ));
