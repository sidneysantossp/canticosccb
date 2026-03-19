alter table if exists public.cifra_version_sections
  add column if not exists cue_start_seconds numeric(10,2),
  add column if not exists cue_end_seconds numeric(10,2),
  add column if not exists loop_start_seconds numeric(10,2),
  add column if not exists loop_end_seconds numeric(10,2);

comment on column public.cifra_version_sections.cue_start_seconds is 'Inicio editorial aproximado da secao no audio publicado, em segundos.';
comment on column public.cifra_version_sections.cue_end_seconds is 'Fim editorial aproximado da secao no audio publicado, em segundos.';
comment on column public.cifra_version_sections.loop_start_seconds is 'Inicio opcional do loop editorial dentro da secao, em segundos.';
comment on column public.cifra_version_sections.loop_end_seconds is 'Fim opcional do loop editorial dentro da secao, em segundos.';
