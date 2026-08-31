import React from 'react';
import { Pause, Play } from 'lucide-react';

interface RadioPlayButtonProps {
  disabled?: boolean;
  isPlaying: boolean;
  onClick: () => void;
}

const RadioPlayButton: React.FC<RadioPlayButtonProps> = ({ disabled = false, isPlaying, onClick }) => (
  <div className={`radio-orbit-system ${isPlaying ? 'is-playing' : ''}`}>
    <div className="radio-orbit radio-orbit-outer" aria-hidden="true">
      <svg viewBox="0 0 400 400" focusable="false">
        <circle cx="200" cy="200" r="177" />
        <circle className="radio-orbit-highlight" cx="200" cy="200" r="177" />
      </svg>
    </div>
    <div className="radio-orbit radio-orbit-middle" aria-hidden="true">
      <svg viewBox="0 0 400 400" focusable="false">
        <circle cx="200" cy="200" r="142" />
        <circle className="radio-orbit-highlight" cx="200" cy="200" r="142" />
      </svg>
    </div>
    <div className="radio-orbit radio-orbit-inner" aria-hidden="true">
      <svg viewBox="0 0 400 400" focusable="false">
        <circle cx="200" cy="200" r="112" />
        <circle className="radio-orbit-highlight" cx="200" cy="200" r="112" />
      </svg>
    </div>

    <span className="radio-orbit-dot radio-orbit-dot-one" aria-hidden="true" />
    <span className="radio-orbit-dot radio-orbit-dot-two" aria-hidden="true" />
    <span className="radio-orbit-dot radio-orbit-dot-three" aria-hidden="true" />
    <span className="radio-orbit-pixels radio-orbit-pixels-left" aria-hidden="true" />
    <span className="radio-orbit-pixels radio-orbit-pixels-right" aria-hidden="true" />

    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isPlaying ? 'Pausar Rádio Cânticos' : 'Reproduzir Rádio Cânticos'}
      className="radio-play-core"
    >
      <span className="radio-play-core-ring" aria-hidden="true" />
      {isPlaying ? (
        <Pause className="radio-play-symbol radio-pause-symbol" aria-hidden="true" />
      ) : (
        <Play className="radio-play-symbol radio-play-symbol-offset" aria-hidden="true" />
      )}
    </button>
  </div>
);

export default RadioPlayButton;
