-- =============================================
-- Migration: ALTER_CIFRAS_V2_ADD_PUBLIC_ENGAGEMENT
-- Description: Adiciona metricas publicas, eventos de uso, favoritos e relatorios sincronizados ao modulo cifras v2
-- Safe to run multiple times
-- =============================================

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.cifra_versions') is null then
    raise exception 'Missing base module: run CREATE_CIFRAS_V2_MODULE.sql before ALTER_CIFRAS_V2_ADD_PUBLIC_ENGAGEMENT.sql';
  end if;
end;
$$;

alter table public.cifra_versions
  add column if not exists views_count bigint not null default 0,
  add column if not exists shares_count integer not null default 0,
  add column if not exists prints_count integer not null default 0,
  add column if not exists favorites_count integer not null default 0,
  add column if not exists reports_count integer not null default 0,
  add column if not exists open_reports_count integer not null default 0,
  add column if not exists last_interaction_at timestamptz;

create table if not exists public.cifra_usage_events (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.cifra_versions(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'share', 'print')),
  session_key text,
  user_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_cifra_usage_events_version_id on public.cifra_usage_events(version_id);
create index if not exists idx_cifra_usage_events_event_type on public.cifra_usage_events(event_type);
create index if not exists idx_cifra_usage_events_created_at on public.cifra_usage_events(created_at desc);

comment on table public.cifra_usage_events is 'Eventos publicos de uso de cifras (view, share, print).';

create or replace function public.sync_cifra_version_favorites_count(p_version_id uuid)
returns void
language plpgsql
as $$
begin
  update public.cifra_versions
  set favorites_count = (
    select count(*)
    from public.cifra_favorites
    where version_id = p_version_id
  )
  where id = p_version_id;
end;
$$;

create or replace function public.sync_cifra_version_reports_count(p_version_id uuid)
returns void
language plpgsql
as $$
begin
  update public.cifra_versions
  set reports_count = (
        select count(*)
        from public.cifra_reports
        where version_id = p_version_id
      ),
      open_reports_count = (
        select count(*)
        from public.cifra_reports
        where version_id = p_version_id
          and status in ('open', 'triaged')
      )
  where id = p_version_id;
end;
$$;

create or replace function public.handle_cifra_favorite_counter_sync()
returns trigger
language plpgsql
as $$
declare
  target_version_id uuid;
begin
  target_version_id := coalesce(new.version_id, old.version_id);
  perform public.sync_cifra_version_favorites_count(target_version_id);
  return coalesce(new, old);
end;
$$;

create or replace function public.handle_cifra_report_counter_sync()
returns trigger
language plpgsql
as $$
declare
  target_version_id uuid;
begin
  target_version_id := coalesce(new.version_id, old.version_id);
  perform public.sync_cifra_version_reports_count(target_version_id);
  return coalesce(new, old);
end;
$$;

create or replace function public.handle_cifra_usage_event_counter()
returns trigger
language plpgsql
as $$
begin
  update public.cifra_versions
  set views_count = views_count + case when new.event_type = 'view' then 1 else 0 end,
      shares_count = shares_count + case when new.event_type = 'share' then 1 else 0 end,
      prints_count = prints_count + case when new.event_type = 'print' then 1 else 0 end,
      last_interaction_at = coalesce(
        greatest(last_interaction_at, new.created_at),
        new.created_at
      )
  where id = new.version_id;

  return new;
end;
$$;

drop trigger if exists cifra_usage_events_counter on public.cifra_usage_events;
create trigger cifra_usage_events_counter
after insert on public.cifra_usage_events
for each row
execute function public.handle_cifra_usage_event_counter();

drop trigger if exists cifra_favorites_counter_sync on public.cifra_favorites;
create trigger cifra_favorites_counter_sync
after insert or delete on public.cifra_favorites
for each row
execute function public.handle_cifra_favorite_counter_sync();

drop trigger if exists cifra_reports_counter_sync on public.cifra_reports;
create trigger cifra_reports_counter_sync
after insert or update or delete on public.cifra_reports
for each row
execute function public.handle_cifra_report_counter_sync();

alter table public.cifra_usage_events enable row level security;

drop policy if exists cifra_usage_events_public_insert on public.cifra_usage_events;
create policy cifra_usage_events_public_insert on public.cifra_usage_events
for insert with check (true);

drop policy if exists cifra_usage_events_admin_all on public.cifra_usage_events;
create policy cifra_usage_events_admin_all on public.cifra_usage_events
for all using (public.is_admin_user()) with check (public.is_admin_user());

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
  v.views_count,
  v.shares_count,
  v.prints_count,
  v.favorites_count,
  v.reports_count,
  v.open_reports_count,
  v.last_interaction_at,
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

comment on view public.cifra_public_catalog is 'Read model publico para paginas de cifra, busca, SEO e metricas de engajamento.';
comment on function public.sync_cifra_version_favorites_count(uuid) is 'Recalcula favorites_count da cifra publicada.';
comment on function public.sync_cifra_version_reports_count(uuid) is 'Recalcula reports_count e open_reports_count da cifra publicada.';
comment on function public.handle_cifra_usage_event_counter() is 'Incrementa os contadores publicos ao registrar um evento de uso da cifra.';
