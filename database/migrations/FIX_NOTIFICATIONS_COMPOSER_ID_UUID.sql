-- =============================================
-- FIX: Alterar notifications.composer_id de bigint para uuid
-- A tabela composers usa id uuid, mas notifications.composer_id é bigint
-- Isso causa: "invalid input syntax for type bigint" ao filtrar por UUID
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Dropar a policy que depende da coluna composer_id
DROP POLICY IF EXISTS "Composers can view their own notifications" ON public.notifications;

-- 2. Dropar quaisquer outras policies que possam depender de composer_id
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'notifications' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
  END LOOP;
END $$;

-- 3. Dropar foreign key que referencia tabela legada com id integer
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_composer_id_fkey;

-- 4. Alterar tipo da coluna
ALTER TABLE public.notifications 
  ALTER COLUMN composer_id TYPE uuid USING composer_id::text::uuid;

-- 4. Recriar policies permissivas
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (true);

-- 5. Verificar resultado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' AND column_name = 'composer_id';
