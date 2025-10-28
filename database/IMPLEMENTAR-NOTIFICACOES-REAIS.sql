-- ==============================================
-- SCRIPT: Implementar Sistema de Notificações Reais
-- Data: 21/10/2025
-- Descrição: Cria tabela de notificações e integra com convites de gestores
-- ==============================================

USE canticosccb_plataforma;

-- 1. Criar tabela de notificações (SEM foreign key para evitar problemas)
DROP TABLE IF EXISTS notificacoes;

CREATE TABLE notificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo ENUM('convite', 'geral', 'sistema') NOT NULL DEFAULT 'geral',
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT,
    link VARCHAR(500),
    lida TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuario_lida (usuario_id, lida),
    INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Criar notificações de boas-vindas para usuários existentes (opcional)
-- Descomente a linha abaixo se quiser criar notificação de boas-vindas para todos
-- INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, lida)
-- SELECT id, 'geral', 'Bem-vindo ao Cânticos CCB!', 'Aproveite nossa plataforma de hinos e canções.', 1
-- FROM usuarios WHERE ativo = 1;

-- 3. Verificar estrutura criada
SELECT 'Tabela notificacoes criada com sucesso!' as Status;

-- 4. Mostrar notificações existentes
SELECT COUNT(*) as TotalNotificacoes FROM notificacoes;

-- FIM DO SCRIPT
