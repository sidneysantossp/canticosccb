-- Catálogo administrativo de recuperação de mídias.
-- Execute este arquivo no SQL Editor do Supabase antes de usar o botão
-- "Cadastrar selecionados" em /admin/recuperacao-midias.

BEGIN;

CREATE TABLE IF NOT EXISTS public.archive_recovery_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  source_url text NOT NULL,
  album_id uuid REFERENCES public.albums(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending_approval'
    CHECK (status IN ('importing', 'pending_approval', 'approved', 'failed', 'archived')),
  media_status text NOT NULL DEFAULT 'pending_transfer'
    CHECK (media_status IN ('catalogued', 'pending_transfer', 'transferred', 'failed')),
  files_count integer NOT NULL DEFAULT 0 CHECK (files_count >= 0),
  imported_files_count integer NOT NULL DEFAULT 0 CHECK (imported_files_count >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);

CREATE INDEX IF NOT EXISTS archive_recovery_imports_status_idx
  ON public.archive_recovery_imports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS archive_recovery_imports_album_idx
  ON public.archive_recovery_imports(album_id);

ALTER TABLE public.archive_recovery_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "archive_recovery_imports_admin_select" ON public.archive_recovery_imports;
CREATE POLICY "archive_recovery_imports_admin_select"
  ON public.archive_recovery_imports FOR SELECT TO authenticated
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "archive_recovery_imports_admin_write" ON public.archive_recovery_imports;
CREATE POLICY "archive_recovery_imports_admin_write"
  ON public.archive_recovery_imports FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE OR REPLACE FUNCTION public.admin_stage_archive_album(
  p_source_key text,
  p_source_url text,
  p_album_title text,
  p_tracks jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $archive_stage$
DECLARE
  v_import public.archive_recovery_imports%ROWTYPE;
  v_album_id uuid;
  v_hino_id uuid;
  v_track jsonb;
  v_track_count integer;
  v_position integer := 0;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Acesso administrativo necessário';
  END IF;

  IF nullif(trim(p_source_key), '') IS NULL
     OR nullif(trim(p_source_url), '') IS NULL
     OR nullif(trim(p_album_title), '') IS NULL THEN
    RAISE EXCEPTION 'Origem e título do álbum são obrigatórios';
  END IF;

  IF jsonb_typeof(p_tracks) <> 'array' THEN
    RAISE EXCEPTION 'A lista de faixas é inválida';
  END IF;

  v_track_count := jsonb_array_length(p_tracks);
  IF v_track_count = 0 OR v_track_count > 500 THEN
    RAISE EXCEPTION 'A lista deve conter entre 1 e 500 faixas';
  END IF;

  INSERT INTO public.archive_recovery_imports (
    source_key, source_url, status, media_status, files_count,
    imported_files_count, metadata, created_by
  ) VALUES (
    trim(p_source_key), trim(p_source_url), 'importing', 'pending_transfer',
    v_track_count, 0, jsonb_build_object('album_title', trim(p_album_title)), auth.uid()
  )
  ON CONFLICT (source_key) DO NOTHING
  RETURNING * INTO v_import;

  -- A restrição UNIQUE é a trava definitiva contra loops e cliques duplicados.
  IF v_import.id IS NULL THEN
    SELECT * INTO v_import
    FROM public.archive_recovery_imports
    WHERE source_key = trim(p_source_key);

    RETURN jsonb_build_object(
      'already_imported', true,
      'source_key', v_import.source_key,
      'album_id', v_import.album_id,
      'status', v_import.status,
      'media_status', v_import.media_status,
      'files_count', v_import.files_count
    );
  END IF;

  INSERT INTO public.albums (
    title, description, cover_url, artist, is_published, active,
    total_tracks, created_at, updated_at
  ) VALUES (
    trim(p_album_title), '', '', '', false, false,
    v_track_count, now(), now()
  ) RETURNING id INTO v_album_id;

  UPDATE public.archive_recovery_imports
  SET album_id = v_album_id, updated_at = now()
  WHERE id = v_import.id;

  FOR v_track IN SELECT value FROM jsonb_array_elements(p_tracks)
  LOOP
    v_position := v_position + 1;

    IF nullif(trim(v_track->>'title'), '') IS NULL THEN
      RAISE EXCEPTION 'Faixa % sem título', v_position;
    END IF;

    INSERT INTO public.hinos (
      titulo, numero, categoria, status, ativo, audio_url, created_at, updated_at
    ) VALUES (
      trim(v_track->>'title'),
      CASE WHEN (v_track->>'number') ~ '^\d+$' THEN (v_track->>'number')::integer ELSE NULL END,
      '', 'draft', false, NULLIF(trim(COALESCE(v_track->>'audio_url', '')), ''), now(), now()
    ) RETURNING id INTO v_hino_id;

    INSERT INTO public.album_hinos (album_id, hino_id, position, track_number)
    VALUES (v_album_id, v_hino_id, v_position, v_position);
  END LOOP;

  UPDATE public.archive_recovery_imports
  SET status = 'pending_approval',
      imported_files_count = v_track_count,
      updated_at = now()
  WHERE id = v_import.id;

  RETURN jsonb_build_object(
    'already_imported', false,
    'source_key', trim(p_source_key),
    'album_id', v_album_id,
    'status', 'pending_approval',
    'media_status', 'pending_transfer',
    'files_count', v_track_count
  );
END;
$archive_stage$;

REVOKE ALL ON FUNCTION public.admin_stage_archive_album(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_stage_archive_album(text, text, text, jsonb) TO authenticated;

COMMIT;
