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

const HomePage: React.FC = () => {
  const { play, currentTrack, isPlaying } = usePlayerStore();
  const { openFullScreen } = usePlayerContext();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
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
      subtitle: 'Congregação Cristã no Brasil',
      cover: 'https://picsum.photos/seed/album2/200/200'
    },
    {
      id: 3,
      title: 'Hinos de Louvor',
      subtitle: 'Congregação Cristã no Brasil',
      cover: 'https://picsum.photos/seed/album3/200/200'
    },
    {
      id: 4,
      title: 'Hinos de Batismo',
      subtitle: 'Congregação Cristã no Brasil',
      cover: 'https://picsum.photos/seed/album4/200/200'
    },
    {
      id: 5,
      title: 'Hinos de Culto',
      subtitle: 'Congregação Cristã no Brasil',
      cover: 'https://picsum.photos/seed/album5/200/200'
    },
    {
      id: 6,
      title: 'Hinos de Adoração',
      subtitle: 'Congregação Cristã no Brasil',
      cover: 'https://picsum.photos/seed/album6/200/200'
    }
  ];

  const slides = [
    {
      id: 1,
      tag: 'FEITO PARA VOCÊ',
      title: 'Louvores do Dia',
      subtitle: 'Seleção de hinos para edificar sua fé',
      image: 'https://picsum.photos/seed/music-guitar/1200/400',
      // Verde
      gradient: 'linear-gradient(135deg, rgba(34,197,94,0.35), rgba(0,0,0,0.6))',
      buttonText: 'Save'
    },
    {
      id: 2,
      tag: 'HINOS CANTADOS',
      title: 'Coral e Orquestra',
      subtitle: 'Os mais tocados da Congregação',
      image: 'https://picsum.photos/seed/music-choir/1200/400',
      // Roxo
      gradient: 'linear-gradient(135deg, rgba(168,85,247,0.35), rgba(0,0,0,0.6))',
      buttonText: 'Seguir'
    },
    {
      id: 3,
      tag: 'HINOS TOCADOS',
      title: 'Instrumentais',
      subtitle: 'Trilhas para momentos de oração',
      image: 'https://picsum.photos/seed/music-notes/1200/400',
      // Amarelo
      gradient: 'linear-gradient(135deg, rgba(234,179,8,0.35), rgba(0,0,0,0.6))',
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

  // Desktop carousel navigation
  const scrollNext = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 200;
      
      container.scrollBy({ 
        left: scrollAmount, 
        behavior: 'smooth' 
      });
      
      // Infinite scroll - reset to beginning when reaching end
      setTimeout(() => {
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (container.scrollLeft >= maxScroll - 10) {
          container.scrollTo({ left: 0, behavior: 'auto' });
        }
      }, 300);
    }
  };

  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 200;
      
      // Infinite scroll - jump to end when at beginning
      if (container.scrollLeft <= 10) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        container.scrollTo({ left: maxScroll, behavior: 'auto' });
        setTimeout(() => {
          container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }, 50);
      } else {
        container.scrollBy({ 
          left: -scrollAmount, 
          behavior: 'smooth' 
        });
      }
    }
  };

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate albums (mobile only) - DISABLED
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCurrentAlbumIndex((prev) => (prev + 1) % albums.length);
  //   }, 3000);
  //   return () => clearInterval(interval);
  // }, [albums.length]);

  // Auto-rotate compositores (mobile only)
  const [currentCompositorIndex, setCurrentCompositorIndex] = useState(0);
  const compositores = [
    {
      id: 1,
      name: 'João Dias de Araújo',
      role: 'Compositor Principal',
      hinos: '145 hinos',
      image: 'https://picsum.photos/seed/compositor1/200/200'
    },
    {
      id: 2,
      name: 'Hymario Evangelico',
      role: 'Coletânea Tradicional',
      hinos: '89 hinos',
      image: 'https://picsum.photos/seed/compositor2/200/200'
    },
    {
      id: 3,
      name: 'Hinário Cristão',
      role: 'Compositor Clássico',
      hinos: '67 hinos',
      image: 'https://picsum.photos/seed/compositor3/200/200'
    },
    {
      id: 4,
      name: 'Cantor Cristão',
      role: 'Tradição Evangélica',
      hinos: '123 hinos',
      image: 'https://picsum.photos/seed/compositor4/200/200'
    },
    {
      id: 5,
      name: 'Salmos e Hinos',
      role: 'Coletânea Histórica',
      hinos: '98 hinos',
      image: 'https://picsum.photos/seed/compositor5/200/200'
    },
    {
      id: 6,
      name: 'Hinário Adventista',
      role: 'Compositor Moderno',
      hinos: '76 hinos',
      image: 'https://picsum.photos/seed/compositor6/200/200'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCompositorIndex((prev) => (prev + 1) % compositores.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [compositores.length]);


  return (
    <div className="space-y-8">
      {/* Hero Carousel Container */}
      <div
        className="bg-background-secondary overflow-hidden shadow-xl rounded-none lg:rounded-b-lg w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] lg:static lg:w-auto lg:ml-0 lg:mr-0"
        style={{ boxShadow: '0 8px 80px -12px rgba(34, 197, 94, 0.15), 0 0 0 1px rgba(34, 197, 94, 0.03)' }}
      >
        <section className="relative">
          <div className="relative h-96 overflow-hidden">
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
                  {/* Fade Overlay (suave) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
                  {/* Content */}
                  <div className="absolute left-8 bottom-8">
                    <span className="text-white/90 text-sm font-semibold uppercase tracking-wider mb-2 block">
                      {slide.tag}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
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
          <h2 className="text-2xl font-bold text-white">Mais ouvidos</h2>
          <Link 
            to="/popular" 
            className="text-text-muted hover:text-white text-sm font-semibold"
          >
            Ver mais
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

      {/* Hinos Cantados Section */}
      <div className="px-6 py-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Hinos Cantados</h2>
            <Link 
              to="/hinos-cantados" 
              className="text-text-muted hover:text-white text-sm font-semibold"
            >
              Ver mais
            </Link>
          </div>

          {/* Carrossel Horizontal - Desktop: com setas / Mobile: auto-rotate 1 card */}
          <div className="relative">
            {/* Mobile: auto-rotate com 2 cards por visualização */}
            <div className="lg:hidden overflow-hidden px-6">
              <div 
                className="flex gap-4 transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(calc(-${currentAlbumIndex * 50}% - ${currentAlbumIndex * 8}px))` }}
              >
                {albums.map((album) => (
                  <div
                    key={album.id}
                    className="bg-background-secondary p-3 rounded-lg hover:bg-background-hover transition-all cursor-pointer group/card flex-shrink-0 w-[calc(50%-8px)]"
                  >
                    <div className="relative mb-4">
                      <img
                        src={album.cover}
                        alt={album.title}
                        className="w-full aspect-square rounded-md object-cover shadow-lg"
                      />
                      <button
                        onClick={() => handlePlayTrack(popularHinos[0])}
                        className="absolute bottom-2 right-2 bg-primary-500 text-black p-3 rounded-full opacity-0 group-hover/card:opacity-100 transform translate-y-2 group-hover/card:translate-y-0 transition-all shadow-xl hover:scale-105"
                      >
                        <Play className="w-5 h-5 fill-black" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-white mb-1 truncate text-sm">
                      {album.title}
                    </h3>
                    <p className="text-text-muted text-xs line-clamp-2">
                      {album.subtitle}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: scroll horizontal com setas */}
            <div className="hidden lg:block relative group/section">
              {/* Seta Esquerda */}
              <button
                onClick={scrollPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-3 rounded-full shadow-xl opacity-0 group-hover/section:opacity-100 transition-opacity"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Seta Direita */}
              <button
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-3 rounded-full shadow-xl opacity-0 group-hover/section:opacity-100 transition-opacity"
                aria-label="Próximo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div 
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                style={{ scrollBehavior: 'smooth' }}
              >
              {/* Duplicate albums for infinite scroll effect */}
              {[...albums, ...albums].map((album, index) => (
                <div
                  key={`album-${index}`}
                  className="bg-background-secondary p-4 rounded-lg hover:bg-background-hover transition-all cursor-pointer group/card min-w-[180px] flex-shrink-0"
                >
                <div className="relative mb-4">
                  <img
                    src={album.cover}
                    alt={album.title}
                    className="w-full aspect-square rounded-md object-cover shadow-lg"
                  />
                  <button
                    onClick={() => handlePlayTrack(popularHinos[0])}
                    className="absolute bottom-2 right-2 bg-primary-500 text-black p-3 rounded-full opacity-0 group-hover/card:opacity-100 transform translate-y-2 group-hover/card:translate-y-0 transition-all shadow-xl hover:scale-105"
                  >
                    <Play className="w-5 h-5 fill-black" />
                  </button>
                </div>
                <h3 className="font-semibold text-white mb-1 truncate text-sm">
                  {album.title}
                </h3>
                <p className="text-text-muted text-xs line-clamp-2">
                  {album.subtitle}
                </p>
                </div>
              ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Hinos Tocados Section */}
      <div className="px-6 py-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Hinos Tocados</h2>
            <Link 
              to="/hinos-tocados" 
              className="text-text-muted hover:text-white text-sm font-semibold"
            >
              Ver mais
            </Link>
          </div>

          {/* Carrossel Horizontal - Desktop: com setas / Mobile: auto-rotate 2 cards */}
          <div className="relative">
            {/* Mobile: auto-rotate com 2 cards por visualização */}
            <div className="lg:hidden overflow-hidden px-6">
              <div 
                className="flex gap-4 transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(calc(-${currentAlbumIndex * 50}% - ${currentAlbumIndex * 8}px))` }}
              >
                {albums.map((album) => (
                  <div
                    key={`tocados-${album.id}`}
                    className="bg-background-secondary p-3 rounded-lg hover:bg-background-hover transition-all cursor-pointer group/card flex-shrink-0 w-[calc(50%-8px)]"
                  >
                    <div className="relative mb-4">
                      <img
                        src={album.cover}
                        alt={album.title}
                        className="w-full aspect-square rounded-md object-cover shadow-lg"
                      />
                      <button
                        onClick={() => handlePlayTrack(popularHinos[0])}
                        className="absolute bottom-2 right-2 bg-primary-500 text-black p-3 rounded-full opacity-0 group-hover/card:opacity-100 transform translate-y-2 group-hover/card:translate-y-0 transition-all shadow-xl hover:scale-105"
                      >
                        <Play className="w-5 h-5 fill-black" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-white mb-1 truncate text-sm">
                      {album.title}
                    </h3>
                    <p className="text-text-muted text-xs line-clamp-2">
                      {album.subtitle}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: scroll horizontal com setas */}
            <div className="hidden lg:block relative group/section">
              {/* Seta Esquerda */}
              <button
                onClick={scrollPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-3 rounded-full shadow-xl opacity-0 group-hover/section:opacity-100 transition-opacity"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Seta Direita */}
              <button
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-3 rounded-full shadow-xl opacity-0 group-hover/section:opacity-100 transition-opacity"
                aria-label="Próximo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div 
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                style={{ scrollBehavior: 'smooth' }}
              >
              {/* Duplicate albums for infinite scroll effect */}
              {[...albums, ...albums].map((album, index) => (
                <div
                  key={`tocados-desktop-${index}`}
                  className="bg-background-secondary p-4 rounded-lg hover:bg-background-hover transition-all cursor-pointer group/card min-w-[180px] flex-shrink-0"
                >
                <div className="relative mb-4">
                  <img
                    src={album.cover}
                    alt={album.title}
                    className="w-full aspect-square rounded-md object-cover shadow-lg"
                  />
                  <button
                    onClick={() => handlePlayTrack(popularHinos[0])}
                    className="absolute bottom-2 right-2 bg-primary-500 text-black p-3 rounded-full opacity-0 group-hover/card:opacity-100 transform translate-y-2 group-hover/card:translate-y-0 transition-all shadow-xl hover:scale-105"
                  >
                    <Play className="w-5 h-5 fill-black" />
                  </button>
                </div>
                <h3 className="font-semibold text-white mb-1 truncate text-sm">
                  {album.title}
                </h3>
                <p className="text-text-muted text-xs line-clamp-2">
                  {album.subtitle}
                </p>
                </div>
              ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Hinos Avulsos Section */}
      <div className="px-6 py-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Hinos Avulsos</h2>
            <Link 
              to="/hinos-avulsos" 
              className="text-text-muted hover:text-white text-sm font-semibold"
            >
              Ver mais
            </Link>
          </div>

          {/* Carrossel Horizontal - Desktop: com setas / Mobile: auto-rotate 2 cards */}
          <div className="relative">
            {/* Mobile: auto-rotate com 2 cards por visualização */}
            <div className="lg:hidden overflow-hidden px-6">
              <div 
                className="flex gap-4 transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(calc(-${currentAlbumIndex * 50}% - ${currentAlbumIndex * 8}px))` }}
              >
                {albums.map((album) => (
                  <div
                    key={`avulsos-${album.id}`}
                    className="bg-background-secondary p-3 rounded-lg hover:bg-background-hover transition-all cursor-pointer group/card flex-shrink-0 w-[calc(50%-8px)]"
                  >
                    <div className="relative mb-4">
                      <img
                        src={album.cover}
                        alt={album.title}
                        className="w-full aspect-square rounded-md object-cover shadow-lg"
                      />
                      <button
                        onClick={() => handlePlayTrack(popularHinos[0])}
                        className="absolute bottom-2 right-2 bg-primary-500 text-black p-3 rounded-full opacity-0 group-hover/card:opacity-100 transform translate-y-2 group-hover/card:translate-y-0 transition-all shadow-xl hover:scale-105"
                      >
                        <Play className="w-5 h-5 fill-black" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-white mb-1 truncate text-sm">
                      {album.title}
                    </h3>
                    <p className="text-text-muted text-xs line-clamp-2">
                      {album.subtitle}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: scroll horizontal com setas */}
            <div className="hidden lg:block relative group/section">
              {/* Seta Esquerda */}
              <button
                onClick={scrollPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-3 rounded-full shadow-xl opacity-0 group-hover/section:opacity-100 transition-opacity"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Seta Direita */}
              <button
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-3 rounded-full shadow-xl opacity-0 group-hover/section:opacity-100 transition-opacity"
                aria-label="Próximo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div 
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                style={{ scrollBehavior: 'smooth' }}
              >
              {/* Duplicate albums for infinite scroll effect */}
              {[...albums, ...albums].map((album, index) => (
                <div
                  key={`avulsos-desktop-${index}`}
                  className="bg-background-secondary p-4 rounded-lg hover:bg-background-hover transition-all cursor-pointer group/card min-w-[180px] flex-shrink-0"
                >
                <div className="relative mb-4">
                  <img
                    src={album.cover}
                    alt={album.title}
                    className="w-full aspect-square rounded-md object-cover shadow-lg"
                  />
                  <button
                    onClick={() => handlePlayTrack(popularHinos[0])}
                    className="absolute bottom-2 right-2 bg-primary-500 text-black p-3 rounded-full opacity-0 group-hover/card:opacity-100 transform translate-y-2 group-hover/card:translate-y-0 transition-all shadow-xl hover:scale-105"
                  >
                    <Play className="w-5 h-5 fill-black" />
                  </button>
                </div>
                <h3 className="font-semibold text-white mb-1 truncate text-sm">
                  {album.title}
                </h3>
                <p className="text-text-muted text-xs line-clamp-2">
                  {album.subtitle}
                </p>
                </div>
              ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Categoria Instrumentais Section */}
      <div className="px-6 py-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Instrumentais</h2>
            <Link 
              to="/categoria-instrumentais" 
              className="text-text-muted hover:text-white text-sm font-semibold"
            >
              Ver mais
            </Link>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                id: 1,
                name: 'Louvor',
                count: '85 hinos',
                color: 'bg-gradient-to-br from-green-500 to-green-700',
                image: 'https://picsum.photos/seed/louvor/300/150'
              },
              {
                id: 2,
                name: 'Adoração',
                count: '72 hinos',
                color: 'bg-gradient-to-br from-blue-500 to-blue-700',
                image: 'https://picsum.photos/seed/adoracao/300/150'
              },
              {
                id: 3,
                name: 'Gratidão',
                count: '48 hinos',
                color: 'bg-gradient-to-br from-teal-500 to-teal-700',
                image: 'https://picsum.photos/seed/gratidao/300/150'
              },
              {
                id: 4,
                name: 'Reflexão',
                count: '63 hinos',
                color: 'bg-gradient-to-br from-purple-500 to-purple-700',
                image: 'https://picsum.photos/seed/reflexao/300/150'
              },
              {
                id: 5,
                name: 'Esperança',
                count: '91 hinos',
                color: 'bg-gradient-to-br from-orange-500 to-orange-700',
                image: 'https://picsum.photos/seed/esperanca/300/150'
              },
              {
                id: 6,
                name: 'Paz',
                count: '56 hinos',
                color: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
                image: 'https://picsum.photos/seed/paz/300/150'
              }
            ].map((category) => (
              <Link
                key={category.id}
                to={`/categoria/${category.name.toLowerCase()}`}
                className="group relative overflow-hidden rounded-xl h-32 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <div className={`absolute inset-0 ${category.color}`}>
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-white text-xl font-bold mb-2">
                      {category.name}
                    </h3>
                    <p className="text-white/90 text-sm font-medium">
                      {category.count}
                    </p>
                  </div>
                  <div className="absolute -bottom-4 right-0">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-[100px] h-[100px] rounded-lg object-cover shadow-lg opacity-80 group-hover:opacity-100 transition-all duration-300 transform -rotate-12 group-hover:-rotate-6"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Cantados Section */}
      <div className="px-6 py-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Cantados</h2>
            <Link 
              to="/cantados" 
              className="text-text-muted hover:text-white text-sm font-semibold"
            >
              Ver mais
            </Link>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                id: 1,
                name: 'Coral',
                count: '125 hinos',
                color: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
                image: 'https://picsum.photos/seed/coral/300/150'
              },
              {
                id: 2,
                name: 'Solo',
                count: '89 hinos',
                color: 'bg-gradient-to-br from-rose-500 to-rose-700',
                image: 'https://picsum.photos/seed/solo/300/150'
              },
              {
                id: 3,
                name: 'Dueto',
                count: '67 hinos',
                color: 'bg-gradient-to-br from-cyan-500 to-cyan-700',
                image: 'https://picsum.photos/seed/dueto/300/150'
              },
              {
                id: 4,
                name: 'Quarteto',
                count: '54 hinos',
                color: 'bg-gradient-to-br from-amber-500 to-amber-700',
                image: 'https://picsum.photos/seed/quarteto/300/150'
              },
              {
                id: 5,
                name: 'Infantil',
                count: '78 hinos',
                color: 'bg-gradient-to-br from-pink-500 to-pink-700',
                image: 'https://picsum.photos/seed/infantil/300/150'
              },
              {
                id: 6,
                name: 'Jovens',
                count: '92 hinos',
                color: 'bg-gradient-to-br from-violet-500 to-violet-700',
                image: 'https://picsum.photos/seed/jovens/300/150'
              }
            ].map((category) => (
              <Link
                key={category.id}
                to={`/cantados/${category.name.toLowerCase()}`}
                className="group relative overflow-hidden rounded-xl h-32 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <div className={`absolute inset-0 ${category.color}`}>
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-white text-xl font-bold mb-2">
                      {category.name}
                    </h3>
                    <p className="text-white/90 text-sm font-medium">
                      {category.count}
                    </p>
                  </div>
                  <div className="absolute -bottom-4 right-0">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-[100px] h-[100px] rounded-lg object-cover shadow-lg opacity-80 group-hover:opacity-100 transition-all duration-300 transform -rotate-12 group-hover:-rotate-6"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Compositores Section */}
      <div className="px-6 py-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Compositores</h2>
            <Link 
              to="/compositores" 
              className="text-text-muted hover:text-white text-sm font-semibold"
            >
              Ver mais
            </Link>
          </div>

          {/* Compositores Carousel */}
          <div className="relative">
            {/* Mobile: auto-rotate com 2 cards por visualização */}
            <div className="lg:hidden overflow-hidden px-6">
              <div 
                className="flex gap-4 transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(calc(-${currentCompositorIndex * 50}% - ${currentCompositorIndex * 8}px))` }}
              >
                {compositores.map((compositor) => (
                  <div
                    key={compositor.id}
                    className="bg-background-secondary p-4 rounded-lg hover:bg-background-hover transition-all cursor-pointer flex-shrink-0 w-[calc(50%-8px)]"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-4">
                        <img
                          src={compositor.image}
                          alt={compositor.name}
                          className="w-28 h-28 rounded-full object-cover shadow-lg"
                        />
                      </div>
                      <h3 className="font-semibold text-white mb-1 text-sm line-clamp-2">
                        {compositor.name}
                      </h3>
                      <p className="text-text-muted text-xs mb-1">
                        {compositor.role}
                      </p>
                      <p className="text-primary-400 text-xs font-medium">
                        {compositor.hinos}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: scroll horizontal com setas */}
            <div className="hidden lg:block relative group/section">
              {/* Seta Esquerda */}
              <button
                onClick={scrollPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-3 rounded-full shadow-xl opacity-0 group-hover/section:opacity-100 transition-opacity"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Seta Direita */}
              <button
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-3 rounded-full shadow-xl opacity-0 group-hover/section:opacity-100 transition-opacity"
                aria-label="Próximo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {[...compositores, ...compositores].map((compositor, index) => (
                  <div
                    key={`compositor-desktop-${index}`}
                    className="bg-background-secondary p-4 rounded-lg hover:bg-background-hover transition-all cursor-pointer min-w-[180px] flex-shrink-0"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-4">
                        <img
                          src={compositor.image}
                          alt={compositor.name}
                          className="w-32 h-32 rounded-full object-cover shadow-lg"
                        />
                      </div>
                      <h3 className="font-semibold text-white mb-1 text-sm line-clamp-2">
                        {compositor.name}
                      </h3>
                      <p className="text-text-muted text-xs mb-1">
                        {compositor.role}
                      </p>
                      <p className="text-primary-400 text-xs font-medium">
                        {compositor.hinos}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Banner Publicitário - Compositores */}
      <div className="px-6 py-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/40 to-green-600/50 p-8 shadow-2xl">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt="Piano e Instrumentos Musicais"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 via-green-600/40 to-green-700/50"></div>
          </div>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-4 left-4 w-32 h-32 bg-white rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white rounded-full blur-xl"></div>
          </div>

          <div className="relative z-10">
            {/* Conteúdo do Banner */}
            <div className="max-w-4xl">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                É Compositor?
              </h2>
              <p className="text-white/95 text-lg mb-2 max-w-3xl">
                Compartilhe seus hinos inspirados pelo Espírito Santo com toda a irmandade.
              </p>
              <p className="text-white/95 text-lg mb-8 max-w-3xl">
                Seus hinos podem tocar corações e edificar vidas ao redor do mundo.
              </p>
              
              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/compositor/enviar-hinos"
                  className="group bg-black text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span>Enviar Meus Hinos</span>
                </Link>
                <Link
                  to="/compositor/saiba-mais"
                  className="group bg-transparent border-2 border-black text-black font-semibold px-6 py-3 rounded-full hover:bg-black hover:text-white transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <span>Saiba Mais</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bíblia Narrada Section */}
      <div className="px-6 py-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Bíblia Narrada</h2>
            <Link 
              to="/biblia-narrada" 
              className="text-text-muted hover:text-white text-sm font-semibold"
            >
              Ver mais
            </Link>
          </div>

          {/* Grid de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 1,
                title: 'Gênesis Completo',
                subtitle: 'Livro • Narração Completa',
                image: 'https://picsum.photos/seed/genesis/200/200',
                duration: '12h 45min'
              },
              {
                id: 2,
                title: 'Salmos de Davi',
                subtitle: 'Coleção • 150 Salmos',
                image: 'https://picsum.photos/seed/salmos/200/200',
                duration: '8h 30min'
              },
              {
                id: 3,
                title: 'Novo Testamento',
                subtitle: 'Coleção • 27 Livros',
                image: 'https://picsum.photos/seed/novotestamento/200/200',
                duration: '24h 15min'
              },
              {
                id: 4,
                title: 'Provérbios de Salomão',
                subtitle: 'Livro • Sabedoria Bíblica',
                image: 'https://picsum.photos/seed/proverbios/200/200',
                duration: '3h 20min'
              }
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => handlePlayTrack({
                  id: item.id,
                  title: item.title,
                  artist: item.subtitle,
                  duration: item.duration,
                  audioUrl: `https://example.com/biblia/${item.id}.mp3`,
                  cover: item.image
                })}
                className="group bg-background-secondary hover:bg-background-hover rounded-lg p-4 transition-all duration-300 cursor-pointer flex items-center gap-4"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 rounded-lg object-cover shadow-md"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-base mb-1 truncate group-hover:text-primary-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-text-muted text-sm mb-1">
                    {item.subtitle}
                  </p>
                  <p className="text-text-muted text-xs">
                    {item.duration}
                  </p>
                </div>
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
