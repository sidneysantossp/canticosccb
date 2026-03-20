create table if not exists public.cifra_version_chord_overrides (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.cifra_versions(id) on delete cascade,
  chord_name text not null,
  applies_to_key text,
  preferred_shape_id uuid not null references public.cifra_chord_shapes(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cifra_version_chord_overrides_version_id
  on public.cifra_version_chord_overrides(version_id);

create index if not exists idx_cifra_version_chord_overrides_chord_name
  on public.cifra_version_chord_overrides(chord_name);

create unique index if not exists idx_cifra_version_chord_overrides_natural
  on public.cifra_version_chord_overrides(
    version_id,
    lower(chord_name),
    lower(coalesce(applies_to_key, ''))
  );

comment on table public.cifra_version_chord_overrides is 'Overrides editoriais para escolher qual shape abre por padrao em cada acorde da versao publicada.';
comment on column public.cifra_version_chord_overrides.applies_to_key is 'Tom opcional no qual o override deve ser aplicado. Nulo significa qualquer tom.';
comment on column public.cifra_version_chord_overrides.preferred_shape_id is 'Shape que deve abrir por padrao para o acorde/version/tom informado.';

drop trigger if exists cifra_version_chord_overrides_updated_at on public.cifra_version_chord_overrides;
create trigger cifra_version_chord_overrides_updated_at
before update on public.cifra_version_chord_overrides
for each row
execute function public.set_cifras_v2_updated_at();

alter table public.cifra_version_chord_overrides enable row level security;

drop policy if exists cifra_version_chord_overrides_public_read on public.cifra_version_chord_overrides;
create policy cifra_version_chord_overrides_public_read on public.cifra_version_chord_overrides
for select using (
  exists (
    select 1
    from public.cifra_versions v
    join public.cifra_songs s on s.id = v.song_id
    where v.id = cifra_version_chord_overrides.version_id
      and v.status = 'published'
      and v.is_active = true
      and v.is_searchable = true
      and s.is_active = true
      and s.is_indexable = true
  )
);

drop policy if exists cifra_version_chord_overrides_admin_all on public.cifra_version_chord_overrides;
create policy cifra_version_chord_overrides_admin_all on public.cifra_version_chord_overrides
for all using (public.is_admin_user()) with check (public.is_admin_user());
