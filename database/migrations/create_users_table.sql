-- ============================================
-- CRIAR TABELA USERS para Supabase Auth
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Criar tabela users se não existir
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- UUID do Supabase Auth
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone TEXT,
  birthdate DATE,
  location TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  is_admin BOOLEAN DEFAULT false,
  is_composer BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_is_composer ON public.users(is_composer);

-- 3. Habilitar Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public can read active users" ON public.users;

-- 5. Criar políticas RLS

-- 5.1 Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 5.2 Usuários podem inserir seu próprio perfil (via trigger ou signup)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 5.3 Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 5.4 Qualquer um pode ler usuários ativos (para busca pública)
CREATE POLICY "Public can read active users" ON public.users
  FOR SELECT USING (status = 'active' AND is_blocked = false);

-- 6. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Adicionar trigger para updated_at
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8. Verificar estrutura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 9. Verificar políticas
SELECT policyname, cmd, permissive, roles
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

SELECT '✅ Tabela users criada com sucesso!' AS status;
