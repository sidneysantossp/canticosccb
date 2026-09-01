import React from 'react';

export interface RadioProgram {
  id: 'morning' | 'afternoon' | 'night' | 'dawn';
  label: string;
  timeRange: string;
  tracks: Array<{
    artist: string;
    duration: string;
    id: string;
    title: string;
  }>;
}

interface RadioScheduleProps {
  activeIndex: number;
  currentTrackId?: string;
  programs: RadioProgram[];
}

const RadioSchedule: React.FC<RadioScheduleProps> = ({ activeIndex, currentTrackId, programs }) => (
  <section className="radio-schedule" aria-labelledby="radio-schedule-title">
    <h2 id="radio-schedule-title">Programação de hoje</h2>
    <div className="radio-schedule-shifts">
      {programs.map((program, index) => {
        const isActive = activeIndex === index;
        return (
          <article key={program.id} className={`radio-schedule-shift ${isActive ? 'is-active' : ''}`}>
            <header className="radio-schedule-shift-header">
              <div>
                <h3>{program.label}</h3>
                <time>{program.timeRange}</time>
              </div>
              {isActive ? <span className="radio-schedule-turn-live">Turno atual</span> : null}
            </header>
            <ol className="radio-schedule-list">
              {program.tracks.map((track, trackIndex) => {
                const isOnAir = Boolean(currentTrackId) && currentTrackId === track.id;
                return (
                  <li key={track.id} className={`radio-schedule-item ${isOnAir ? 'is-on-air' : ''}`}>
                    <span className="radio-schedule-position">{String(trackIndex + 1).padStart(2, '0')}</span>
                    <span className="radio-schedule-track-copy">
                      <strong>{track.title}</strong>
                      <small>{track.artist}</small>
                    </span>
                    <time>{track.duration || '—'}</time>
                    {isOnAir ? (
                      <span className="radio-schedule-live">
                        <span className="radio-schedule-equalizer" aria-hidden="true"><i /><i /><i /></span>
                        No ar
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </article>
        );
      })}
    </div>
  </section>
);

export default RadioSchedule;
