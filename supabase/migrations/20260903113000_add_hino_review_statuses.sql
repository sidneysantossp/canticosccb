-- Separa submissões enviadas para análise dos rascunhos do acervo importado.
ALTER TABLE public.hinos
  DROP CONSTRAINT IF EXISTS hinos_status_check;

ALTER TABLE public.hinos
  ADD CONSTRAINT hinos_status_check
  CHECK (status IN ('draft', 'pending', 'published', 'archived', 'rejected'));
