-- Remove rótulos de estrofes do Hino 1; marcações de coro permanecem intactas.
UPDATE public.cifras
SET
  content = replace(
    replace(
      replace(
        replace(
          replace(content, '[Hino 1]' || E'\n', ''),
          '[1ª estrofe]' || E'\n',
          ''
        ),
        '[2ª estrofe]' || E'\n',
        ''
      ),
      '[3ª estrofe]' || E'\n',
      ''
    ),
    '[4ª estrofe]' || E'\n',
    ''
  ),
  updated_at = now()
WHERE slug IN (
  'hino-1-ccb-cristo-meu-mestre-e-meu-senhor',
  'hino-1-ccb-cristo-meu-mestre-e-meu-senhor-ukulele',
  'hino-1-ccb-cristo-meu-mestre-e-meu-senhor-teclado'
);
