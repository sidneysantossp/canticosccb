import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
 
import { ASSETS, UI_CONFIG } from '@/constants';
import AnimatedButton from '@/components/ui/AnimatedButton';
import FadeIn from '@/components/ui/FadeIn';
import { useNavigate } from 'react-router-dom';
import type { HomeBanner } from '@/lib/homeApi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutoplayVideo } from '@/hooks/useAutoplayVideo';
import { buildBannerUrl } from '@/lib/media-helper';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  color: string;
  buttonText?: string;
  linkUrl?: string;
  linkType?: string;
  linkId?: string;
}

interface HeroSectionProps {
  banners?: HomeBanner[];
}

const HeroSection: React.FC<HeroSectionProps> = ({ banners = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  
  const navigate = useNavigate();
  
  // Helper: detectar URL de vídeo (inclui stream.php com query file=*.mp4)
  const isVideoUrl = (url: string) => {
    const u = (url || '').toLowerCase();
    if (!u) return false;
    if (/\.(mp4|webm|mov)(\?|#|$)/i.test(u)) return true;
    if (u.includes('/api/stream.php') && /file=.*\.(mp4|webm|mov)(\?|#|$)/i.test(u)) return true;
    return false;
  };

  console.log('🎪 HeroSection - Banners received:', banners);
  console.log('🎪 HeroSection - Banners length:', banners?.length || 0);
  console.log('🎪 HeroSection - Banners array:', JSON.stringify(banners, null, 2));

  // Converter banners do backend em slides (sem fallback mock)
  const displaySlides: Slide[] = (banners || [])
    .filter((b) => typeof (b as any)?.image_url === 'string' && ((b as any)?.image_url || '').trim() !== '')
    .map((banner, index) => {
    console.log(`🎯 Banner ${index + 1}:`, banner);
    console.log(`🎨 Gradient overlay:`, banner.gradient_overlay);
    console.log(`🖼️ Image URL:`, banner.image_url);
    const gradientColor = (typeof banner.gradient_overlay === 'string' && banner.gradient_overlay.trim() !== '')
      ? banner.gradient_overlay
      : 'bg-gradient-to-br from-blue-500/80 to-purple-600/80';
    const normalized = buildBannerUrl(banner);
    return {
      id: index + 1,
      title: banner.title,
      subtitle: banner.description || '',
      image: normalized,
      color: gradientColor,
      buttonText: banner.button_text || 'Reproduzir',
      linkUrl: banner.link_url,
      linkType: banner.link_type,
      linkId: banner.link_id
    };
  });

  const hasSlides = displaySlides.length > 0;
  const safeIndex = hasSlides ? Math.min(Math.max(0, currentSlide), Math.max(0, displaySlides.length - 1)) : 0;
  const slide = hasSlides ? displaySlides[safeIndex] : undefined;

  // Hook para autoplay de vídeo (reativa quando o src do slide muda)
  const videoRef = useAutoplayVideo(true, slide?.image);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % displaySlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + displaySlides.length) % displaySlides.length);
  };

  // Garante que o índice atual sempre seja válido quando a lista mudar
  useEffect(() => {
    if (!displaySlides.length) return;
    if (currentSlide >= displaySlides.length) setCurrentSlide(0);
  }, [displaySlides.length]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0].screenX;
    touchEndX.current = null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = event.changedTouches[0].screenX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const distance = touchStartX.current - touchEndX.current;
      const swipeThreshold = 50; // pixels

      if (distance > swipeThreshold) {
        nextSlide();
      } else if (distance < -swipeThreshold) {
        prevSlide();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Auto-play dos slides
  useEffect(() => {
    if (displaySlides.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 8000); // Troca a cada 8 segundos (mais lento)

    return () => clearInterval(interval);
  }, [displaySlides.length]);

  const handleBannerAction = () => {
    if (!slide) return;
    const currentBanner = displaySlides[currentSlide];
    // Se tiver link configurado, navegar
    if (currentBanner.linkUrl) {
      if (currentBanner.linkType === 'external') {
        window.open(currentBanner.linkUrl, '_blank');
      } else {
        navigate(currentBanner.linkUrl);
      }
      return;
    }

    // Se tiver linkType específico, navegar para a rota correta
    if (currentBanner.linkType && currentBanner.linkId) {
      switch (currentBanner.linkType) {
        case 'hymn':
          navigate(`/hino/${currentBanner.linkId}`);
          break;
        case 'composer':
          navigate(`/compositor/${currentBanner.linkId}`);
          break;
        case 'album':
          navigate(`/album/${currentBanner.linkId}`);
          break;
        case 'playlist':
          navigate(`/playlist/${currentBanner.linkId}`);
          break;
        default:
          return;
      }
      return;
    }

    return;
  };


  if (!slide) return null;

  return (
    <div
      className="relative h-[360px] md:h-[350px] rounded-lg overflow-hidden mb-8 mt-0 md:mx-6 md:mt-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Image with Overlay */}
      <AnimatePresence>
        <motion.div
          key={`image-${slide.id ?? safeIndex}`}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          {isVideoUrl(slide.image) ? (
            <video
              ref={videoRef}
              key={`video-${slide.id ?? safeIndex}`}
              src={slide.image}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster=""
              onLoadedMetadata={(e) => { try { (e.currentTarget as HTMLVideoElement).play().catch(() => {}); } catch {} }}
              onCanPlay={(e) => { try { (e.currentTarget as HTMLVideoElement).play().catch(() => {}); } catch {} }}
              controls={false}
            />
          ) : (
            <img 
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
          <div 
            className={`absolute inset-0 ${String(slide.color)}`}
            style={{
              // Fallback CSS inline caso Tailwind não reconheça as classes dinâmicas
              background: (() => {
                try {
                  const c = String(slide.color);
                  if (!c.includes('from-[')) return undefined;
                  return c.replace(/bg-gradient-to-br from-\[([^\]]+)\]\/(\d+) to-\[([^\]]+)\]\/(\d+)/, (match, color1, opacity1, color2, opacity2) => {
                    const alpha1 = parseInt(opacity1) / 100;
                    const alpha2 = parseInt(opacity2) / 100;
                    return `linear-gradient(to bottom right, ${color1}${Math.round(alpha1 * 255).toString(16).padStart(2, '0')}, ${color2}${Math.round(alpha2 * 255).toString(16).padStart(2, '0')})`;
                  });
                } catch {
                  return undefined;
                }
              })()
            }}
          ></div>
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence>
        <motion.div
          key={`content-${slide.id ?? safeIndex}`}
          className="relative z-10 flex items-center h-full px-6 md:px-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, delay: 0.3, ease: 'easeInOut' }}
        >
          <div className="max-w-2xl">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {slide.title}
            </motion.h1>
            <motion.p 
              className="text-lg md:text-xl text-gray-200 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {slide.subtitle}
            </motion.p>
            <motion.button 
              onClick={handleBannerAction}
              className="bg-primary-500 hover:bg-primary-600 text-black font-semibold px-8 py-3 rounded-full flex items-center gap-2 transition-all hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Play className="w-5 h-5 fill-current" />
              {slide.buttonText || 'Reproduzir'}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows - Hidden on mobile */}
      <button 
        onClick={prevSlide}
        className="hidden md:block absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors z-20"
        aria-label="Slide anterior"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button 
        onClick={nextSlide}
        className="hidden md:block absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors z-20"
        aria-label="Próximo slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 right-4 flex space-x-2 z-20">
        {displaySlides.map((_, index) => (
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
