-- =============================================
-- FIX: Remover constraint UNIQUE do campo numero na tabela hinos
-- Múltiplos compositores podem gravar o mesmo hino (ex: Hino 40)
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Remover o índice unique
DROP INDEX IF EXISTS idx_hinos_numero_unique;

-- 2. Verificar se existe alguma outra constraint unique no campo numero
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.hinos'::regclass
      AND contype = 'u'
      AND array_to_string(conkey, ',') LIKE '%' || (
        SELECT attnum::text FROM pg_attribute
        WHERE attrelid = 'public.hinos'::regclass AND attname = 'numero'
      ) || '%'
  LOOP
    EXECUTE 'ALTER TABLE public.hinos DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- 3. Criar índice normal (não unique) para performance de busca por número
CREATE INDEX IF NOT EXISTS idx_hinos_numero ON public.hinos(numero);

-- 4. Verificar
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'hinos' AND indexname LIKE '%numero%';
