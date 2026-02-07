-- Tabela para Bíblia Narrada
CREATE TABLE IF NOT EXISTS bible_narrated (
  id SERIAL PRIMARY KEY,
  youtube_url TEXT NOT NULL DEFAULT '',
  youtube_video_id VARCHAR(50) NOT NULL DEFAULT '',
  title VARCHAR(500) NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  book_name VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  duration INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE bible_narrated ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de bible_narrated" ON bible_narrated
  FOR SELECT USING (true);

CREATE POLICY "Admins podem modificar bible_narrated" ON bible_narrated
  FOR ALL USING (true);
