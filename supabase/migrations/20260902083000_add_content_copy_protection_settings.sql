BEGIN;

INSERT INTO public.site_config (config_key, config_value)
SELECT 'content_copy_protection_hinario', 'true'
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_config WHERE config_key = 'content_copy_protection_hinario'
);

INSERT INTO public.site_config (config_key, config_value)
SELECT 'content_copy_protection_cifras', 'true'
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_config WHERE config_key = 'content_copy_protection_cifras'
);

INSERT INTO public.site_config (config_key, config_value)
SELECT 'content_copy_protection_biblia', 'true'
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_config WHERE config_key = 'content_copy_protection_biblia'
);

DROP POLICY IF EXISTS "site_config_content_protection_public_read" ON public.site_config;
CREATE POLICY "site_config_content_protection_public_read"
ON public.site_config
FOR SELECT
TO anon, authenticated
USING (
  config_key IN (
    'content_copy_protection_hinario',
    'content_copy_protection_cifras',
    'content_copy_protection_biblia'
  )
);

COMMIT;
