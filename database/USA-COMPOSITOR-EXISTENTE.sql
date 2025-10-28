-- ========================================
-- USA COMPOSITOR EXISTENTE (SE HOUVER)
-- ========================================

-- ETAPA 1: Ver compositores disponíveis
SELECT id, nome, nome_artistico FROM compositores;

-- ⚠️ SE A CONSULTA ACIMA RETORNOU COMPOSITORES:
-- Anote um ID (ex: 5) e PULE PARA ETAPA 3

-- ⚠️ SE A CONSULTA RETORNOU VAZIO:
-- Execute ETAPA 2

-- ETAPA 2: Criar compositor
INSERT INTO compositores (nome, nome_artistico) 
VALUES ('Sidney Santos', 'Sidney Compositor');

-- Ver o ID criado
SELECT id, nome FROM compositores ORDER BY id DESC LIMIT 1;
-- ANOTE ESTE ID!

-- ETAPA 3: Criar convite (USE O ID QUE ANOTOU)
-- Exemplo: se o ID é 7, substitua XXXX por 7

INSERT INTO compositor_gerentes 
    (compositor_id, gerente_usuario_id, status, notas, convidado_em)
SELECT 
    XXXX,
    id,
    'pendente',
    'Convite de teste',
    NOW()
FROM usuarios 
WHERE email = 'sid.websp@gmail.com'
LIMIT 1;

-- ETAPA 4: Conferir
SELECT 
    cg.*,
    c.nome as compositor_nome,
    u.email as gerente_email
FROM compositor_gerentes cg
JOIN compositores c ON c.id = cg.compositor_id
JOIN usuarios u ON u.id = cg.gerente_usuario_id
WHERE u.email = 'sid.websp@gmail.com';
