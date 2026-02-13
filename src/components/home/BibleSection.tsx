import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Book, Clock } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import BibleAudioPlayer from '@/components/bible/BibleAudioPlayer';
import BibleMobilePlayer from '@/components/bible/BibleMobilePlayer';
import { getYouTubeAudioUrl } from '@/utils/youtubeApi';
import { fetchActiveBibleNarrated, type BibleNarrated } from '@/api/bibleNarrated';

const BibleSection: React.FC = () => {
  const { play } = usePlayerStore();
  const [bibleData, setBibleData] = useState<BibleNarrated[]>([]);
  const [selectedBible, setSelectedBible] = useState<BibleNarrated | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar se é mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Carregar dados do banco
    loadBibleData();
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadBibleData = async () => {
    try {
      const data = await fetchActiveBibleNarrated();
      setBibleData(data);
    } catch (error) {
      console.error('Erro ao carregar Bíblia Narrada:', error);
      setBibleData([]);
    }
  };

  const handlePlayBible = (bible: BibleNarrated) => {
    if (isMobile) {
      // Mobile: Abrir player fullscreen
      setSelectedBible(bible);
    } else {
      // Desktop: Usar player do store
      const bibleTrack = {
        id: bible.id.toString(),
        number: bible.id,
        title: bible.title,
        artist: 'Bíblia Narrada',
        category: 'Bíblia',
        duration: formatDuration(bible.duration || 0),
        plays: 125000,
        isLiked: false,
        coverUrl: bible.thumbnail_url,
        audioUrl: getYouTubeAudioUrl(bible.youtube_video_id),
        createdAt: new Date().toISOString()
      };
      play(bibleTrack);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!bibleData || bibleData.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
            Bíblia<br />Narrada
          </h2>
        </div>
        <div className="hidden md:block">
          <Link to="/biblia-narrada" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Ver todos
          </Link>
        </div>
      </div>

      {/* Mobile: Horizontal Scroll (cards menores) */}
      <div className="md:hidden">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 px-6 -mx-6">
          {bibleData.map((bible) => (
            <div
              key={bible.id}
              className="group bg-background-secondary rounded-lg overflow-hidden hover:bg-background-tertiary transition-all duration-300 flex-shrink-0 w-64"
            >
              <div className="flex h-28">
                {/* Cover Image */}
                <div className="w-28 h-full relative overflow-hidden flex-shrink-0">
                  <img 
                    src={bible.thumbnail_url}
                    alt={bible.book_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  
                  {/* Play Button Overlay */}
                  <button
                    onClick={() => handlePlayBible(bible)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                    aria-label={`Reproduzir ${bible.book_name}`}
                  >
                    <Play className="w-6 h-6 text-white fill-current" />
                  </button>

                  {/* Duration Badge */}
                  <div className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(bible.duration || 0)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Book className="w-4 h-4 text-primary-400" />
                    <span className="text-primary-400 text-sm font-medium">
                      {bible.book_name}
                    </span>
                  </div>
                  
                  <h3 className="text-base font-semibold text-white mb-1.5 line-clamp-1">
                    {bible.title}
                  </h3>
                  
                  <p className="text-gray-400 text-xs line-clamp-2 mb-2.5">
                    {bible.description}
                  </p>

                  <button
                    onClick={() => handlePlayBible(bible)}
                    className="w-full bg-background-tertiary hover:bg-primary-500/20 text-white hover:text-primary-400 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 group/btn text-xs"
                  >
                    <Play className="w-3 h-3 group-hover/btn:fill-current" />
                    Reproduzir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Grid Layout (cards menores) */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-6">
        {bibleData.map((bible) => (
          <div
            key={bible.id}
            className="group bg-background-secondary rounded-lg overflow-hidden hover:bg-background-tertiary transition-all duration-300"
          >
            {/* Cover Image */}
            <div className="aspect-[4/3] relative overflow-hidden">
              <img 
                src={bible.thumbnail_url}
                alt={bible.book_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              {/* Play Button */}
              <button
                onClick={() => handlePlayBible(bible)}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-500 hover:bg-primary-600 text-black p-4 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                aria-label={`Reproduzir ${bible.book_name}`}
              >
                <Play className="w-6 h-6 fill-current" />
              </button>

              {/* Duration Badge */}
              <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(bible.duration || 0)}
              </div>
            </div>

            {/* Content */}
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Book className="w-4 h-4 text-primary-400" />
                <span className="text-primary-400 text-xs font-medium">
                  {bible.book_name}
                </span>
              </div>
              
              <h3 className="text-base font-semibold text-white mb-1.5 line-clamp-1">
                {bible.title}
              </h3>
              
              <p className="text-gray-400 text-xs line-clamp-2 mb-3">
                {bible.description}
              </p>

              <button
                onClick={() => handlePlayBible(bible)}
                className="w-full bg-background-tertiary hover:bg-primary-500/20 text-white hover:text-primary-400 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 group/btn text-sm"
              >
                <Play className="w-3.5 h-3.5 group-hover/btn:fill-current" />
                Reproduzir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: Ver todos button */}
      <div className="md:hidden mt-6 text-center">
        <Link to="/biblia-narrada" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
          Ver todos os capítulos
        </Link>
      </div>

      {/* Mobile Player */}
      {selectedBible && (
        <BibleMobilePlayer
          id={selectedBible.id}
          title={selectedBible.title}
          bookName={selectedBible.book_name}
          description={selectedBible.description}
          content={selectedBible.content}
          audioUrl={getYouTubeAudioUrl(selectedBible.youtube_video_id)}
          thumbnail={selectedBible.thumbnail_url}
          onClose={() => setSelectedBible(null)}
        />
      )}
    </section>
  );
};

export default BibleSection;
