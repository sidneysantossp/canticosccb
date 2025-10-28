-- ========================================
-- VERSÃO MAIS SIMPLES - SEM VARIÁVEIS
-- EXECUTE LINHA POR LINHA NO phpMyAdmin
-- ========================================

-- 1. Criar compositor
INSERT INTO compositores (nome, nome_artistico, verificado) 
VALUES ('Sidney Santos', 'Sidney Compositor', 1);

-- 2. Ver o ID que foi criado
SELECT id, nome FROM compositores ORDER BY id DESC LIMIT 1;

-- ⚠️ ANOTE O NÚMERO QUE APARECEU ACIMA! (ex: 5)

-- 3. Limpar convites antigos
DELETE FROM compositor_gerentes 
WHERE gerente_usuario_id = (SELECT id FROM usuarios WHERE email = 'sid.websp@gmail.com');

-- 4. Criar convite - TROQUE O 999 PELO ID QUE VOCÊ ANOTOU!
INSERT INTO compositor_gerentes (compositor_id, gerente_usuario_id, status, notas, convidado_em)
SELECT 
    999 as compositor_id,
    u.id as gerente_usuario_id,
    'pendente' as status,
    'Convite de teste' as notas,
    NOW() as convidado_em
FROM usuarios u
WHERE u.email = 'sid.websp@gmail.com'
LIMIT 1;

-- 5. Verificar
SELECT * FROM compositor_gerentes;
