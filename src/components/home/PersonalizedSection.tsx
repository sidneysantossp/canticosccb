import React from 'react';
import { Play } from 'lucide-react';
import type { RecTrack } from '@/lib/recommendations';

type Props = {
  title: string;
  items: RecTrack[];
  onPlay: (t: RecTrack) => void;
};

const PersonalizedSection: React.FC<Props> = ({ title, items, onPlay }) => {
  const valid = Array.isArray(items) ? items.filter((t) => !!t.cover_url && t.cover_url.trim() !== '') : [];
  if (valid.length === 0) return null;

  return (
    <section className="px-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
      </div>
      <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {valid.slice(0, 12).map((t, idx) => (
          <div key={`${title}-${t.id}-${idx}`} className="group flex-shrink-0 w-48 bg-background-secondary hover:bg-background-tertiary p-4 rounded-lg transition-all duration-300 hover:scale-105">
            <div className="relative mb-4">
              <img src={t.cover_url} alt={t.title} className="w-full aspect-square object-cover rounded-lg shadow-lg" loading="lazy" />
              <button onClick={() => onPlay(t)} className="absolute bottom-2 right-2 bg-primary-500 hover:bg-primary-600 text-black p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg" aria-label={`Reproduzir ${t.title}`}>
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
            <h3 className="font-bold text-white mb-1 line-clamp-2">{t.title}</h3>
            <p className="text-sm text-gray-400 line-clamp-1">{t.composer_name || 'Compositor'}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PersonalizedSection;
