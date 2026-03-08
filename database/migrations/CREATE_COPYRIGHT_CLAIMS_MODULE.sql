-- =============================================
-- CREATE: Módulo de Direitos Autorais (backend real)
-- Tabelas:
--   - public.copyright_claims
--   - public.copyright_claim_messages
--   - public.copyright_claim_attachments
-- Storage:
--   - Reaproveita bucket public.documents
-- =============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.copyright_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id bigint NULL REFERENCES public.hinos(id) ON DELETE SET NULL,
  song_title text NOT NULL,
  song_artist text NULL,
  song_cover_url text NULL,
  content_url text NULL,
  composer_id uuid NULL REFERENCES public.composers(id) ON DELETE SET NULL,
  composer_name text NOT NULL,
  composer_email text NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  claim_type text NOT NULL CHECK (claim_type IN ('composer', 'author', 'both')),
  description text NOT NULL,
  proof_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'resolved')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  reviewer_notes text NULL,
  reviewed_by_user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz NULL,
  resolved_at timestamptz NULL,
  last_message_at timestamptz NULL,
  has_unread_for_admin boolean NOT NULL DEFAULT true,
  has_unread_for_composer boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.copyright_claim_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.copyright_claims(id) ON DELETE CASCADE,
  sender_user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('admin', 'composer')),
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.copyright_claim_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.copyright_claims(id) ON DELETE CASCADE,
  message_id uuid NULL REFERENCES public.copyright_claim_messages(id) ON DELETE CASCADE,
  created_by_user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'video', 'pdf', 'audio')),
  mime_type text NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copyright_claims_composer_id ON public.copyright_claims(composer_id);
CREATE INDEX IF NOT EXISTS idx_copyright_claims_created_by ON public.copyright_claims(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_copyright_claims_status ON public.copyright_claims(status);
CREATE INDEX IF NOT EXISTS idx_copyright_claims_updated_at ON public.copyright_claims(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_copyright_claim_messages_claim_id ON public.copyright_claim_messages(claim_id);
CREATE INDEX IF NOT EXISTS idx_copyright_claim_messages_created_at ON public.copyright_claim_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_copyright_claim_attachments_claim_id ON public.copyright_claim_attachments(claim_id);
CREATE INDEX IF NOT EXISTS idx_copyright_claim_attachments_message_id ON public.copyright_claim_attachments(message_id);

DROP TRIGGER IF EXISTS trg_copyright_claims_updated_at ON public.copyright_claims;
CREATE TRIGGER trg_copyright_claims_updated_at
BEFORE UPDATE ON public.copyright_claims
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_copyright_claim_messages_updated_at ON public.copyright_claim_messages;
CREATE TRIGGER trg_copyright_claim_messages_updated_at
BEFORE UPDATE ON public.copyright_claim_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_copyright_claim_attachments_updated_at ON public.copyright_claim_attachments;
CREATE TRIGGER trg_copyright_claim_attachments_updated_at
BEFORE UPDATE ON public.copyright_claim_attachments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = p_user_id
      AND COALESCE(u.is_admin, false) = true
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_copyright_claim(p_claim_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.copyright_claims cc
    WHERE cc.id = p_claim_id
      AND (
        cc.created_by_user_id = p_user_id
        OR public.is_admin_user(p_user_id)
        OR EXISTS (
          SELECT 1
          FROM public.composers c
          WHERE c.id = cc.composer_id
            AND c.user_id = p_user_id
        )
        OR EXISTS (
          SELECT 1
          FROM public.composer_managers cm
          WHERE cm.composer_id = cc.composer_id
            AND cm.manager_user_id = p_user_id
            AND cm.status = 'active'
        )
      )
  );
$$;

ALTER TABLE public.copyright_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copyright_claim_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copyright_claim_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "copyright_claims_select" ON public.copyright_claims;
CREATE POLICY "copyright_claims_select"
  ON public.copyright_claims FOR SELECT
  USING (public.can_access_copyright_claim(id));

DROP POLICY IF EXISTS "copyright_claims_insert" ON public.copyright_claims;
CREATE POLICY "copyright_claims_insert"
  ON public.copyright_claims FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by_user_id = auth.uid());

DROP POLICY IF EXISTS "copyright_claims_update" ON public.copyright_claims;
CREATE POLICY "copyright_claims_update"
  ON public.copyright_claims FOR UPDATE
  USING (public.can_access_copyright_claim(id))
  WITH CHECK (public.can_access_copyright_claim(id));

DROP POLICY IF EXISTS "copyright_claims_delete" ON public.copyright_claims;
CREATE POLICY "copyright_claims_delete"
  ON public.copyright_claims FOR DELETE
  USING (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "copyright_claim_messages_select" ON public.copyright_claim_messages;
CREATE POLICY "copyright_claim_messages_select"
  ON public.copyright_claim_messages FOR SELECT
  USING (public.can_access_copyright_claim(claim_id));

DROP POLICY IF EXISTS "copyright_claim_messages_insert" ON public.copyright_claim_messages;
CREATE POLICY "copyright_claim_messages_insert"
  ON public.copyright_claim_messages FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.can_access_copyright_claim(claim_id)
    AND (sender_user_id = auth.uid() OR sender_user_id IS NULL)
  );

DROP POLICY IF EXISTS "copyright_claim_messages_update" ON public.copyright_claim_messages;
CREATE POLICY "copyright_claim_messages_update"
  ON public.copyright_claim_messages FOR UPDATE
  USING (public.can_access_copyright_claim(claim_id))
  WITH CHECK (public.can_access_copyright_claim(claim_id));

DROP POLICY IF EXISTS "copyright_claim_attachments_select" ON public.copyright_claim_attachments;
CREATE POLICY "copyright_claim_attachments_select"
  ON public.copyright_claim_attachments FOR SELECT
  USING (public.can_access_copyright_claim(claim_id));

DROP POLICY IF EXISTS "copyright_claim_attachments_insert" ON public.copyright_claim_attachments;
CREATE POLICY "copyright_claim_attachments_insert"
  ON public.copyright_claim_attachments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.can_access_copyright_claim(claim_id)
  );

DROP POLICY IF EXISTS "copyright_claim_attachments_update" ON public.copyright_claim_attachments;
CREATE POLICY "copyright_claim_attachments_update"
  ON public.copyright_claim_attachments FOR UPDATE
  USING (public.can_access_copyright_claim(claim_id))
  WITH CHECK (public.can_access_copyright_claim(claim_id));

DROP POLICY IF EXISTS "copyright_claim_attachments_delete" ON public.copyright_claim_attachments;
CREATE POLICY "copyright_claim_attachments_delete"
  ON public.copyright_claim_attachments FOR DELETE
  USING (public.can_access_copyright_claim(claim_id));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('copyright_claims', 'copyright_claim_messages', 'copyright_claim_attachments')
ORDER BY table_name, ordinal_position;
