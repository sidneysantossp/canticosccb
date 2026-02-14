-- =============================================
-- FIX: Desabilitar RLS na tabela hinario
-- Conteúdo público, proteção admin feita no app (ProtectedRoute)
-- =============================================

-- Dropar TODAS as políticas existentes
DROP POLICY IF EXISTS "hinario_admin_all" ON hinario;
DROP POLICY IF EXISTS "hinario_public_read" ON hinario;
DROP POLICY IF EXISTS "hinario_admin_read" ON hinario;
DROP POLICY IF EXISTS "hinario_admin_insert" ON hinario;
DROP POLICY IF EXISTS "hinario_admin_update" ON hinario;
DROP POLICY IF EXISTS "hinario_admin_delete" ON hinario;
DROP POLICY IF EXISTS "hinario_auth_insert" ON hinario;
DROP POLICY IF EXISTS "hinario_auth_update" ON hinario;
DROP POLICY IF EXISTS "hinario_auth_delete" ON hinario;

-- Desabilitar RLS completamente
ALTER TABLE hinario DISABLE ROW LEVEL SECURITY;

SELECT 'RLS do hinario desabilitado com sucesso!' AS status;
