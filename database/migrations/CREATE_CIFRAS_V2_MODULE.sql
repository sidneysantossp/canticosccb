-- =============================================
-- Migration: CREATE_CIFRAS_V2_MODULE
-- Description: Novo modulo robusto de cifras com song/version/sections/review
-- Safe to run multiple times
-- =============================================

create extension if not exists pgcrypto;

-- =============================================
-- Helpers
-- =============================================

create or replace function public.set_cifras_v2_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin_user()
returns boolean
language plpgsql
stable
as $$
declare
  has_users_table boolean;
  result boolean := false;
begin
  select to_regclass('public.users') is not null into has_users_table;

  if not has_users_table or auth.uid() is null then
    return false;
  end if;

  execute $query$
    select exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and coalesce(users.is_admin, false) = true
    )
  $query$
  into result;

  return coalesce(result, false);
end;
$$;

-- =============================================
-- Canonical song entity
-- =============================================

create table if not exists public.cifra_songs (
  id uuid primary key default gen_random_uuid(),
  canonical_slug text not null unique,
  title text not null,
  subtitle text,
  composer_name text,
  hino_id text,
  hinario_numero integer,
  source_type text not null default 'avulso' check (source_type in ('hinario', 'avulso', 'album', 'playlist', 'other')),
  liturgical_context text,
  seo_title text,
  seo_description text,
  seo_keywords text,
  cover_url text,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  is_indexable boolean not null default true,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cifra_songs_hino_id on public.cifra_songs(hino_id);
create index if not exists idx_cifra_songs_hinario_numero on public.cifra_songs(hinario_numero);
create index if not exists idx_cifra_songs_source_type on public.cifra_songs(source_type);
create index if not exists idx_cifra_songs_is_active on public.cifra_songs(is_active);
create index if not exists idx_cifra_songs_is_indexable on public.cifra_songs(is_indexable);

comment on table public.cifra_songs is 'Entidade canonica do hino para o qual existem cifras.';

-- =============================================
-- Versioned cifra records
-- =============================================

create table if not exists public.cifra_versions (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.cifra_songs(id) on delete cascade,
  public_slug text not null unique,
  title text not null,
  instrument text not null check (instrument in ('violao', 'ukulele', 'teclado', 'cavaco', 'guitarra', 'outro')),
  arrangement_type text not null default 'completa' check (arrangement_type in ('simplificada', 'completa', 'culto', 'estudo', 'instrumental', 'lead_sheet', 'outro')),
  difficulty_level text not null default 'intermediario' check (difficulty_level in ('iniciante', 'basico', 'intermediario', 'avancado')),
  tuning text not null default 'standard',
  capo integer not null default 0,
  original_key text not null default 'C',
  preferred_key text,
  tempo_bpm integer,
  time_signature text,
  intro_notes text,
  body_text text not null default '',
  body_ast jsonb not null default '{"sections":[]}'::jsonb,
  chords_index jsonb not null default '[]'::jsonb,
  sections_count integer not null default 0,
  lines_count integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'approved', 'published', 'archived')),
  publication_label text not null default 'community' check (publication_label in ('official', 'reviewed', 'community')),
  is_primary boolean not null default false,
  is_active boolean not null default true,
  is_searchable boolean not null default true,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cifra_versions_song_id on public.cifra_versions(song_id);
create index if not exists idx_cifra_versions_instrument on public.cifra_versions(instrument);
create index if not exists idx_cifra_versions_arrangement_type on public.cifra_versions(arrangement_type);
create index if not exists idx_cifra_versions_status on public.cifra_versions(status);
create index if not exists idx_cifra_versions_is_active on public.cifra_versions(is_active);
create index if not exists idx_cifra_versions_is_searchable on public.cifra_versions(is_searchable);

create unique index if not exists idx_cifra_versions_primary_per_song_instrument
  on public.cifra_versions(song_id, instrument)
  where is_primary = true and status = 'published' and is_active = true;

comment on table public.cifra_versions is 'Versoes de cifra por instrumento, arranjo e contexto editorial.';

-- =============================================
-- Structured sections
-- =============================================

create table if not exists public.cifra_version_sections (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.cifra_versions(id) on delete cascade,
  section_order integer not null,
  section_key text not null default 'custom' check (section_key in ('intro', 'verse', 'chorus', 'bridge', 'ending', 'turnaround', 'custom')),
  section_label text not null,
  cue_start_seconds numeric(10,2),
  cue_end_seconds numeric(10,2),
  loop_start_seconds numeric(10,2),
  loop_end_seconds numeric(10,2),
  content_ast jsonb not null default '[]'::jsonb,
  plain_text text not null default '',
  chords_index jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(version_id, section_order)
);

