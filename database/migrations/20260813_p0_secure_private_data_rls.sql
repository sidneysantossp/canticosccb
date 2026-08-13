-- =============================================================================
-- P0 SECURITY: private user, composer, document, notification and playlist data
-- =============================================================================
-- IMPORTANT
-- 1) Test this migration in a separate Supabase staging project first.
-- 2) Keep a snapshot of pg_policies, grants, views and storage policies before use.
-- 3) This migration intentionally does NOT use the service_role key in the client.
-- 4) Run as a database administrator. Do not paste application secrets into this file.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. Preconditions: fail closed if the production schema differs from the
--    schema audited by the application. This prevents a partial, unsafe rollout.
-- -----------------------------------------------------------------------------
do $$
declare
  required_table text;
  required_column record;
begin
  foreach required_table in array array[
    'users',
    'composers',
    'composer_documents',
    'notifications',
    'playlists',
    'composer_managers'
  ] loop
    if to_regclass(format('public.%I', required_table)) is null then
      raise exception 'Missing required table public.%', required_table;
    end if;
  end loop;

  for required_column in
    select * from (values
      ('users', 'id'),
      ('users', 'email'),
      ('users', 'email_verified'),
      ('users', 'is_admin'),
      ('users', 'is_composer'),
      ('users', 'is_blocked'),
      ('users', 'plan'),
      ('users', 'status'),
      ('composers', 'id'),
      ('composers', 'user_id'),
      ('composers', 'status'),
      ('composers', 'verified'),
      ('composers', 'name'),
      ('composers', 'artistic_name'),
      ('composers', 'avatar_url'),
      ('composers', 'bio'),
      ('composers', 'slug'),
      ('composers', 'category'),
      ('composers', 'followers_count'),
      ('composers', 'is_featured'),
      ('composers', 'is_trending'),
      ('composers', 'banner_url'),
      ('composer_documents', 'id'),
      ('composer_documents', 'composer_id'),
      ('composer_documents', 'status'),
      ('composer_documents', 'reviewed_by'),
      ('composer_documents', 'reviewed_at'),
      ('composer_documents', 'admin_notes'),
      ('composer_documents', 'updated_at'),
      ('notifications', 'id'),
      ('notifications', 'user_id'),
      ('notifications', 'composer_id'),
      ('notifications', 'is_read'),
      ('playlists', 'id'),
      ('playlists', 'user_id'),
      ('playlists', 'is_public'),
      ('composer_managers', 'composer_id'),
      ('composer_managers', 'manager_user_id'),
      ('composer_managers', 'status')
    ) as requirements(table_name, column_name)
  loop
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = required_column.table_name
        and column_name = required_column.column_name
    ) then
      raise exception 'Missing required column public.%.%', required_column.table_name, required_column.column_name;
    end if;
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. Private authorization helpers. These functions use auth.uid(), never an
--    email configured in the browser or a value read from localStorage.
-- -----------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;

-- O RPC legado cria usuários e compositores como SECURITY DEFINER. Ele não
-- pode continuar disponível ao papel anon enquanto o fluxo seguro usa Auth e
-- RLS por proprietário.
revoke all on function public.register_composer(
  text, text, text, text, text, text, text, text, text
) from anon, authenticated, public;

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.is_admin = true
      and u.status = 'active'
      and coalesce(u.is_blocked, false) = false
  );
$$;

create or replace function private.can_manage_composer(target_composer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    (select private.is_platform_admin())
    or exists (
      select 1
      from public.composers c
      where c.id = target_composer_id
        and c.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.composer_managers cm
      where cm.composer_id = target_composer_id
        and cm.manager_user_id = (select auth.uid())
        and cm.status = 'accepted'
    );
$$;

revoke all on function private.is_platform_admin() from public;
revoke all on function private.can_manage_composer(uuid) from public;
grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.can_manage_composer(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Users: private by default. Protect role, billing and account-state fields
--    from any client-side update, including the profile owner.
-- -----------------------------------------------------------------------------
alter table public.users enable row level security;
revoke all on table public.users from anon;
grant select, insert, update on table public.users to authenticated;

do $$
declare policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
  loop
    execute format('drop policy if exists %I on public.users', policy_row.policyname);
  end loop;
end;
$$;

create policy users_select_self_or_admin
on public.users for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.is_platform_admin())
);

create policy users_insert_self
on public.users for insert
to authenticated
with check (id = (select auth.uid()));

create policy users_update_self_or_admin
on public.users for update
to authenticated
using (
  id = (select auth.uid())
  or (select private.is_platform_admin())
)
with check (
  id = (select auth.uid())
  or (select private.is_platform_admin())
);

