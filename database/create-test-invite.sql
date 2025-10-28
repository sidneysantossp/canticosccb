-- Script corrigido para criar convite de teste

-- Primeiro: verificar usuário e compositor existentes
SELECT 'Verificando dados...' as info;

-- Ver usuário sid.websp@gmail.com
SELECT id as usuario_id, nome, email FROM usuarios WHERE email = 'sid.websp@gmail.com';

-- Ver compositores disponíveis
SELECT id as compositor_id, nome, nome_artistico FROM compositores LIMIT 5;

-- DELETAR convites antigos do usuário (se necessário)
DELETE FROM compositor_gerentes 
WHERE gerente_usuario_id = (SELECT id FROM usuarios WHERE email = 'sid.websp@gmail.com');

-- CRIAR NOVO CONVITE
-- IMPORTANTE: Ajuste o compositor_id (primeiro número) para um ID válido da sua tabela compositores
INSERT INTO compositor_gerentes 
(compositor_id, gerente_usuario_id, status, notas, convidado_em)
SELECT 
    1 as compositor_id,
    u.id as gerente_usuario_id,
    'pendente' as status,
    'Convite de teste para gerenciar conta' as notas,
    NOW() as convidado_em
FROM usuarios u
WHERE u.email = 'sid.websp@gmail.com'
LIMIT 1;

-- Verificar resultado
SELECT 'Convite criado com sucesso!' as info;

SELECT 
    cg.id,
    cg.compositor_id,
    c.nome as compositor_nome,
    c.nome_artistico,
    u.email as gerente_email,
    cg.status,
    cg.convidado_em
FROM compositor_gerentes cg
JOIN compositores c ON cg.compositor_id = c.id
JOIN usuarios u ON cg.gerente_usuario_id = u.id
WHERE u.email = 'sid.websp@gmail.com';
