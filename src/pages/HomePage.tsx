import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MoreHorizontal, Play, Pause, Plus, Download } from 'lucide-react';
import { getPopularHinos } from '@/data/mockData';
import { usePlayerStore } from '@/stores/playerStore';
import { usePlayerContext } from '@/contexts/PlayerContext';

const HomePage: React.FC = () => {
  const { play, currentTrack, isPlaying } = usePlayerStore();
  const { openFullScreen } = usePlayerContext();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const popularHinos = getPopularHinos(6);

  const slides = [
    {
      id: 1,
      tag: 'MADE FOR YOU',
      title: 'Daily Mix 1',
      subtitle: 'Your blend of indie pop and chill beats',
      image: 'https://picsum.photos/seed/nature1/1200/400',
      gradient: 'linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6))',
      buttonText: 'Save'
    },
    {
      id: 2,
      tag: 'HINOS CANTADOS',
      title: 'Coral CCB',
      subtitle: 'Os mais tocados da congregação',
      image: 'https://picsum.photos/seed/nature2/1200/400',
      gradient: 'linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6))',
      buttonText: 'Seguir'
    },
    {
      id: 3,
      tag: 'HINOS TOCADOS',
      title: 'Instrumentais',
      subtitle: 'Para momentos de reflexão',
      image: 'https://picsum.photos/seed/nature3/1200/400',
      gradient: 'linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6))',
      buttonText: 'Curtir'
    }
  ];

  const handlePlayTrack = (hino: any) => {
    play(hino);
    // Abre fullscreen automaticamente no mobile
    openFullScreen();
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Carousel Container */}
      <div className="bg-background-secondary overflow-hidden shadow-xl rounded-b-lg" style={{ boxShadow: '0 8px 80px -12px rgba(34, 197, 94, 0.15), 0 0 0 1px rgba(34, 197, 94, 0.03)' }}>
        <section className="relative">
          <div className="relative h-80 overflow-hidden">
            {/* Slides Container */}
            <div 
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className="w-full h-full flex-shrink-0 relative"
                  style={{
                    backgroundImage: `${slide.gradient}, url(${slide.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Content */}
                  <div className="absolute left-8 bottom-8">
                    <span className="text-white/90 text-sm font-semibold uppercase tracking-wider mb-2 block">
                      {slide.tag}
                    </span>
                    <h1 className="text-5xl font-black text-white mb-2">
                      {slide.title}
                    </h1>
                    <p className="text-white/80 text-lg mb-6">
                      {slide.subtitle}
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handlePlayTrack(popularHinos[0])}
                        className="bg-primary-500 text-black px-8 py-3 rounded-full font-semibold hover:bg-primary-400 hover:scale-105 transition-all shadow-lg"
                      >
                        Play
                      </button>
                      
                      <button className="px-8 py-3 border border-white/30 text-white rounded-full font-semibold hover:border-white/50 hover:bg-white/10 transition-colors">
                        {slide.buttonText}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 right-8 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Popular Section Container */}
      <div className="px-0 py-8">
        <section>
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-2xl font-bold text-white">Popular</h2>
          <Link 
            to="/popular" 
            className="text-text-muted hover:text-white text-sm font-semibold"
          >
            See All
          </Link>
        </div>

        {/* Header row with column labels - Desktop only */}
        <div className="hidden md:flex items-center gap-4 px-6 py-2 text-text-muted text-xs uppercase tracking-wider border-b border-white/5">
          <div className="w-6"></div>
          <div className="w-12"></div>
          <div className="flex-1">Título</div>
          <div className="text-center normal-case">Tocado</div>
          <div className="w-20 text-center">Duração</div>
        </div>


        <div className="space-y-1 px-0">
          {popularHinos.slice(0, 5).map((hino, index) => {
            const isCurrentTrack = currentTrack?.id === hino.id;
            const showPlayIcon = isCurrentTrack && isPlaying;
            
            return (
              <div 
                key={hino.id} 
                className="flex items-center gap-4 px-6 py-3 md:p-2 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer border-b border-white/5 last:border-b-0"
                onClick={() => handlePlayTrack(hino)}
              >
                {/* Track Number - Desktop only */}
                <div className="hidden md:block w-6 text-center relative">
                  {showPlayIcon ? (
                    <Pause className="w-4 h-4 text-primary-500 mx-auto" />
                  ) : (
                    <>
                      <span className="text-text-muted font-medium text-lg group-hover:opacity-0 transition-opacity">
                        {index + 1}
                      </span>
                      <Play className="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  )}
                </div>
                
                {/* Album Cover */}
                <div className="relative">
                  <img
                    src={hino.coverUrl}
                    alt={hino.title}
                    className="w-16 h-16 md:w-12 md:h-12 rounded object-cover"
                  />
                  {/* Track Number - Mobile only (top right) */}
                  <div className="md:hidden absolute -top-1 -right-1 bg-background-primary text-text-muted text-xs font-medium w-5 h-5 rounded-full flex items-center justify-center border border-gray-600">
                    {index + 1}
                  </div>
                </div>
                
                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  {/* Mobile Layout - Title, Artist and Actions stacked */}
                  <div className="md:hidden">
                    <h4 className={`font-medium text-sm leading-tight ${isCurrentTrack ? 'text-primary-500' : 'text-white'}`}>
                      {hino.title}
                    </h4>
                    <p className="text-text-muted text-sm truncate">
                      <span className="text-xs tracking-wider mr-2">Tocado</span>
                      {hino.plays.toLocaleString()}
                    </p>
                    {/* Actions row - Mobile */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-3">
                        <span className="text-text-muted text-xs">
                          {hino.duration}
                        </span>
                        <button className="p-1">
                          <Heart className="w-4 h-4 text-text-muted hover:text-white" />
                        </button>
                        <button className="p-1">
                          <Plus className="w-4 h-4 text-text-muted hover:text-white" />
                        </button>
                        <button className="p-1">
                          <Download className="w-4 h-4 text-text-muted hover:text-white" />
                        </button>
                        <button className="p-1">
                          <MoreHorizontal className="w-4 h-4 text-text-muted hover:text-white" />
                        </button>
                      </div>
                      
                      {/* Play button on the right */}
                      <button className="p-1">
                        {showPlayIcon ? (
                          <Pause className="w-5 h-5 text-primary-500" />
                        ) : (
                          <Play className="w-5 h-5 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Desktop Layout - Title only */}
                  <div className="hidden md:block">
                    <h4 className={`font-medium truncate ${isCurrentTrack ? 'text-primary-500' : 'text-white'}`}>
                      {hino.title}
                    </h4>
                  </div>
                </div>
                
                {/* Play Count - Desktop only */}
                <span className="hidden md:block text-text-muted text-sm">
                  {hino.plays.toLocaleString()}
                </span>
                
                {/* Duration and Actions - Desktop only */}
                <div className="hidden md:flex items-center gap-2">
                  <button>
                    <Heart className="w-4 h-4 text-text-muted hover:text-white" />
                  </button>
                  <button>
                    <Plus className="w-4 h-4 text-text-muted hover:text-white" />
                  </button>
                  <button>
                    <Download className="w-4 h-4 text-text-muted hover:text-white" />
                  </button>
                  <span className="text-text-muted text-sm w-12 text-right">
                    {hino.duration}
                  </span>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4 text-text-muted hover:text-white" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
