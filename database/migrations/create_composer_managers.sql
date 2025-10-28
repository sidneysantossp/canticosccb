-- Tabela para gerenciamento de compositores
-- Permite que um usuário gerencie a conta de um compositor

CREATE TABLE IF NOT EXISTS compositor_gerentes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    compositor_id INT UNSIGNED NOT NULL COMMENT 'ID do compositor',
    gerente_usuario_id INT UNSIGNED NOT NULL COMMENT 'ID do usuário gerente',
    status ENUM('pendente', 'ativo', 'recusado', 'removido') DEFAULT 'pendente' COMMENT 'Status do relacionamento',
    convidado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data do convite',
    aceito_em TIMESTAMP NULL COMMENT 'Data da aceitação',
    removido_em TIMESTAMP NULL COMMENT 'Data da remoção',
    notas TEXT NULL COMMENT 'Notas sobre o gerenciamento',
    
    FOREIGN KEY (compositor_id) REFERENCES compositores(id) ON DELETE CASCADE,
    FOREIGN KEY (gerente_usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Prevenir duplicatas: um usuário não pode ser gerente do mesmo compositor múltiplas vezes
    UNIQUE KEY unique_compositor_gerente (compositor_id, gerente_usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para otimização
CREATE INDEX idx_compositor ON compositor_gerentes(compositor_id);
CREATE INDEX idx_gerente ON compositor_gerentes(gerente_usuario_id);
CREATE INDEX idx_status ON compositor_gerentes(status);

-- Tabela para notificações de convites
CREATE TABLE IF NOT EXISTS compositor_convites_notificacoes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    gerente_id INT UNSIGNED NOT NULL COMMENT 'ID do relacionamento compositor-gerente',
    usuario_id INT UNSIGNED NOT NULL COMMENT 'ID do usuário que deve receber a notificação',
    tipo ENUM('convite', 'aceito', 'recusado', 'removido') NOT NULL COMMENT 'Tipo da notificação',
    lida TINYINT(1) DEFAULT 0 COMMENT 'Se a notificação foi lida',
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
    lida_em TIMESTAMP NULL COMMENT 'Data da leitura',
    
    FOREIGN KEY (gerente_id) REFERENCES compositor_gerentes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX idx_usuario_lida ON compositor_convites_notificacoes(usuario_id, lida);
CREATE INDEX idx_gerente ON compositor_convites_notificacoes(gerente_id);
