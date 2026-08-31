import React from 'react';

export interface RadioProgram {
  hour: number;
  time: string;
  title: string;
}

interface RadioScheduleProps {
  activeIndex: number;
  programs: RadioProgram[];
}

const RadioSchedule: React.FC<RadioScheduleProps> = ({ activeIndex, programs }) => (
  <section className="radio-schedule" aria-labelledby="radio-schedule-title">
    <h2 id="radio-schedule-title">Programação de hoje</h2>
    <ol className="radio-schedule-list">
      {programs.map((program, index) => {
        const isActive = activeIndex === index;
        return (
          <li key={program.time} className={`radio-schedule-item ${isActive ? 'is-active' : ''}`}>
            <time dateTime={program.time}>{program.time}</time>
            <span className="radio-schedule-title">{program.title}</span>
            {isActive ? (
              <span className="radio-schedule-live">
                <span className="radio-schedule-equalizer" aria-hidden="true"><i /><i /><i /></span>
                No ar
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  </section>
);

export default RadioSchedule;