create index if not exists idx_cifra_version_sections_version_id on public.cifra_version_sections(version_id);

comment on table public.cifra_version_sections is 'Secoes estruturadas da cifra usadas para edicao, preview e renderizacao.';

-- =============================================
-- Chord shapes library
-- =============================================

create table if not exists public.cifra_chord_shapes (
  id uuid primary key default gen_random_uuid(),
  instrument text not null check (instrument in ('violao', 'ukulele', 'teclado', 'cavaco', 'guitarra', 'outro')),
  chord_name text not null,
  variation_name text not null default 'default',
  fingering jsonb not null default '{}'::jsonb,
  base_fret integer not null default 1,
  priority integer not null default 0,
  is_left_handed_supported boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(instrument, chord_name, variation_name)
);

create index if not exists idx_cifra_chord_shapes_instrument on public.cifra_chord_shapes(instrument);
create index if not exists idx_cifra_chord_shapes_chord_name on public.cifra_chord_shapes(chord_name);

comment on table public.cifra_chord_shapes is 'Biblioteca de diagramas e shapes por instrumento.';

-- =============================================
-- Revision history
-- =============================================

create table if not exists public.cifra_revision_history (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.cifra_versions(id) on delete cascade,
  revision_number integer not null,
  change_summary text,
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(version_id, revision_number)
);

create index if not exists idx_cifra_revision_history_version_id on public.cifra_revision_history(version_id);

comment on table public.cifra_revision_history is 'Historico de revisoes para rollback, diff e auditoria editorial.';

-- =============================================
-- Review workflow
-- =============================================

create table if not exists public.cifra_review_queue (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.cifra_versions(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'changes_requested', 'approved', 'rejected')),
  reviewer_id uuid,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cifra_review_queue_version_id on public.cifra_review_queue(version_id);
create index if not exists idx_cifra_review_queue_status on public.cifra_review_queue(status);

comment on table public.cifra_review_queue is 'Fila de revisao editorial do modulo de cifras.';

-- =============================================
-- User reports
-- =============================================

