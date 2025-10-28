-- ============================================
-- CRIAR COMPOSITOR DE TESTE
-- ============================================

USE canticosccb_plataforma;

-- Primeiro, verificar se a migração foi executada
-- Se não existir o campo usuario_id, execute: add_compositor_fields.sql

-- Criar compositor para o usuário admin (assumindo id=1)
INSERT INTO compositores (nome, nome_artistico, biografia, usuario_id, verificado, ativo)
VALUES (
    'Compositor Teste',
    'Compositor Teste',
    'Compositor criado para testes de álbuns',
    1, -- ID do usuário admin
    1, -- verificado
    1  -- ativo
) ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- Verificar se foi criado
SELECT 
    u.id as usuario_id,
    u.nome as usuario_nome,
    c.id as compositor_id,
    c.nome as compositor_nome
FROM usuarios u
LEFT JOIN compositores c ON u.id = c.usuario_id
WHERE u.id = 1;
