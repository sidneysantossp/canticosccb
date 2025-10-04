// ==================== SISTEMA DE BUSCA ====================
const searchInput = document.querySelector('.header-search input');
const searchResults = document.createElement('div');
searchResults.className = 'search-results';
searchResults.hidden = true;

console.log('🔍 Search input encontrado:', searchInput);

if (searchInput) {
    document.body.appendChild(searchResults);
    console.log('✅ Search results adicionado ao body');
    
    let searchTimeout;
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    const mockSearchData = [
        { type: 'hino', title: 'Hino 1 - Deus Eterno', category: 'Louvores' },
        { type: 'hino', title: 'Hino 5 - Vem Pecador', category: 'Convite' },
        { type: 'hino', title: 'Hino 10 - Ao Deus de Abraão', category: 'Adoração' },
        { type: 'playlist', title: 'Hinos Cantados', category: 'Playlist' },
        { type: 'playlist', title: 'Hinos Tocados', category: 'Playlist' },
        { type: 'artista', title: 'Coral CCB', category: 'Artista' },
    ];
    
    const positionSearchResults = () => {
        const rect = searchInput.parentElement.getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            searchResults.style.top = `${rect.bottom + 8}px`;
            searchResults.style.left = '16px';
            searchResults.style.right = '16px';
            searchResults.style.width = 'auto';
        } else {
            searchResults.style.top = `${rect.bottom + 8}px`;
            searchResults.style.left = `${rect.left}px`;
            searchResults.style.width = `${rect.width}px`;
            searchResults.style.right = 'auto';
        }
        
        console.log('📱 Mobile:', isMobile, 'Posição:', searchResults.style.top, searchResults.style.left);
    };
    
    const performSearch = (query) => {
        console.log('🔍 Buscando por:', query);
        
        if (!query.trim()) {
            searchResults.hidden = true;
            return;
        }
        
        const filtered = mockSearchData.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase())
        );
        
        console.log('📊 Resultados encontrados:', filtered.length);
        
        if (filtered.length === 0) {
            searchResults.innerHTML = '<div class="search-empty">Nenhum resultado encontrado</div>';
        } else {
            searchResults.innerHTML = filtered.map(item => `
                <div class="search-result-item" data-type="${item.type}">
                    <span class="search-icon">${item.type === 'hino' ? '🎵' : item.type === 'playlist' ? '📋' : '👤'}</span>
                    <div class="search-info">
                        <div class="search-title">${item.title}</div>
                        <div class="search-category">${item.category}</div>
                    </div>
                </div>
            `).join('');
        }
        
        positionSearchResults();
        console.log('📍 Posição:', searchResults.style.top, searchResults.style.left, searchResults.style.width);
        searchResults.hidden = false;
        console.log('✅ Dropdown exibido');
    };
    
    searchInput.addEventListener('input', (e) => {
        console.log('⌨️ Input event disparado, valor:', e.target.value);
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(e.target.value), 300);
    });
    
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim()) {
            performSearch(searchInput.value);
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!searchInput.parentElement.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.hidden = true;
        }
    });
    
    window.addEventListener('resize', () => {
        if (!searchResults.hidden) {
            positionSearchResults();
        }
    });
    
    window.addEventListener('scroll', () => {
        if (!searchResults.hidden) {
            positionSearchResults();
        }
    });
}

// ==================== DROPDOWN DO PERFIL ====================
// Removido - Widget movido para offcanvas

// ==================== OFFCANVAS USER HOVER ====================
const offcanvasUser = document.querySelector('.offcanvas-user');
if (offcanvasUser) {
    offcanvasUser.addEventListener('mouseenter', () => {
        offcanvasUser.style.background = 'rgba(0,0,0,0.5)';
    });
    offcanvasUser.addEventListener('mouseleave', () => {
        offcanvasUser.style.background = 'rgba(0,0,0,0.3)';
    });
}

// ==================== AÇÕES DE LIKE ====================
const likeButtons = document.querySelectorAll('[aria-label="Like track"]');

likeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        const isLiked = button.classList.toggle('is-liked');
        button.setAttribute('aria-pressed', String(isLiked));
        
        // Animação de feedback
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    });
});

// ==================== MINI PLAYER ====================
let currentTrack = null;
let isPlaying = false;

const miniPlayer = document.getElementById('miniPlayer');
const miniPlayerTitle = document.getElementById('miniPlayerTitle');
const miniPlayerCategory = document.getElementById('miniPlayerCategory');
const miniPlayerThumb = document.getElementById('miniPlayerThumb');
const miniPlayerPlayPause = document.getElementById('miniPlayerPlayPause');
const miniPlayerProgress = document.getElementById('miniPlayerProgress');
const miniPlayerElapsed = document.getElementById('miniPlayerElapsed');
const miniPlayerDuration = document.getElementById('miniPlayerDuration');

