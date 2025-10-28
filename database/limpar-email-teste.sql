-- =========================================
-- LIMPAR EMAIL DE TESTE PARA NOVO CADASTRO
-- =========================================

-- PASSO 1: Verificar se existe na tabela usuarios
SELECT 
    u.id,
    u.nome,
    u.email,
    u.tipo,
    u.ativo,
    u.created_at
FROM usuarios u
WHERE u.email = 'compositor@canticosccb.com.br';

-- Se retornou algum resultado, continue para PASSO 2

-- PASSO 2: Verificar se existe compositor vinculado
SELECT 
    c.id as compositor_id,
    c.nome as compositor_nome,
    c.usuario_id,
    u.email
FROM compositores c
INNER JOIN usuarios u ON c.usuario_id = u.id
WHERE u.email = 'compositor@canticosccb.com.br';

-- PASSO 3: Deletar compositor (se existir)
-- ATENÇÃO: Isso deletará também os documentos relacionados!
DELETE c FROM compositores c
INNER JOIN usuarios u ON c.usuario_id = u.id
WHERE u.email = 'compositor@canticosccb.com.br';

-- PASSO 4: Deletar usuário
DELETE FROM usuarios 
WHERE email = 'compositor@canticosccb.com.br';

-- PASSO 5: Verificar se foi removido
SELECT COUNT(*) as ainda_existe
FROM usuarios 
WHERE email = 'compositor@canticosccb.com.br';
-- Deve retornar 0

-- Agora você pode cadastrar novamente!
