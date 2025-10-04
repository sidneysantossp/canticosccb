// ==================== SISTEMA DE FILA ====================
class QueueManager {
    constructor() {
        this.queue = [];
        this.currentIndex = -1;
        this.isShuffled = false;
        this.repeatMode = 'none'; // 'none', 'one', 'all'
        this.originalQueue = [];
        
        this.initializeEventListeners();
        console.log('🎵 Queue Manager inicializado');
    }
    
    // Adicionar música à fila
    addToQueue(track) {
        this.queue.push(track);
        this.saveToStorage();
        console.log('➕ Adicionado à fila:', track.title);
        this.updateQueueDisplay();
    }
    
    // Remover música da fila
    removeFromQueue(index) {
        if (index >= 0 && index < this.queue.length) {
            const removed = this.queue.splice(index, 1)[0];
            console.log('➖ Removido da fila:', removed.title);
            
            // Ajustar índice atual se necessário
            if (index < this.currentIndex) {
                this.currentIndex--;
            } else if (index === this.currentIndex) {
                this.currentIndex = -1;
            }
            
            this.saveToStorage();
            this.updateQueueDisplay();
        }
    }
    
    // Próxima música
    next() {
        if (this.queue.length === 0) return null;
        
        if (this.repeatMode === 'one') {
            return this.queue[this.currentIndex];
        }
        
        this.currentIndex++;
        
        if (this.currentIndex >= this.queue.length) {
            if (this.repeatMode === 'all') {
                this.currentIndex = 0;
            } else {
                this.currentIndex = this.queue.length - 1;
                return null;
            }
        }
        
        const nextTrack = this.queue[this.currentIndex];
        console.log('⏭️ Próxima música:', nextTrack?.title);
        return nextTrack;
    }
    
    // Música anterior
    previous() {
        if (this.queue.length === 0) return null;
        
        if (this.repeatMode === 'one') {
            return this.queue[this.currentIndex];
        }
        
        this.currentIndex--;
        
        if (this.currentIndex < 0) {
            if (this.repeatMode === 'all') {
                this.currentIndex = this.queue.length - 1;
            } else {
                this.currentIndex = 0;
                return null;
            }
        }
        
        const prevTrack = this.queue[this.currentIndex];
        console.log('⏮️ Música anterior:', prevTrack?.title);
        return prevTrack;
    }
    
    // Embaralhar fila
    shuffle() {
        if (this.queue.length <= 1) return;
        
        if (!this.isShuffled) {
            this.originalQueue = [...this.queue];
            
            // Fisher-Yates shuffle
            for (let i = this.queue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
            }
            
            this.isShuffled = true;
            console.log('🔀 Fila embaralhada');
        } else {
            this.queue = [...this.originalQueue];
            this.isShuffled = false;
            console.log('🔀 Fila desembaralhada');
        }
        
        this.saveToStorage();
        this.updateQueueDisplay();
    }
    
