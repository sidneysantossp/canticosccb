-- Hardening RLS for sensitive public tables.
-- Apply this migration in Supabase SQL Editor after reviewing current policies.
-- It intentionally removes anonymous write access and public profile enumeration.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.users WHERE id = auth.uid()), false);
$$;
REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read active users" ON public.users;
DROP POLICY IF EXISTS "Permitir leitura pública de usuarios" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "users_select_public" ON public.users;
DROP POLICY IF EXISTS "users_insert_public" ON public.users;
DROP POLICY IF EXISTS "users_update_public" ON public.users;
DROP POLICY IF EXISTS "users_delete_public" ON public.users;
CREATE POLICY "users_select_own_or_admin" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin_user());
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own_or_admin" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin_user())
  WITH CHECK (auth.uid() = id OR public.is_admin_user());
CREATE POLICY "users_delete_admin" ON public.users
  FOR DELETE TO authenticated
  USING (public.is_admin_user());

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de site_config" ON public.site_config;
DROP POLICY IF EXISTS "Admins podem modificar site_config" ON public.site_config;
DROP POLICY IF EXISTS "site_config_select" ON public.site_config;
DROP POLICY IF EXISTS "site_config_insert" ON public.site_config;
DROP POLICY IF EXISTS "site_config_update" ON public.site_config;
DROP POLICY IF EXISTS "site_config_delete" ON public.site_config;
CREATE POLICY "site_config_public_read" ON public.site_config
  FOR SELECT TO anon, authenticated USING (config_key IN ('site_title','site_description','site_keywords','site_url','og_image','twitter_card','twitter_site','robots_index','robots_follow','google_search_console_id','admin_theme_settings','admin_promotions','admin_tags','admin_editorial_playlists','analytics_enabled','google_analytics_id','google_tag_manager_id','facebook_pixel_id','bible_narrated_section_enabled'));
CREATE POLICY "site_config_admin_write" ON public.site_config
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

ALTER TABLE public.platform_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_notices_select" ON public.platform_notices;
DROP POLICY IF EXISTS "platform_notices_insert" ON public.platform_notices;
DROP POLICY IF EXISTS "platform_notices_update" ON public.platform_notices;
DROP POLICY IF EXISTS "platform_notices_delete" ON public.platform_notices;
CREATE POLICY "platform_notices_public_read" ON public.platform_notices
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND published_at <= now());
CREATE POLICY "platform_notices_admin_write" ON public.platform_notices
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

COMMIT;