// Função para mostrar o mini player
function showMiniPlayer(trackData) {
    currentTrack = trackData;
    
    miniPlayerTitle.textContent = trackData.title;
    miniPlayerCategory.textContent = trackData.category;
    miniPlayerThumb.src = trackData.thumb;
    miniPlayerElapsed.textContent = trackData.elapsed;
    miniPlayerDuration.textContent = trackData.duration;
    
    // Atualizar progresso
    const progress = parseFloat(trackData.progress) || 0;
    miniPlayerProgress.style.width = `${progress}%`;
    
    miniPlayer.hidden = false;
    miniPlayer.classList.add('show');
    
    console.log('🎵 Mini player exibido:', trackData.title);
}

// Função para alternar play/pause
function togglePlayPause() {
    isPlaying = !isPlaying;
    
    const playIcon = miniPlayerPlayPause.querySelector('.play-icon');
    const pauseIcon = miniPlayerPlayPause.querySelector('.pause-icon');
    
    if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        console.log('▶️ Reproduzindo');
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        console.log('⏸️ Pausado');
    }
}

// Event listeners para botões do mini player
if (miniPlayerPlayPause) {
    miniPlayerPlayPause.addEventListener('click', togglePlayPause);
}

// Event listeners para botões de play das tracks
const trackPlayButtons = document.querySelectorAll('[data-trigger-mini-player]');

trackPlayButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        
        const trackData = {
            title: button.dataset.trackTitle,
            category: button.dataset.trackCategory,
            thumb: button.dataset.trackThumb,
            duration: button.dataset.trackDuration,
            elapsed: button.dataset.trackElapsed,
            progress: button.dataset.trackProgress
        };
        
        // Remover estado ativo de outros botões
        trackPlayButtons.forEach(btn => {
            btn.closest('.track-row')?.classList.remove('playing');
        });
        
        // Adicionar estado ativo ao botão atual
        button.closest('.track-row')?.classList.add('playing');
        
        showMiniPlayer(trackData);
        
        // Auto-play
        isPlaying = true;
        togglePlayPause();
    });
});

// ==================== OFFCANVAS MENU ====================
const offcanvasToggle = document.querySelector('.offcanvas-toggle');
const offcanvasMenu = document.getElementById('offcanvasMenu');
const offcanvasClose = document.querySelector('.offcanvas-close');
const offcanvasBackdrop = document.querySelector('.offcanvas-backdrop');

function openOffcanvas() {
    offcanvasMenu.setAttribute('aria-hidden', 'false');
    offcanvasMenu.classList.add('show');
    offcanvasBackdrop.hidden = false;
    document.body.classList.add('offcanvas-open');
    
    // Focus no botão de fechar para acessibilidade
    setTimeout(() => {
        offcanvasClose.focus();
    }, 300);
}

function closeOffcanvas() {
    offcanvasMenu.setAttribute('aria-hidden', 'true');
    offcanvasMenu.classList.remove('show');
    offcanvasBackdrop.hidden = true;
    document.body.classList.remove('offcanvas-open');
    
    // Retornar focus para o botão que abriu
    offcanvasToggle.focus();
}

// Event listeners
if (offcanvasToggle) {
    offcanvasToggle.addEventListener('click', () => {
        const isOpen = offcanvasMenu.getAttribute('aria-hidden') === 'false';
        if (isOpen) {
            closeOffcanvas();
        } else {
            openOffcanvas();
        }
    });
}

if (offcanvasClose) {
    offcanvasClose.addEventListener('click', closeOffcanvas);
}

if (offcanvasBackdrop) {
    offcanvasBackdrop.addEventListener('click', closeOffcanvas);
}

// Fechar com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && offcanvasMenu.classList.contains('show')) {
        closeOffcanvas();
    }
});

// ==================== CAROUSEL DOTS ====================
const carouselDots = document.querySelectorAll('.carousel-dots .dot');
const heroSlides = document.querySelectorAll('.hero-slide');

carouselDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        // Remove active de todos
        carouselDots.forEach(d => d.classList.remove('active'));
        heroSlides.forEach(s => s.classList.remove('active'));
        
        // Adiciona active ao clicado
        dot.classList.add('active');
        if (heroSlides[index]) {
            heroSlides[index].classList.add('active');
        }
    });
});

// Auto-rotate carousel
let currentSlide = 0;
function rotateCarousel() {
    carouselDots.forEach(d => d.classList.remove('active'));
    heroSlides.forEach(s => s.classList.remove('active'));
    
    carouselDots[currentSlide]?.classList.add('active');
    heroSlides[currentSlide]?.classList.add('active');
    
    currentSlide = (currentSlide + 1) % heroSlides.length;
}

// Iniciar primeiro slide
if (heroSlides.length > 0) {
    heroSlides[0].classList.add('active');
    carouselDots[0]?.classList.add('active');
    
    // Auto-rotate a cada 5 segundos
    setInterval(rotateCarousel, 5000);
}

console.log('🚀 Script carregado com sucesso!');