create or replace function private.enforce_user_profile_security()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    if new.id <> (select auth.uid()) then
      raise exception 'A profile may only be created for the authenticated user';
    end if;

    -- Server-controlled defaults. The browser cannot create an admin, composer,
    -- premium, blocked, inactive or pre-verified account.
    new.plan := 'free';
    new.status := 'active';
    new.is_admin := false;
    new.is_composer := false;
    new.is_blocked := false;
    new.email_verified := false;
    return new;
  end if;

  if not (select private.is_platform_admin()) then
    if new.id is distinct from old.id
       or new.email is distinct from old.email
       or new.plan is distinct from old.plan
       or new.status is distinct from old.status
       or new.is_admin is distinct from old.is_admin
       or new.is_composer is distinct from old.is_composer
       or new.is_blocked is distinct from old.is_blocked
       or new.email_verified is distinct from old.email_verified then
      raise exception 'The requested profile change requires administrator approval';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_user_profile_security() from public;

drop trigger if exists users_enforce_profile_security on public.users;
create trigger users_enforce_profile_security
before insert or update on public.users
for each row
execute function private.enforce_user_profile_security();

-- -----------------------------------------------------------------------------
-- 3. Composers: operational records are private. A separate public view exposes
--    only active or approved, verified profile fields required by the public profile.
-- -----------------------------------------------------------------------------
alter table public.composers enable row level security;
revoke all on table public.composers from anon;
grant select, insert, update, delete on table public.composers to authenticated;

do $$
declare policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'composers'
  loop
    execute format('drop policy if exists %I on public.composers', policy_row.policyname);
  end loop;
end;
$$;

create policy composers_select_manager_or_admin
on public.composers for select
to authenticated
using ((select private.can_manage_composer(id)));

create policy composers_insert_self
on public.composers for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy composers_update_manager_or_admin
on public.composers for update
to authenticated
using ((select private.can_manage_composer(id)))
with check ((select private.can_manage_composer(id)));

create policy composers_delete_admin_only
on public.composers for delete
to authenticated
using ((select private.is_platform_admin()));

create or replace function private.enforce_composer_profile_security()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if (select private.is_platform_admin()) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.user_id <> (select auth.uid()) then
      raise exception 'A composer profile may only be created for the authenticated user';
    end if;

    new.status := 'pending';
    new.verified := false;
    return new;
  end if;

  if new.user_id is distinct from old.user_id
     or new.status is distinct from old.status
     or new.verified is distinct from old.verified then
    raise exception 'Composer approval and ownership changes require administrator approval';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_composer_profile_security() from public;

drop trigger if exists composers_enforce_profile_security on public.composers;
create trigger composers_enforce_profile_security
before insert or update on public.composers
for each row
execute function private.enforce_composer_profile_security();

create or replace view public.composer_public_profiles
with (security_barrier = true)
as
select
  id,
  name,
  artistic_name,
  avatar_url,
  bio,
  slug,
  category,
  followers_count,
  is_featured,
  is_trending,
  banner_url
from public.composers
where verified = true
  and status in ('active', 'approved');

revoke all on public.composer_public_profiles from anon, authenticated;
grant select on public.composer_public_profiles to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Composer documents: no public read, no direct review update and no Base64
--    fallback. The review RPC stamps reviewer and timestamp server-side.
-- -----------------------------------------------------------------------------
alter table public.composer_documents enable row level security;
revoke all on table public.composer_documents from anon;
grant select, insert, delete on table public.composer_documents to authenticated;
revoke update on table public.composer_documents from authenticated;

do $$
declare policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'composer_documents'
  loop
    execute format('drop policy if exists %I on public.composer_documents', policy_row.policyname);
  end loop;
end;
$$;

create policy composer_documents_select_manager_or_admin
on public.composer_documents for select
to authenticated
using ((select private.can_manage_composer(composer_id)));

