-- ============================================
-- DEBUG: Verificar problema na criação de álbuns
-- ============================================

USE canticosccb_plataforma;

-- 1. Verificar estrutura da tabela compositores
DESCRIBE compositores;

-- 2. Verificar se existe o campo usuario_id
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' 
AND TABLE_NAME = 'compositores' 
AND COLUMN_NAME = 'usuario_id';

-- 3. Listar todos os usuários
SELECT id, nome, email, tipo FROM usuarios ORDER BY id;

-- 4. Listar todos os compositores
SELECT id, nome, usuario_id FROM compositores ORDER BY id;

-- 5. Verificar se existe compositor para o usuário logado (assumindo id=1)
SELECT 
    u.id as usuario_id,
    u.nome as usuario_nome,
    u.tipo as usuario_tipo,
    c.id as compositor_id,
    c.nome as compositor_nome
FROM usuarios u
LEFT JOIN compositores c ON u.id = c.usuario_id
WHERE u.tipo IN ('compositor', 'admin')
ORDER BY u.id;

-- 6. Verificar estrutura da tabela albuns
DESCRIBE albuns;

-- 7. Listar álbuns existentes
SELECT id, titulo, compositor_id, ativo, created_at FROM albuns ORDER BY id DESC LIMIT 5;
