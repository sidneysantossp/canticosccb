alter table public.cifra_versions
  add column if not exists default_study_section_order integer,
  add column if not exists default_study_sync_audio boolean not null default false,
  add column if not exists default_study_loop_section boolean not null default false;

alter table public.cifra_versions
  drop constraint if exists cifra_versions_default_study_section_order_check;

alter table public.cifra_versions
  add constraint cifra_versions_default_study_section_order_check
  check (default_study_section_order is null or default_study_section_order >= 1);
