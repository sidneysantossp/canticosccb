<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spotify Inspired UI</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="app">
        <?php include __DIR__ . '/includes/top-nav.php'; ?>

        <div class="content-wrapper">
            <?php include __DIR__ . '/includes/sidebar.php'; ?>
            <?php include __DIR__ . '/includes/main-content.php'; ?>
            <?php include __DIR__ . '/includes/right-sidebar.php'; ?>
        </div>

        <?php include __DIR__ . '/includes/player.php'; ?>
    </div>

    <aside id="offcanvasMenu" class="offcanvas" aria-hidden="true" aria-labelledby="offcanvasTitle">
        <div class="offcanvas-header">
            <h2 id="offcanvasTitle">Menu Rápido</h2>
            <button class="offcanvas-close" type="button" aria-label="Fechar menu">×</button>
        </div>
        
        <a href="#" class="offcanvas-user" style="display: flex; align-items: center; gap: 12px; padding: 16px 24px; background: rgba(0,0,0,0.3); margin-bottom: 0; text-decoration: none; border-radius: 8px; transition: background 0.2s ease;">
            <img src="https://i.pravatar.cc/80" alt="User Avatar" class="offcanvas-user-avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">
            <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;">
                <span style="font-size: 14px; font-weight: 700; color: #1db954; line-height: 1.2;">Jane Doe</span>
                <a href="#" style="font-size: 12px; color: #b3b3b3; text-decoration: none; line-height: 1.2;">Meu Perfil</a>
            </div>
            <span class="offcanvas-user-dot" style="font-size: 14px; color: #b3b3b3; flex-shrink: 0;">•</span>
        </a>
        
        <nav class="offcanvas-nav" aria-label="Menu secundário">
            <a href="#">Home</a>
            <a href="#">Search</a>
            <a href="#">Your Library</a>
            <a href="#">Create Playlist</a>
            <a href="#">Liked Songs</a>
            <a href="#">Downloaded</a>
        </nav>
    </aside>

    <div class="offcanvas-backdrop" hidden></div>

    <script src="script.js"></script>
    <script src="queue.js"></script>
</body>
</html>
