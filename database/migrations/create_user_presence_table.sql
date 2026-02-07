-- Tabela para rastrear presença de usuários online
-- O heartbeat é enviado a cada 30 segundos pelo frontend

CREATE TABLE IF NOT EXISTS user_presence (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índice para consultas de usuários online (last_seen recente)
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen DESC);

-- Tabela para histórico de contagem de usuários online (snapshots)
CREATE TABLE IF NOT EXISTS user_presence_history (
  id BIGSERIAL PRIMARY KEY,
  online_count INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_history_recorded ON user_presence_history(recorded_at DESC);

-- Comentários
COMMENT ON TABLE user_presence IS 'Rastreia heartbeat dos usuários para determinar quem está online';
COMMENT ON TABLE user_presence_history IS 'Histórico de snapshots da contagem de usuários online';
