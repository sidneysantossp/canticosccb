-- =============================================
-- FIX: Corrigir RLS da tabela cifras
-- O policy "FOR ALL" não funciona para INSERT sem WITH CHECK
-- Solução: separar em policies individuais por operação
-- =============================================

-- Dropar política antiga (FOR ALL) que não funciona para INSERT
DROP POLICY IF EXISTS "cifras_admin_write" ON cifras;
DROP POLICY IF EXISTS "cifras_admin_read" ON cifras;
DROP POLICY IF EXISTS "cifras_public_read" ON cifras;
DROP POLICY IF EXISTS "cifras_admin_insert" ON cifras;
DROP POLICY IF EXISTS "cifras_admin_update" ON cifras;
DROP POLICY IF EXISTS "cifras_admin_delete" ON cifras;

-- Recriar políticas corretas

-- 1. Leitura pública (cifras ativas)
CREATE POLICY "cifras_public_read" ON cifras
  FOR SELECT USING (is_active = true);

-- 2. Leitura admin (todas)
CREATE POLICY "cifras_admin_read" ON cifras
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
  );

-- 3. INSERT admin (WITH CHECK obrigatório para INSERT)
CREATE POLICY "cifras_admin_insert" ON cifras
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
  );

-- 4. UPDATE admin
CREATE POLICY "cifras_admin_update" ON cifras
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
  );

-- 5. DELETE admin
CREATE POLICY "cifras_admin_delete" ON cifras
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
  );
