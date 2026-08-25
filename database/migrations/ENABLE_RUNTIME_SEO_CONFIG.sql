-- Permite que o HTML público/SSR leia apenas configurações editoriais de SEO.
-- Execute no SQL Editor do Supabase.
BEGIN;

DROP POLICY IF EXISTS "site_config_public_read" ON public.site_config;
CREATE POLICY "site_config_public_read" ON public.site_config
FOR SELECT TO anon, authenticated
USING (config_key IN (
  'site_title', 'site_description', 'site_keywords', 'site_url',
  'og_title', 'og_description', 'og_image', 'twitter_card', 'twitter_site',
  'robots_index', 'robots_follow', 'robots_txt',
  'schema_name', 'schema_type', 'google_analytics_id', 'google_search_console_id',
  'admin_theme_settings', 'admin_promotions', 'admin_tags', 'admin_editorial_playlists',
  'analytics_enabled', 'google_tag_manager_id', 'facebook_pixel_id',
  'bible_narrated_section_enabled'
));

COMMIT;
