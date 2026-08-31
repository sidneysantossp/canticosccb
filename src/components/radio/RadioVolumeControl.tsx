import React from 'react';
import { Volume2 } from 'lucide-react';

interface RadioVolumeControlProps {
  onChange: (volume: number) => void;
  volume: number;
}

const RadioVolumeControl: React.FC<RadioVolumeControlProps> = ({ onChange, volume }) => (
  <label className="radio-volume-control">
    <span className="radio-volume-icon" aria-hidden="true"><Volume2 /></span>
    <span className="sr-only">Volume da rádio</span>
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={volume}
      onChange={(event) => onChange(Number(event.target.value))}
      className="radio-volume radio-volume-slider"
      style={{ background: `linear-gradient(to right, #32d583 ${volume * 100}%, #34373a ${volume * 100}%)` }}
    />
  </label>
);

export default RadioVolumeControl;
