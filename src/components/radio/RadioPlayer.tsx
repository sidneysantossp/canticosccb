import React from 'react';
import RadioLiveStatus from './RadioLiveStatus';
import RadioNowPlayingDisplay from './RadioNowPlayingDisplay';
import RadioPlayButton from './RadioPlayButton';
import RadioVolumeControl from './RadioVolumeControl';

interface RadioPlayerProps {
  disabled?: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  trackName: string;
  volume: number;
}

const RadioPlayer: React.FC<RadioPlayerProps> = ({
  disabled = false,
  isPlaying,
  onPlayPause,
  onVolumeChange,
  trackName,
  volume,
}) => (
  <section className="radio-player-shell" aria-labelledby="radio-title">
    <div className="radio-player-ambient" aria-hidden="true" />
    <div className="radio-player-content">
      <h1 id="radio-title">Rádio Cânticos CCB</h1>
      <RadioNowPlayingDisplay trackName={trackName} />
      <RadioLiveStatus />
      <div className="radio-player-stage">
        <RadioPlayButton disabled={disabled} isPlaying={isPlaying} onClick={onPlayPause} />
      </div>
      <RadioVolumeControl volume={volume} onChange={onVolumeChange} />
    </div>
  </section>
);

export default RadioPlayer;
