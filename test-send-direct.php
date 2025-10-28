<?php
// Teste direto do envio de campanha
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
} else {
    // GET para teste rápido
    $input = [
        'title' => 'Teste Direto',
        'message' => 'Mensagem de teste',
        'targetType' => 'user',
        'targetId' => 8
    ];
}

try {
    // Conectar ao banco
    $pdo = new PDO('mysql:host=localhost;dbname=canticosccb_plataforma', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Buscar tokens para usuário 8
    $stmt = $pdo->prepare("SELECT token FROM push_tokens WHERE usuario_id = ? AND ativo = 1");
    $stmt->execute([8]);
    $tokens = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        'success' => true,
        'message' => 'Teste de envio simulado',
        'input' => $input,
        'tokens_found' => count($tokens),
        'tokens_preview' => array_map(function($t) { return substr($t, 0, 30) . '...'; }, array_slice($tokens, 0, 3)),
        'would_send_to' => count($tokens) . ' tokens',
        'note' => 'Este é apenas um teste - não envia notificações reais'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
