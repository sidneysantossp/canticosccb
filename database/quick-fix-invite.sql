-- VERSÃO SIMPLIFICADA - Execute linha por linha se necessário

-- 1. Deletar convites antigos (OPCIONAL)
DELETE FROM compositor_gerentes WHERE gerente_usuario_id IN (SELECT id FROM usuarios WHERE email = 'sid.websp@gmail.com');

-- 2. Criar convite (AJUSTE o compositor_id se necessário)
INSERT INTO compositor_gerentes (compositor_id, gerente_usuario_id, status, notas, convidado_em)
VALUES (
    1,
    (SELECT id FROM usuarios WHERE email = 'sid.websp@gmail.com'),
    'pendente',
    'Convite de teste',
    NOW()
);

-- 3. Verificar
SELECT * FROM compositor_gerentes WHERE gerente_usuario_id = (SELECT id FROM usuarios WHERE email = 'sid.websp@gmail.com');
