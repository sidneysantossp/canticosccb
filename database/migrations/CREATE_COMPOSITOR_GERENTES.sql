-- ============================================
-- Criar tabela compositor_gerentes
-- Relaciona compositores com seus gerentes de conta
-- ============================================

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS public.compositor_gerentes (
  id BIGSERIAL PRIMARY KEY,
  compositor_id BIGINT NOT NULL,
  gerente_id UUID NOT NULL,
  gerente_email TEXT,
  compositor_nome TEXT,
  compositor_nome_artistico TEXT,
  compositor_email TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'ativo', 'recusado', 'removido')),
  notas TEXT,
  convidado_em TIMESTAMPTZ DEFAULT NOW(),
  aceito_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_compositor_gerentes_gerente_id ON public.compositor_gerentes(gerente_id);
CREATE INDEX IF NOT EXISTS idx_compositor_gerentes_compositor_id ON public.compositor_gerentes(compositor_id);
CREATE INDEX IF NOT EXISTS idx_compositor_gerentes_status ON public.compositor_gerentes(status);

-- 3. RLS (Row Level Security)
ALTER TABLE public.compositor_gerentes ENABLE ROW LEVEL SECURITY;

-- Política: qualquer usuário autenticado pode ler seus próprios registros (como gerente)
CREATE POLICY "Gerentes podem ver seus registros"
  ON public.compositor_gerentes
  FOR SELECT
  USING (auth.uid() = gerente_id);

-- Política: compositores podem ver convites para eles
CREATE POLICY "Compositores podem ver convites"
  ON public.compositor_gerentes
  FOR SELECT
  USING (
    compositor_id IN (
      SELECT id FROM public.compositores WHERE user_id = auth.uid()
    )
  );

-- Política: usuários autenticados podem inserir (para enviar convites)
CREATE POLICY "Usuarios podem criar convites"
  ON public.compositor_gerentes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política: gerentes podem atualizar status dos seus convites
CREATE POLICY "Gerentes podem atualizar seus convites"
  ON public.compositor_gerentes
  FOR UPDATE
  USING (auth.uid() = gerente_id);

-- Política: service_role pode tudo (para triggers e admin)
CREATE POLICY "Service role full access"
  ON public.compositor_gerentes
  FOR ALL
  USING (auth.role() = 'service_role');

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_compositor_gerentes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_compositor_gerentes_updated_at ON public.compositor_gerentes;
CREATE TRIGGER trigger_update_compositor_gerentes_updated_at
  BEFORE UPDATE ON public.compositor_gerentes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_compositor_gerentes_updated_at();

-- ============================================
-- INSTRUÇÕES:
-- Execute este SQL no Supabase SQL Editor:
-- Dashboard > SQL Editor > New Query > Cole e execute
-- ============================================
