-- ========================================
-- EXECUTE ESTES COMANDOS NO phpMyAdmin
-- COPIE E COLE UM COMANDO POR VEZ
-- ========================================

-- ============== ETAPA 1 ==============
-- Ver compositores existentes
SELECT id, nome FROM compositores;

-- ⚠️ ATENÇÃO:
-- Se a consulta RETORNOU compositores → ANOTE UM ID e PULE para ETAPA 3
-- Se a consulta RETORNOU VAZIO → Continue para ETAPA 2

-- ============== ETAPA 2 ==============
-- Criar compositor (SÓ execute se não houver compositores)
INSERT INTO compositores (nome, nome_artistico) 
VALUES ('Sidney Santos', 'Sidney Compositor');

-- Ver o ID que foi criado
SELECT id, nome FROM compositores ORDER BY id DESC LIMIT 1;

-- ⚠️ ANOTE O ID QUE APARECEU! (exemplo: 5 ou 7 ou 10)

-- ============== ETAPA 3 ==============
-- Limpar convites antigos
DELETE FROM compositor_gerentes 
WHERE gerente_usuario_id = (SELECT id FROM usuarios WHERE email = 'sid.websp@gmail.com');

-- ============== ETAPA 4 ==============
-- Criar convite
-- ⚠️⚠️⚠️ IMPORTANTE: SUBSTITUA O NÚMERO 999 ABAIXO PELO ID QUE VOCÊ ANOTOU! ⚠️⚠️⚠️

INSERT INTO compositor_gerentes (compositor_id, gerente_usuario_id, status, notas, convidado_em)
SELECT 
    999,
    id,
    'pendente',
    'Convite de teste',
    NOW()
FROM usuarios 
WHERE email = 'sid.websp@gmail.com'
LIMIT 1;

-- ============== ETAPA 5 ==============
-- Verificar se funcionou
SELECT 
    cg.id,
    cg.compositor_id,
    c.nome as compositor,
    u.email as gerente,
    cg.status
FROM compositor_gerentes cg
JOIN compositores c ON c.id = cg.compositor_id
JOIN usuarios u ON u.id = cg.gerente_usuario_id
WHERE u.email = 'sid.websp@gmail.com';
