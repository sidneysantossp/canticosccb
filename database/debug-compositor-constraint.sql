-- ============================================
-- DEBUG: Verificar constraint de compositor_id
-- ============================================

USE canticosccb_plataforma;

-- 1. Verificar usuários existentes
SELECT id, nome, email, tipo FROM usuarios ORDER BY id;

-- 2. Verificar compositores existentes
SELECT id, usuario_id, nome FROM compositores ORDER BY id;

-- 3. Verificar se existe compositor para usuario_id = 1
SELECT 
    u.id as usuario_id,
    u.nome as usuario_nome,
    c.id as compositor_id,
    c.nome as compositor_nome
FROM usuarios u
LEFT JOIN compositores c ON u.id = c.usuario_id
WHERE u.id = 1;

-- 4. Criar compositor para usuario_id = 1 se não existir
INSERT INTO compositores (usuario_id, nome, nome_artistico, verificado, ativo)
SELECT 1, u.nome, CONCAT(u.nome, ' (Compositor)'), 1, 1
FROM usuarios u 
WHERE u.id = 1 
AND NOT EXISTS (SELECT 1 FROM compositores WHERE usuario_id = 1);

-- 5. Verificar novamente após inserção
SELECT 
    u.id as usuario_id,
    u.nome as usuario_nome,
    c.id as compositor_id,
    c.nome as compositor_nome
FROM usuarios u
LEFT JOIN compositores c ON u.id = c.usuario_id
WHERE u.id = 1;
