-- Script para verificar e corrigir a tabela de banners

-- 1. Verificar se a tabela banners existe e sua estrutura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'banners'
ORDER BY ordinal_position;

-- 2. Verificar quantos banners existem
SELECT COUNT(*) as total_banners FROM banners;

-- 3. Verificar banners ativos
SELECT COUNT(*) as banners_ativos FROM banners WHERE is_active = true;

-- 4. Listar todos os banners
SELECT id, title, is_active, position, type, image_url
FROM banners
ORDER BY position ASC;

-- 5. Se não houver banners, inserir alguns de exemplo
-- INSERT INTO banners (title, description, image_url, type, position, is_active, button_text)
-- VALUES 
--   ('Bem-vindo ao Canticos CCB', 'Descubra hinos publicados pela comunidade', 'https://picsum.photos/seed/banner1/1200/400', 'hero', 1, true, 'Explorar'),
--   ('Novos Hinos Publicados', 'Confira os últimos hinos adicionados', 'https://picsum.photos/seed/banner2/1200/400', 'promotional', 2, true, 'Ver Novos'),
--   ('Compositores em Destaque', 'Conheça os compositores mais populares', 'https://picsum.photos/seed/banner3/1200/400', 'featured', 3, true, 'Conhecer');