create table if not exists public.cifra_reports (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.cifra_versions(id) on delete cascade,
  report_type text not null default 'other' check (report_type in ('wrong_chord', 'wrong_key', 'formatting', 'duplicate', 'copyright', 'other')),
  message text not null,
  reporter_email text,
  reporter_user_id uuid,
  status text not null default 'open' check (status in ('open', 'triaged', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cifra_reports_version_id on public.cifra_reports(version_id);
create index if not exists idx_cifra_reports_status on public.cifra_reports(status);

comment on table public.cifra_reports is 'Relatos de erro e qualidade enviados por usuarios.';

-- =============================================
-- Favorites
-- =============================================

create table if not exists public.cifra_favorites (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.cifra_versions(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique(version_id, user_id)
);

create index if not exists idx_cifra_favorites_user_id on public.cifra_favorites(user_id);
create index if not exists idx_cifra_favorites_version_id on public.cifra_favorites(version_id);

comment on table public.cifra_favorites is 'Favoritos de cifras por usuario.';

-- =============================================
-- Public read model
-- =============================================

drop view if exists public.cifra_public_catalog;

create view public.cifra_public_catalog as
select
  v.id as version_id,
  v.public_slug,
  v.title as version_title,
  v.instrument,
  v.arrangement_type,
  v.difficulty_level,
  v.original_key,
  v.preferred_key,
  v.capo,
  v.tempo_bpm,
  v.time_signature,
  v.publication_label,
  v.is_primary,
  v.published_at,
  s.id as song_id,
  s.canonical_slug as song_slug,
  s.title as song_title,
  s.subtitle as song_subtitle,
  s.composer_name,
  s.hino_id,
  s.hinario_numero,
  s.source_type,
  s.cover_url,
  s.seo_title,
  s.seo_description,
  s.seo_keywords,
  v.sections_count,
  v.lines_count,
  v.chords_index
from public.cifra_versions v
join public.cifra_songs s on s.id = v.song_id
where s.is_active = true
  and s.is_indexable = true
  and v.is_active = true
  and v.is_searchable = true
  and v.status = 'published';

comment on view public.cifra_public_catalog is 'Read model publico para paginas de cifra, busca e SEO.';

-- =============================================
-- Triggers
-- =============================================

drop trigger if exists cifra_songs_updated_at on public.cifra_songs;
create trigger cifra_songs_updated_at
before update on public.cifra_songs
for each row
execute function public.set_cifras_v2_updated_at();

drop trigger if exists cifra_versions_updated_at on public.cifra_versions;
create trigger cifra_versions_updated_at
before update on public.cifra_versions
for each row
execute function public.set_cifras_v2_updated_at();

drop trigger if exists cifra_version_sections_updated_at on public.cifra_version_sections;
create trigger cifra_version_sections_updated_at
before update on public.cifra_version_sections
for each row
execute function public.set_cifras_v2_updated_at();

drop trigger if exists cifra_chord_shapes_updated_at on public.cifra_chord_shapes;
create trigger cifra_chord_shapes_updated_at
before update on public.cifra_chord_shapes
for each row
execute function public.set_cifras_v2_updated_at();

drop trigger if exists cifra_review_queue_updated_at on public.cifra_review_queue;
create trigger cifra_review_queue_updated_at
before update on public.cifra_review_queue
for each row
execute function public.set_cifras_v2_updated_at();

drop trigger if exists cifra_reports_updated_at on public.cifra_reports;
create trigger cifra_reports_updated_at
before update on public.cifra_reports
for each row
execute function public.set_cifras_v2_updated_at();

-- =============================================
-- RLS
-- =============================================

alter table public.cifra_songs enable row level security;
alter table public.cifra_versions enable row level security;
alter table public.cifra_version_sections enable row level security;
alter table public.cifra_chord_shapes enable row level security;
alter table public.cifra_revision_history enable row level security;
alter table public.cifra_review_queue enable row level security;
alter table public.cifra_reports enable row level security;
alter table public.cifra_favorites enable row level security;

drop policy if exists cifra_songs_public_read on public.cifra_songs;
create policy cifra_songs_public_read on public.cifra_songs
for select using (is_active = true and is_indexable = true);

drop policy if exists cifra_versions_public_read on public.cifra_versions;
create policy cifra_versions_public_read on public.cifra_versions
for select using (is_active = true and is_searchable = true and status = 'published');

drop policy if exists cifra_sections_public_read on public.cifra_version_sections;
create policy cifra_sections_public_read on public.cifra_version_sections
for select using (
  exists (
    select 1
    from public.cifra_versions v
    join public.cifra_songs s on s.id = v.song_id
    where v.id = cifra_version_sections.version_id
      and v.is_active = true
      and v.is_searchable = true
      and v.status = 'published'
      and s.is_active = true
      and s.is_indexable = true
  )
);

drop policy if exists cifra_shapes_public_read on public.cifra_chord_shapes;
create policy cifra_shapes_public_read on public.cifra_chord_shapes
for select using (is_active = true);

drop policy if exists cifra_favorites_owner_read on public.cifra_favorites;
create policy cifra_favorites_owner_read on public.cifra_favorites
for select using (auth.uid() = user_id);

drop policy if exists cifra_favorites_owner_insert on public.cifra_favorites;
create policy cifra_favorites_owner_insert on public.cifra_favorites
for insert with check (auth.uid() = user_id);

drop policy if exists cifra_favorites_owner_delete on public.cifra_favorites;
create policy cifra_favorites_owner_delete on public.cifra_favorites
for delete using (auth.uid() = user_id);

drop policy if exists cifra_reports_public_insert on public.cifra_reports;
create policy cifra_reports_public_insert on public.cifra_reports
for insert with check (true);

drop policy if exists cifra_reports_owner_read on public.cifra_reports;
create policy cifra_reports_owner_read on public.cifra_reports
for select using (reporter_user_id = auth.uid() or public.is_admin_user());

drop policy if exists cifra_songs_admin_all on public.cifra_songs;
create policy cifra_songs_admin_all on public.cifra_songs
for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists cifra_versions_admin_all on public.cifra_versions;
create policy cifra_versions_admin_all on public.cifra_versions
for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists cifra_sections_admin_all on public.cifra_version_sections;
create policy cifra_sections_admin_all on public.cifra_version_sections
for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists cifra_shapes_admin_all on public.cifra_chord_shapes;
create policy cifra_shapes_admin_all on public.cifra_chord_shapes
for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists cifra_revision_admin_all on public.cifra_revision_history;
create policy cifra_revision_admin_all on public.cifra_revision_history
for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists cifra_review_admin_all on public.cifra_review_queue;
create policy cifra_review_admin_all on public.cifra_review_queue
for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists cifra_reports_admin_all on public.cifra_reports;
create policy cifra_reports_admin_all on public.cifra_reports
for all using (public.is_admin_user()) with check (public.is_admin_user());

-- =============================================
-- Notes
-- =============================================

comment on function public.is_admin_user() is 'Helper de RLS para o modulo de cifras v2.';
comment on function public.set_cifras_v2_updated_at() is 'Trigger generico de updated_at para o modulo de cifras v2.';