create policy composer_documents_insert_owner_pending
on public.composer_documents for insert
to authenticated
with check (
  exists (
    select 1
    from public.composers c
    where c.id = composer_documents.composer_id
      and c.user_id = (select auth.uid())
  )
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

create policy composer_documents_delete_owner_pending
on public.composer_documents for delete
to authenticated
using (
  status = 'pending'
  and exists (
    select 1
    from public.composers c
    where c.id = composer_documents.composer_id
      and c.user_id = (select auth.uid())
  )
);

create or replace function public.review_composer_document(
  p_document_id uuid,
  p_status text,
  p_admin_notes text default null
)
returns public.composer_documents
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  reviewed_document public.composer_documents;
begin
  if not (select private.is_platform_admin()) then
    raise exception 'Only a platform administrator may review documents';
  end if;

  if p_status not in ('approved', 'rejected') then
    raise exception 'Invalid document review status';
  end if;

  if p_status = 'rejected' and coalesce(trim(p_admin_notes), '') = '' then
    raise exception 'A rejection reason is required';
  end if;

  update public.composer_documents
  set status = p_status,
      admin_notes = nullif(trim(p_admin_notes), ''),
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      updated_at = now()
  where id = p_document_id
  returning * into reviewed_document;

  if reviewed_document.id is null then
    raise exception 'Document not found';
  end if;

  return reviewed_document;
end;
$$;

revoke all on function public.review_composer_document(uuid, text, text) from public;
grant execute on function public.review_composer_document(uuid, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Private document storage. Objects must be stored below
--    composer/<composer_uuid>/<filename>. Public URLs and file-name-only access
--    are intentionally removed.
-- -----------------------------------------------------------------------------
update storage.buckets
set public = false
where id = 'documents';

drop policy if exists "documents_public_read" on storage.objects;
drop policy if exists "documents_auth_upload" on storage.objects;
drop policy if exists "documents_auth_update" on storage.objects;
drop policy if exists "documents_auth_delete" on storage.objects;

create policy documents_select_owner_manager_or_admin
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = 'composer'
  and exists (
    select 1
    from public.composers c
    where c.id::text = (storage.foldername(name))[2]
      and (select private.can_manage_composer(c.id))
  )
);

create policy documents_insert_owner_folder
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.composers c
    where c.id::text = (storage.foldername(name))[2]
      and c.user_id = (select auth.uid())
      and (storage.foldername(name))[1] = 'composer'
  )
);

create policy documents_delete_owner_or_admin
on storage.objects for delete
to authenticated
using (
  bucket_id = 'documents'
  and (
    (select private.is_platform_admin())
    or exists (
      select 1
      from public.composers c
      where c.id::text = (storage.foldername(name))[2]
        and c.user_id = (select auth.uid())
        and (storage.foldername(name))[1] = 'composer'
    )
  )
);

-- -----------------------------------------------------------------------------
-- 6. Notifications: private recipients only. Until the P1 domain RPC exists,
--    only administrators may create notifications. This deliberately blocks
--    arbitrary browser-side notification insertion.
-- -----------------------------------------------------------------------------
alter table public.notifications enable row level security;
revoke all on table public.notifications from anon;
grant select, insert, update, delete on table public.notifications to authenticated;

do $$
declare policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
  loop
    execute format('drop policy if exists %I on public.notifications', policy_row.policyname);
  end loop;
end;
$$;

create policy notifications_select_recipient_or_admin
on public.notifications for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.composers c
    where c.id = notifications.composer_id
      and c.user_id = (select auth.uid())
  )
  or (select private.is_platform_admin())
);

create policy notifications_insert_admin_only
on public.notifications for insert
to authenticated
with check ((select private.is_platform_admin()));

create policy notifications_update_recipient_or_admin
on public.notifications for update
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.composers c
    where c.id = notifications.composer_id
      and c.user_id = (select auth.uid())
  )
  or (select private.is_platform_admin())
)
with check (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.composers c
    where c.id = notifications.composer_id
      and c.user_id = (select auth.uid())
  )
  or (select private.is_platform_admin())
);

create policy notifications_delete_recipient_or_admin
on public.notifications for delete
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.composers c
    where c.id = notifications.composer_id
      and c.user_id = (select auth.uid())
  )
  or (select private.is_platform_admin())
);

-- -----------------------------------------------------------------------------
-- 7. Playlists: owner-only by default. A visitor sees only explicitly public
--    collections, never favorites/history/private playlists.
-- -----------------------------------------------------------------------------
alter table public.playlists enable row level security;
revoke all on table public.playlists from anon;
grant select, insert, update, delete on table public.playlists to authenticated;

do $$
declare policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'playlists'
  loop
    execute format('drop policy if exists %I on public.playlists', policy_row.policyname);
  end loop;
end;
$$;

create policy playlists_select_owner_or_public
on public.playlists for select
to authenticated
using (
  user_id = (select auth.uid())
  or coalesce(is_public, false) = true
  or (select private.is_platform_admin())
);

create policy playlists_select_public_anon
on public.playlists for select
to anon
using (coalesce(is_public, false) = true);

create policy playlists_insert_owner
on public.playlists for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy playlists_update_owner_or_admin
on public.playlists for update
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_platform_admin())
)
with check (
  user_id = (select auth.uid())
  or (select private.is_platform_admin())
);

create policy playlists_delete_owner_or_admin
on public.playlists for delete
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_platform_admin())
);

-- -----------------------------------------------------------------------------
-- 8. Verification queries. Run once after staging deployment, and repeat with
--    anonymous, user, composer/manager and admin test sessions.
-- -----------------------------------------------------------------------------
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('users', 'composers', 'composer_documents', 'notifications', 'playlists')
order by tablename, policyname;

select id, public
from storage.buckets
where id = 'documents';

commit;
