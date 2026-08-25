-- ============================================
-- DADOS INICIAIS (SEED)
-- Database: canticosccb_plataforma
-- ============================================

USE canticosccb_plataforma;

-- ============================================
-- 1. USUÁRIO ADMIN PADRÃO
-- ============================================
-- Senha: admin123 (ALTERE após primeiro login!)
-- Hash gerado com: password_hash('admin123', PASSWORD_DEFAULT)

INSERT INTO `usuarios` (`nome`, `email`, `senha`, `tipo`, `ativo`) VALUES
('Administrador', 'admin@canticosccb.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1)
ON DUPLICATE KEY UPDATE `nome` = VALUES(`nome`);

-- ============================================
-- CREDENCIAIS DE TESTE:
-- Email: admin@canticosccb.com.br
-- Senha: admin123
-- 
-- ⚠️ IMPORTANTE: Altere a senha após primeiro acesso!
-- ============================================

-- ============================================
-- 2. CATEGORIAS PADRÃO
-- ============================================
INSERT INTO `categorias` (`nome`, `slug`, `descricao`, `ativo`) VALUES
('Louvor', 'louvor', 'Hinos de louvor e adoração', 1),
('Gratidão', 'gratidao', 'Hinos de agradecimento', 1),
('Petição', 'peticao', 'Hinos de súplica e oração', 1),
('Consagração', 'consagracao', 'Hinos de entrega e dedicação', 1),
('Natal', 'natal', 'Hinos natalinos', 1),
('Páscoa', 'pascoa', 'Hinos da Páscoa', 1),
('Ceia', 'ceia', 'Hinos para Santa Ceia', 1),
('Batismo', 'batismo', 'Hinos para batismo', 1)
ON DUPLICATE KEY UPDATE `nome` = VALUES(`nome`);

-- ============================================
-- 3. GÊNEROS MUSICAIS PADRÃO
-- ============================================
INSERT INTO `generos` (`nome`, `slug`, `descricao`, `ativo`) VALUES
('Hino', 'hino', 'Hinos tradicionais', 1),
('Coral', 'coral', 'Músicas corais', 1),
('Solo', 'solo', 'Músicas solo', 1),
('Instrumental', 'instrumental', 'Músicas instrumentais', 1),
('Infantil', 'infantil', 'Músicas para crianças', 1)
ON DUPLICATE KEY UPDATE `nome` = VALUES(`nome`);

-- ============================================
-- 4. COMPOSITOR EXEMPLO
-- ============================================
INSERT INTO `compositores` (`nome`, `nome_artistico`, `biografia`, `verificado`, `ativo`) VALUES
('Desconhecido', 'Anônimo', 'Compositor não identificado', 0, 1)
ON DUPLICATE KEY UPDATE `nome` = VALUES(`nome`);

-- ============================================
-- 5. ÁLBUM EXEMPLO
-- ============================================
INSERT INTO `albuns` (`titulo`, `descricao`, `ano`, `compositor_id`, `ativo`) VALUES
('Hinário CCB', 'Hinário digital com repertório de hinos CCB', 2024, 1, 1)
ON DUPLICATE KEY UPDATE `titulo` = VALUES(`titulo`);

-- ============================================
-- CONFIRMAÇÃO
-- ============================================
SELECT 'Dados iniciais inseridos com sucesso!' AS status;
SELECT 
  (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
  (SELECT COUNT(*) FROM categorias) AS total_categorias,
  (SELECT COUNT(*) FROM generos) AS total_generos,
  (SELECT COUNT(*) FROM compositores) AS total_compositores,
  (SELECT COUNT(*) FROM albuns) AS total_albuns;
