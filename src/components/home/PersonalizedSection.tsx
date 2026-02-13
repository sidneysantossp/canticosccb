import React, { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import type { RecTrack } from '@/lib/recommendations';

type Props = {
  title: string;
  items: RecTrack[];
  onPlay: (t: RecTrack) => void;
};

const PersonalizedSection: React.FC<Props> = ({ title, items, onPlay }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const valid = Array.isArray(items) ? items.filter((t) => !!t.cover_url && t.cover_url.trim() !== '') : [];

  // Rotação automática
  useEffect(() => {
    if (valid.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        // Se chegou perto do fim, volta pro começo
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Scrola um card (aprox 200px)
          scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
      }
    }, 4000); // 4 segundos

    return () => clearInterval(interval);
  }, [valid.length, isPaused]);

  if (valid.length === 0) return null;

  // Tratamento do título para quebra de linha
  const displayTitle = title === 'Recomendado para você' ? (
    <>
      Recomendado<br />
      para você
    </>
  ) : title;

  return (
    <section className="px-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">{displayTitle}</h2>
      </div>
      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {valid.slice(0, 12).map((t, idx) => (
          <div key={`${title}-${t.id}-${idx}`} className="group flex-shrink-0 w-48 bg-background-secondary hover:bg-background-tertiary p-4 rounded-lg transition-all duration-300 hover:scale-105">
            <div className="relative mb-4">
              <img src={t.cover_url} alt={t.title} className="w-full aspect-square object-cover rounded-lg shadow-lg" loading="lazy" />
              <button onClick={() => onPlay(t)} className="absolute bottom-2 right-2 bg-primary-500 hover:bg-primary-600 text-black p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg" aria-label={`Reproduzir ${t.title}`}>
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
            <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors leading-tight cursor-pointer text-sm sm:text-base mb-1 line-clamp-2">{t.title}</h3>
            <p className="text-sm text-gray-400 line-clamp-1">
              {t.composer_name || 'Compositor'}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PersonalizedSection;
