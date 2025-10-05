import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { ASSETS, UI_CONFIG } from '@/constants';
import AnimatedButton from '@/components/ui/AnimatedButton';
import FadeIn from '@/components/ui/FadeIn';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  color: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Hinos Cantados",
    subtitle: "Ouça os hinos mais tocados da CCB",
    image: "https://picsum.photos/seed/hero1/800/400",
    color: "from-blue-900 to-purple-900"
  },
  {
    id: 2,
    title: "Hinos Tocados",
    subtitle: "Instrumentais para momentos de reflexão",
    image: "https://picsum.photos/seed/hero2/800/400",
    color: "from-green-900 to-blue-900"
  },
  {
    id: 3,
    title: "Bíblia Narrada",
    subtitle: "Escute a palavra de Deus narrada",
    image: "https://picsum.photos/seed/hero3/800/400",
    color: "from-purple-900 to-pink-900"
  }
];

const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { play } = usePlayerStore();

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(nextSlide, UI_CONFIG.CAROUSEL_AUTO_ROTATE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handlePlayHero = () => {
    const mockTrack = {
      id: '1',
      number: 1,
      title: slides[currentSlide].title,
      artist: 'Coral CCB',
      category: 'Cantados',
      duration: '3:45',
      plays: 1250000,
      isLiked: false,
      coverUrl: slides[currentSlide].image,
      audioUrl: '/audio/hino-1.mp3',
      createdAt: new Date().toISOString()
    };
    play(mockTrack);
  };

  return (
    <div className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden mb-8">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={slides[currentSlide].image}
          alt={slides[currentSlide].title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${slides[currentSlide].color} opacity-80`}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center h-full px-6 md:px-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            {slides[currentSlide].title}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            {slides[currentSlide].subtitle}
          </p>
          <button 
            onClick={handlePlayHero}
            className="bg-primary-500 hover:bg-primary-600 text-black font-semibold px-8 py-3 rounded-full flex items-center gap-2 transition-all hover:scale-105"
          >
            <Play className="w-5 h-5 fill-current" />
            Reproduzir
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors z-20"
        aria-label="Slide anterior"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors z-20"
        aria-label="Próximo slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white' : 'bg-white/50'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSection;
