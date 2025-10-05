import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Plus, Download, ChevronLeft, ChevronRight, Heart, MoreHorizontal } from 'lucide-react';
import Footer from '../components/Footer';
import HeroSection from '@/components/home/HeroSection';
import CategoryGrid from '@/components/home/CategoryGrid';
import ComposersSection from '@/components/home/ComposersSection';
import BannerCTA from '@/components/home/BannerCTA';
import BibleSection from '@/components/home/BibleSection';
import { getPopularHinos } from '@/data/mockData';
import { usePlayerStore } from '@/stores/playerStore';
import { usePlayerContext } from '@/contexts/PlayerContext';
import { useTouchScroll } from '@/hooks/useTouchScroll';

const HomePage: React.FC = () => {
  const { play, currentTrack, isPlaying } = usePlayerStore();
  const { openFullScreen } = usePlayerContext();
  const scrollContainerRef = useTouchScroll<HTMLDivElement>();
  
  const popularHinos = getPopularHinos(6);

  const albums = [
    {
      id: 1,
      title: 'Hinário 5 - Completo',
      subtitle: '2024 • Congregação Cristã no Brasil',
      cover: 'https://picsum.photos/seed/album1/200/200'
    },
    {
      id: 2,
      title: 'Hinos de Santa Ceia',
      cover: 'https://picsum.photos/seed/album2/200/200'
    },
    {
      id: 3,
      title: 'Hinos Instrumentais',
      subtitle: 'Orquestra CCB',
      cover: 'https://picsum.photos/seed/album3/200/200'
    },
      id: 4,
      title: 'Hinário Jovens',
      subtitle: 'Congregação Cristã no Brasil',
      cover: 'https://picsum.photos/seed/album4/200/200'
    }
  );
};

export default HomePage;

  const handleTogglePlay = (hino: any) => {
    if (currentTrack?.id === hino.id && isPlaying) {
      // Pause current track
      // This would be handled by the player store
      pause();
    } else {
      play(hino);
{{ ... }}
      // Small delay to allow state to update before opening full screen
      setTimeout(() => {
        if (window.innerWidth < 768) { // Only on mobile
          openFullScreen();
        }
      }, 300);
    }
  };

  const handlePlayTrack = (track: any) => {
    play(track);
    // Small delay to allow state to update before opening full screen
    setTimeout(() => {
      if (window.innerWidth < 768) { // Only on mobile
        openFullScreen();
      }
    }, 300);
  };

  // Scroll functions for albums carousel
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <HeroSection />

      {/* Popular Hinos Section */}
      <section className="px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Hinos Populares
          </h2>
          <Link to="/hinos-cantados" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Ver todos
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularHinos.slice(0, 6).map((hino, index) => (
            <div
              key={hino.id}
              className="group flex items-center gap-4 bg-background-secondary hover:bg-background-tertiary p-4 rounded-lg transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Ranking Number */}
              <div className="flex-shrink-0 w-8 text-center">
                <span className="text-lg font-bold text-gray-400 group-hover:text-primary-400 transition-colors">
                  {index + 1}
                </span>
              </div>

              {/* Cover Image */}
              <div className="relative flex-shrink-0">
                <img 
                  src={hino.coverUrl}
                  alt={hino.title}
                  className="w-12 h-12 rounded object-cover"
                  loading="lazy"
                />
                <button
                  onClick={() => handleTogglePlay(hino)}
                  className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Reproduzir ${hino.title}`}
                >
                  {currentTrack?.id === hino.id && isPlaying ? (
                    <Pause className="w-4 h-4 text-white fill-current" />
                  ) : (
                    <Play className="w-4 h-4 text-white fill-current" />
                  )}
                </button>
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
                  {hino.title}
                </h3>
                <p className="text-sm text-gray-400 truncate">
                  {hino.artist} • {hino.category}
                </p>
              </div>

              {/* Duration */}
              <div className="flex-shrink-0 text-sm text-gray-400">
                {hino.duration}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-2 hover:bg-background-primary rounded-full transition-colors"
                  aria-label="Mais opções"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Grid */}
      <div className="px-6">
        <CategoryGrid />
      </div>

      {/* Albums Section */}
      <section className="px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Álbuns Recomendados
          </h2>
          <div className="flex gap-2">
            <button
              onClick={scrollLeft}
              className="p-2 rounded-full bg-background-secondary hover:bg-background-tertiary text-white transition-colors"
              aria-label="Álbum anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollRight}
              className="p-2 rounded-full bg-background-secondary hover:bg-background-tertiary text-white transition-colors"
              aria-label="Próximo álbum"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {[...albums, ...albums].map((album, index) => (
            <div
              key={`${album.id}-${index}`}
              className="group flex-shrink-0 w-48 bg-background-secondary hover:bg-background-tertiary p-4 rounded-lg transition-all duration-300 hover:scale-105"
            >
              <div className="relative mb-4">
                <img 
                  src={album.cover}
                  alt={album.title}
                  className="w-full aspect-square object-cover rounded-lg shadow-lg"
                  loading="lazy"
                />
                <button
                  onClick={() => handlePlayTrack(popularHinos[0])}
                  className="absolute bottom-2 right-2 bg-primary-500 hover:bg-primary-600 text-black p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg"
                  aria-label={`Reproduzir ${album.title}`}
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              </div>
              
              <h3 className="font-bold text-white mb-1 line-clamp-2">
                {album.title}
              </h3>
              <p className="text-sm text-gray-400 line-clamp-1">
                {album.subtitle}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Composers Section */}
      <div className="px-6">
        <ComposersSection />
      </div>

      {/* Banner CTA */}
      <div className="px-6">
        <BannerCTA />
      </div>

      {/* Bible Section */}
      <div className="px-6">
        <BibleSection />
      </div>

      <Footer />
    </div>
  );
