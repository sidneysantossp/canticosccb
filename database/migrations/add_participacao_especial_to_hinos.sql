-- Adicionar coluna participacao_especial na tabela hinos
-- Para registrar participações especiais em hinos (ex: participação de artistas convidados)

ALTER TABLE hinos ADD COLUMN IF NOT EXISTS participacao_especial TEXT;

-- Comentário na coluna
COMMENT ON COLUMN hinos.participacao_especial IS 'Participação especial no hino (artistas convidados, colaborações, etc.)';