    // Alterar modo de repetição
    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentModeIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentModeIndex + 1) % modes.length];
        
        console.log('🔁 Modo de repetição:', this.repeatMode);
        this.saveToStorage();
        this.updateRepeatButton();
    }
    
    // Limpar fila
    clearQueue() {
        this.queue = [];
        this.originalQueue = [];
        this.currentIndex = -1;
        this.isShuffled = false;
        
        console.log('🗑️ Fila limpa');
        this.saveToStorage();
        this.updateQueueDisplay();
    }
    
    // Salvar no localStorage
    saveToStorage() {
        const queueData = {
            queue: this.queue,
            currentIndex: this.currentIndex,
            isShuffled: this.isShuffled,
            repeatMode: this.repeatMode,
            originalQueue: this.originalQueue
        };
        
        localStorage.setItem('musicQueue', JSON.stringify(queueData));
    }
    
    // Carregar do localStorage
    loadFromStorage() {
        const saved = localStorage.getItem('musicQueue');
        if (saved) {
            try {
                const queueData = JSON.parse(saved);
                this.queue = queueData.queue || [];
                this.currentIndex = queueData.currentIndex || -1;
                this.isShuffled = queueData.isShuffled || false;
                this.repeatMode = queueData.repeatMode || 'none';
                this.originalQueue = queueData.originalQueue || [];
                
                console.log('💾 Fila carregada do storage');
                this.updateQueueDisplay();
            } catch (error) {
                console.error('❌ Erro ao carregar fila:', error);
            }
        }
    }
    
    // Atualizar display da fila
    updateQueueDisplay() {
        const queueContainer = document.getElementById('queueList');
        if (!queueContainer) return;
        
        if (this.queue.length === 0) {
            queueContainer.innerHTML = '<div class="queue-empty">Nenhuma música na fila</div>';
            return;
        }
        
        queueContainer.innerHTML = this.queue.map((track, index) => `
            <div class="queue-item ${index === this.currentIndex ? 'current' : ''}" data-index="${index}">
                <img src="${track.thumb}" alt="${track.title}" class="queue-thumb">
                <div class="queue-info">
                    <span class="queue-title">${track.title}</span>
                    <span class="queue-category">${track.category}</span>
                </div>
                <span class="queue-duration">${track.duration}</span>
                <button class="queue-remove" data-index="${index}" aria-label="Remover da fila">
                    <svg viewBox="0 0 24 24" role="img" focusable="false">
                        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
                        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
                    </svg>
                </button>
            </div>
        `).join('');
        
        // Adicionar event listeners para remoção
        queueContainer.querySelectorAll('.queue-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(button.dataset.index);
                this.removeFromQueue(index);
            });
        });
        
        // Adicionar event listeners para tocar música
        queueContainer.querySelectorAll('.queue-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.playTrackAtIndex(index);
            });
        });
    }
    
    // Tocar música em índice específico
    playTrackAtIndex(index) {
        if (index >= 0 && index < this.queue.length) {
            this.currentIndex = index;
            const track = this.queue[index];
            
            // Disparar evento para o mini player
            if (typeof showMiniPlayer === 'function') {
                showMiniPlayer(track);
            }
            
            console.log('▶️ Tocando da fila:', track.title);
            this.updateQueueDisplay();
        }
    }
    
    // Atualizar botão de repetição
    updateRepeatButton() {
        const repeatButton = document.getElementById('repeatButton');
        if (repeatButton) {
            repeatButton.className = `repeat-button repeat-${this.repeatMode}`;
            repeatButton.setAttribute('aria-label', `Repetir: ${this.repeatMode}`);
        }
    }
    
    // Inicializar event listeners
    initializeEventListeners() {
        // Botão de embaralhar
        const shuffleButton = document.getElementById('shuffleButton');
        if (shuffleButton) {
            shuffleButton.addEventListener('click', () => this.shuffle());
        }
        
        // Botão de repetir
        const repeatButton = document.getElementById('repeatButton');
        if (repeatButton) {
            repeatButton.addEventListener('click', () => this.toggleRepeat());
        }
        
        // Botão de limpar fila
        const clearQueueButton = document.getElementById('clearQueue');
        if (clearQueueButton) {
            clearQueueButton.addEventListener('click', () => {
                if (confirm('Deseja limpar toda a fila?')) {
                    this.clearQueue();
                }
            });
        }
        
        // Botão da fila no mini player
        const queueToggle = document.getElementById('miniPlayerQueue');
        if (queueToggle) {
            queueToggle.addEventListener('click', () => {
                this.toggleQueuePanel();
            });
        }
    }
    
    // Alternar painel da fila
    toggleQueuePanel() {
        const queuePanel = document.getElementById('queuePanel');
        if (queuePanel) {
            const isVisible = !queuePanel.hidden;
            queuePanel.hidden = isVisible;
            
            if (!isVisible) {
                this.updateQueueDisplay();
            }
            
            console.log('📋 Painel da fila:', isVisible ? 'fechado' : 'aberto');
        }
    }
}

// Inicializar gerenciador de fila
const queueManager = new QueueManager();

// Carregar fila salva
document.addEventListener('DOMContentLoaded', () => {
    queueManager.loadFromStorage();
});

// Exportar para uso global
window.queueManager = queueManager;

console.log('🎵 Sistema de fila carregado!');
