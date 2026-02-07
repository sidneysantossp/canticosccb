<?php
// Teste direto sem dependências
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    // Conectar ao banco
    $pdo = new PDO('mysql:host=localhost;dbname=canticosccb_plataforma', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Gerar token de teste
    $token = 'dL8Z9Qx4RK0:APA91bH' . str_repeat('A', 140) . rand(1000, 9999);
    
    // Inserir token
    $stmt = $pdo->prepare("INSERT INTO push_tokens (usuario_id, token, plataforma, ativo) VALUES (8, ?, 'web', 1) ON DUPLICATE KEY UPDATE token = VALUES(token)");
    $stmt->execute([$token]);
    
    // Verificar
    $check = $pdo->query("SELECT COUNT(*) FROM push_tokens WHERE usuario_id = 8 AND ativo = 1");
    $count = $check->fetchColumn();
    
    echo json_encode([
        'success' => true,
        'message' => 'Token registrado',
        'tokens_count' => (int)$count,
        'token_preview' => substr($token, 0, 50) . '...'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
