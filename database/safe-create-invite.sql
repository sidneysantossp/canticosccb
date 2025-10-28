-- VERSÃO MAIS SEGURA - Com variáveis

-- Passo 1: Ver IDs disponíveis
SELECT 'PASSO 1: IDs Disponíveis' as step;
SELECT id, nome FROM compositores LIMIT 5;
SELECT id, email FROM usuarios WHERE email = 'sid.websp@gmail.com';

-- Passo 2: Limpar convites antigos
SELECT 'PASSO 2: Limpando convites antigos' as step;
DELETE FROM compositor_gerentes 
WHERE gerente_usuario_id = (
    SELECT id FROM usuarios WHERE email = 'sid.websp@gmail.com' LIMIT 1
);

-- Passo 3: Criar convite
SELECT 'PASSO 3: Criando convite' as step;

SET @compositor_id = 1;
SET @usuario_id = (SELECT id FROM usuarios WHERE email = 'sid.websp@gmail.com' LIMIT 1);

INSERT INTO compositor_gerentes 
    (compositor_id, gerente_usuario_id, status, notas, convidado_em)
VALUES 
    (@compositor_id, @usuario_id, 'pendente', 'Convite de teste', NOW());

-- Passo 4: Verificar resultado
SELECT 'PASSO 4: Verificando resultado' as step;
SELECT 
    cg.id,
    cg.compositor_id,
    c.nome as compositor,
    cg.gerente_usuario_id,
    u.email as gerente,
    cg.status
FROM compositor_gerentes cg
JOIN compositores c ON cg.compositor_id = c.id  
JOIN usuarios u ON cg.gerente_usuario_id = u.id
WHERE u.email = 'sid.websp@gmail.com';
