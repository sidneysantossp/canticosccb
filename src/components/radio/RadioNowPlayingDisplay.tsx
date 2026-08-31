import React from 'react';

interface RadioNowPlayingDisplayProps {
  trackName: string;
}

const RadioNowPlayingDisplay: React.FC<RadioNowPlayingDisplayProps> = ({ trackName }) => (
  <div className="radio-led-display" aria-label={`Tocando agora: ${trackName}`}>
    <span className="radio-led-label" aria-hidden="true">NO AR</span>
    <div className="radio-led-viewport">
      <span className="radio-led-track">{trackName}</span>
    </div>
  </div>
);

export default RadioNowPlayingDisplay;
