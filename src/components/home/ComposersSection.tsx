import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { useTouchScroll } from '@/hooks/useTouchScroll';

interface Compositor {
  id: number;
  name: string;
  description: string;
  image: string;
  totalHinos: number;
  popularHino: string;
}

const compositores: Compositor[] = [
  {
    id: 1,
    name: "Hymário CCB",
    description: "Coletânea tradicional dos hinos da Congregação Cristã no Brasil",
    image: "https://picsum.photos/seed/comp1/400/300",
    totalHinos: 480,
    popularHino: "Hino 1 - Graça Maravilhosa"
  },
  {
    id: 2,
    name: "Irmão José Silva",
    description: "Compositor dedicado com mais de 50 hinos inspiradores",
    image: "https://picsum.photos/seed/comp2/400/300",
    totalHinos: 52,
    popularHino: "Hino 125 - Paz do Senhor"
  },
  {
    id: 3,
    name: "Irmã Maria Santos",
    description: "Compositora conhecida pelos hinos de louvor e adoração",
    image: "https://picsum.photos/seed/comp3/400/300",
    totalHinos: 38,
    popularHino: "Hino 200 - Glória ao Senhor"
  },
  {
    id: 4,
    name: "Irmão Paulo Oliveira",
    description: "Especialista em hinos instrumentais e de meditação",
    image: "https://picsum.photos/seed/comp4/400/300",
    totalHinos: 45,
    popularHino: "Hino 300 - Momento de Oração"
  }
];

const ComposersSection: React.FC = () => {
  const [currentCompositorIndex, setCurrentCompositorIndex] = useState(0);
  const { play } = usePlayerStore();
  const touchScrollRef = useTouchScroll<HTMLDivElement>();

  // Auto-rotate compositores
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCompositorIndex((prev) => (prev + 1) % compositores.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [compositores.length]);

  const nextCompositor = () => {
    setCurrentCompositorIndex((prev) => (prev + 1) % compositores.length);
  };

  const prevCompositor = () => {
    setCurrentCompositorIndex((prev) => (prev - 1 + compositores.length) % compositores.length);
  };

  const handlePlayComposer = (compositor: Compositor) => {
    const mockTrack = {
      id: compositor.id.toString(),
      number: 1,
      title: compositor.popularHino,
      artist: compositor.name,
      category: 'Cantados',
      duration: '4:12',
      plays: 850000,
      isLiked: false,
      coverUrl: compositor.image,
      audioUrl: '/audio/hino-composer.mp3',
      createdAt: new Date().toISOString()
    };
    play(mockTrack);
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          Compositores em Destaque
        </h2>
        <div className="hidden md:flex gap-2">
          <button
            onClick={prevCompositor}
            className="p-2 rounded-full bg-background-secondary hover:bg-background-tertiary text-white transition-colors"
            aria-label="Compositor anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextCompositor}
            className="p-2 rounded-full bg-background-secondary hover:bg-background-tertiary text-white transition-colors"
            aria-label="Próximo compositor"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile: Single Card with Auto-rotate */}
      <div className="md:hidden">
        <div className="relative bg-background-secondary rounded-lg overflow-hidden">
          <div className="aspect-[16/9] relative">
            <img 
              src={compositores[currentCompositorIndex].image}
              alt={compositores[currentCompositorIndex].name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="text-xl font-bold text-white mb-2">
              {compositores[currentCompositorIndex].name}
            </h3>
            <p className="text-gray-300 text-sm mb-3 line-clamp-2">
              {compositores[currentCompositorIndex].description}
            </p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">
                <span>{compositores[currentCompositorIndex].totalHinos} hinos</span>
                <span className="mx-2">•</span>
                <span>{compositores[currentCompositorIndex].popularHino}</span>
              </div>
              <button
                onClick={() => handlePlayComposer(compositores[currentCompositorIndex])}
                className="bg-primary-500 hover:bg-primary-600 text-black p-2 rounded-full transition-colors"
                aria-label="Reproduzir hino popular"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="absolute top-4 right-4 flex space-x-1">
            {compositores.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentCompositorIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: Horizontal Scroll */}
      <div className="hidden md:block">
        <div 
          ref={touchScrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
        >
          {compositores.map((compositor) => (
            <div
              key={compositor.id}
              className="group bg-background-secondary rounded-lg overflow-hidden hover:bg-background-tertiary transition-all duration-300 hover:scale-105 flex-shrink-0 w-64"
            >
              <div className="p-4">
                <div className="aspect-square relative overflow-hidden rounded-full mb-4">
              <img 
                src={compositor.image}
                alt={compositor.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              {/* Play Button Overlay */}
              <button
                onClick={() => handlePlayComposer(compositor)}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-500 hover:bg-primary-600 text-black p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                aria-label={`Reproduzir ${compositor.popularHino}`}
              >
                <Play className="w-5 h-5 fill-current" />
              </button>
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {compositor.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Artista
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComposersSection;
