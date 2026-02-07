-- Adicionar campo para rastrear fonte YouTube (apenas uso interno)
ALTER TABLE hinos ADD COLUMN IF NOT EXISTS youtube_source TEXT;

-- Adicionar comentário para documentar o propósito
COMMENT ON COLUMN hinos.youtube_source IS 'ID do vídeo do YouTube (uso interno apenas)';

-- Criar índice para performance (opcional)
CREATE INDEX IF NOT EXISTS idx_hinos_youtube_source ON hinos(youtube_source) WHERE youtube_source IS NOT NULL;
