<div id="miniPlayer" class="mini-player" hidden>
    <div class="mini-player-content">
        <div class="track-info">
            <img id="miniPlayerThumb" src="" alt="Track thumbnail" class="track-thumb">
            <div class="track-details">
                <span id="miniPlayerTitle" class="track-title">Track Title</span>
                <span id="miniPlayerCategory" class="track-category">Category</span>
            </div>
        </div>
        
        <div class="player-controls">
            <button id="miniPlayerPrev" class="control-btn" aria-label="Previous track">
                <svg viewBox="0 0 24 24" role="img" focusable="false">
                    <path d="M6 4h2v16H6V4zm4 0l10 8-10 8V4z" fill="currentColor"></path>
                </svg>
            </button>
            
            <button id="miniPlayerPlayPause" class="control-btn play-pause" aria-label="Play/Pause">
                <svg class="play-icon" viewBox="0 0 24 24" role="img" focusable="false">
                    <polygon points="9 7 17 12 9 17" fill="currentColor"></polygon>
                </svg>
                <svg class="pause-icon" viewBox="0 0 24 24" role="img" focusable="false" style="display: none;">
                    <rect x="8" y="7" width="3" height="10" rx="1" fill="currentColor"></rect>
                    <rect x="13" y="7" width="3" height="10" rx="1" fill="currentColor"></rect>
                </svg>
            </button>
            
            <button id="miniPlayerNext" class="control-btn" aria-label="Next track">
                <svg viewBox="0 0 24 24" role="img" focusable="false">
                    <path d="M16 4h2v16h-2V4zM4 4l10 8-10 8V4z" fill="currentColor"></path>
                </svg>
            </button>
        </div>
        
        <div class="progress-section">
            <span id="miniPlayerElapsed" class="time-elapsed">0:00</span>
            <div class="progress-bar">
                <div id="miniPlayerProgress" class="progress-fill"></div>
            </div>
            <span id="miniPlayerDuration" class="time-duration">0:00</span>
        </div>
        
        <div class="player-actions">
            <button class="action-btn" aria-label="Volume">
                <svg viewBox="0 0 24 24" role="img" focusable="false">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"></path>
                </svg>
            </button>
            
            <button id="miniPlayerQueue" class="action-btn" aria-label="Queue">
                <svg viewBox="0 0 24 24" role="img" focusable="false">
                    <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" fill="currentColor"></path>
                </svg>
            </button>
        </div>
    </div>
</div>
