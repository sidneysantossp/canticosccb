import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { buildAlbumUrl } from '@/utils/slugUrl';
import { DEFAULT_COVER_URL } from '@/lib/config';

interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
}

interface AlbumsSectionProps {
  albums: Album[];
}

const AlbumsSection: React.FC<AlbumsSectionProps> = ({ albums }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Sem placeholders: ocultar seção quando não houver álbuns reais
  if (!albums || albums.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = direction === 'left' ? -400 : 400;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handlePlayAlbum = (e: React.MouseEvent, albumId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const album = albums.find(a => a.id === albumId);
    navigate(buildAlbumUrl(albumId, album?.title, album?.artist));
  };

  return (
    <section className="px-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            Álbuns<br />Recomendados
          </h2>
        </div>
        <Link
          to="/albuns"
          className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          Ver todos
        </Link>
      </div>

      <div className="relative group">
        {/* Scroll Buttons */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 -ml-5"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 -mr-5"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Albums Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {albums.map((album) => (
            <Link
              key={album.id}
              to={buildAlbumUrl(album.id, album.title, album.artist)}
              onClick={() => console.log('🎵 Navegando para álbum:', album.id, album.title)}
              className="flex-shrink-0 w-48 group/card bg-background-secondary hover:bg-background-tertiary rounded-lg p-4 transition-all duration-300 hover:scale-105"
            >
              {/* Cover com Play Button */}
              <div className="relative mb-4 aspect-square">
                <img
                  src={album.coverUrl || DEFAULT_COVER_URL}
                  alt={album.title}
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = DEFAULT_COVER_URL;
                  }}
                />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    onClick={(e) => handlePlayAlbum(e, album.id)}
                    className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                  >
                    <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div>
                <h3 className="font-semibold text-white mb-1 truncate group-hover/card:text-primary-400 transition-colors">
                  {album.title}
                </h3>
                <p className="text-sm text-gray-400 truncate">{album.artist}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AlbumsSection;
