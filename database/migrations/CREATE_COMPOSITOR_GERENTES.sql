-- ============================================
-- Criar tabela compositor_gerentes
-- Relaciona compositores com seus gerentes de conta
-- ============================================

-- PASSO 1: Dropar tabela se existir (para recriar limpo)
DROP TABLE IF EXISTS public.compositor_gerentes CASCADE;

-- PASSO 2: Criar tabela (gerente_id como TEXT para flexibilidade)
CREATE TABLE public.compositor_gerentes (
  id BIGSERIAL PRIMARY KEY,
  compositor_id BIGINT NOT NULL,
  gerente_id TEXT NOT NULL,
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

-- PASSO 3: Índices
CREATE INDEX idx_compositor_gerentes_gerente_id ON public.compositor_gerentes(gerente_id);
CREATE INDEX idx_compositor_gerentes_compositor_id ON public.compositor_gerentes(compositor_id);
CREATE INDEX idx_compositor_gerentes_status ON public.compositor_gerentes(status);

-- PASSO 4: RLS
ALTER TABLE public.compositor_gerentes ENABLE ROW LEVEL SECURITY;

-- Gerentes podem ver seus registros
CREATE POLICY "Gerentes podem ver seus registros"
  ON public.compositor_gerentes
  FOR SELECT
  USING (gerente_id = auth.uid()::text);

-- Qualquer autenticado pode inserir convites
CREATE POLICY "Usuarios podem criar convites"
  ON public.compositor_gerentes
  FOR INSERT
  WITH CHECK (true);

-- Gerentes podem atualizar seus convites
CREATE POLICY "Gerentes podem atualizar seus convites"
  ON public.compositor_gerentes
  FOR UPDATE
  USING (gerente_id = auth.uid()::text);

-- PASSO 5: Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_compositor_gerentes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_compositor_gerentes_updated_at
  BEFORE UPDATE ON public.compositor_gerentes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_compositor_gerentes_updated_at();
