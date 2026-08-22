import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { HomeBanner } from '@/lib/homeApi';
import { buildBannerUrl } from '@/lib/media-helper';
import { parseBannerOverlay } from '@/lib/bannerOverlay';

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
  className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ banners = [], className }) => {
  const spacingClassName = className ?? 'md:mx-6 md:mt-2';
  const [currentSlide, setCurrentSlide] = useState(0);
  const [failedSlides, setFailedSlides] = useState<Record<number, true>>({});
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  
  const navigate = useNavigate();
  
  // Helper: detectar URL de vídeo (extensões conhecidas)
  const isVideoUrl = (url: string) => {
    const u = (url || '').toLowerCase();
    if (!u) return false;
    if (/\.(mp4|webm|mov)(\?|#|$)/i.test(u)) return true;
    return false;
  };

  // Converter banners do backend em slides (memoizado para evitar re-render)
  const displaySlides: Slide[] = useMemo(() => {
    return (banners || [])
      .filter((b) => typeof (b as any)?.image_url === 'string' && ((b as any)?.image_url || '').trim() !== '')
      .map((banner, index) => {
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
  }, [banners]);

  const slidesCount = displaySlides.length;
  const hasSlides = slidesCount > 0;
  const safeIndex = hasSlides ? Math.min(Math.max(0, currentSlide), Math.max(0, slidesCount - 1)) : 0;
  const slide = hasSlides ? displaySlides[safeIndex] : undefined;

  const nextSlide = useCallback(() => {
    if (slidesCount <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % slidesCount);
  }, [slidesCount]);

  const prevSlide = useCallback(() => {
    if (slidesCount <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + slidesCount) % slidesCount);
  }, [slidesCount]);

  const markSlideAsFailed = useCallback((slideId: number) => {
    setFailedSlides((prev) => (prev[slideId] ? prev : { ...prev, [slideId]: true }));
  }, []);

  // Garante que o índice atual sempre seja válido quando a lista mudar
  useEffect(() => {
    if (!slidesCount) return;
    if (currentSlide >= slidesCount) setCurrentSlide(0);
  }, [slidesCount, currentSlide]);

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
      const swipeThreshold = 50;

      if (distance > swipeThreshold) {
        nextSlide();
      } else if (distance < -swipeThreshold) {
        prevSlide();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Auto-play dos slides com ref para evitar re-criação do interval
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (slidesCount <= 1) return;

    // Limpar interval anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidesCount);
    }, 8000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [slidesCount]);

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


  // Fallback: banner padrão quando não há banners do backend
  if (!slide) {
    return (
      <div className={`relative h-[360px] md:h-[350px] rounded-lg overflow-hidden mb-8 mt-0 ${spacingClassName}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-900" />
        <div className="relative z-10 flex items-center h-full px-6 md:px-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Cânticos CCB
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8">
              Ouça hinos da Congregação Cristã no Brasil. Louvor e adoração em um só lugar.
            </p>
            <button
              onClick={() => navigate('/buscar')}
              className="bg-white hover:bg-gray-100 text-primary-600 font-semibold px-8 py-3 rounded-full flex items-center gap-2 transition-all hover:scale-105"
            >
              <Play className="w-5 h-5 fill-current" />
              Explorar Hinos
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Função para gerar background gradient inline
  const getGradientStyle = (color: string) => {
    try {
      const c = String(color);
      if (!c.includes('from-[')) return undefined;
      return c.replace(/bg-gradient-to-br from-\[([^\]]+)\]\/(\d+) to-\[([^\]]+)\]\/(\d+)/, (_, color1, opacity1, color2, opacity2) => {
        const alpha1 = parseInt(opacity1) / 100;
        const alpha2 = parseInt(opacity2) / 100;
        return `linear-gradient(to bottom right, ${color1}${Math.round(alpha1 * 255).toString(16).padStart(2, '0')}, ${color2}${Math.round(alpha2 * 255).toString(16).padStart(2, '0')})`;
      });
    } catch {
      return undefined;
    }
  };

  return (
    <div
      className={`relative h-[360px] md:h-[350px] rounded-lg overflow-hidden mb-8 mt-0 ${spacingClassName}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides Container - Usando CSS transitions */}
      {displaySlides.map((s, index) => {
        const isActive = index === safeIndex;
        const overlay = parseBannerOverlay(s.color);

        return (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {isActive && (
              <>
                {isVideoUrl(s.image) && !failedSlides[s.id] ? (
                  <video
                    src={s.image}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    controls={false}
                    onError={() => markSlideAsFailed(s.id)}
                  />
                ) : failedSlides[s.id] ? (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-950">
                    <img
                      src="/logo-canticos-ccb.png"
                      alt="Cânticos CCB"
                      className="w-full h-full object-contain p-8 md:p-12 opacity-90"
                    />
                  </div>
                ) : (
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                    onError={() => markSlideAsFailed(s.id)}
                  />
                )}
              </>
            )}

            {/* Gradient Overlay */}
            <div
              className={`absolute inset-0 ${overlay.gradient}`}
              style={{ background: getGradientStyle(overlay.gradient), opacity: overlay.opacity / 100 }}
            />
          </div>
        );
      })}

      {/* Content - Transição suave */}
      <div className="relative z-10 flex items-center h-full px-6 md:px-12">
        <div className="max-w-2xl">
          <h1 
            className="text-4xl md:text-6xl font-bold text-white mb-4 transition-all duration-500"
            key={`title-${safeIndex}`}
          >
            {slide.title}
          </h1>
          <p 
            className="text-lg md:text-xl text-gray-200 mb-8 transition-all duration-500"
            key={`subtitle-${safeIndex}`}
          >
            {slide.subtitle}
          </p>
          <button 
            onClick={handleBannerAction}
            className="bg-primary-500 hover:bg-primary-600 text-black font-semibold px-8 py-3 rounded-full flex items-center gap-2 transition-all hover:scale-105"
          >
            <Play className="w-5 h-5 fill-current" />
            {slide.buttonText || 'Reproduzir'}
          </button>
        </div>
      </div>

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
              index === safeIndex ? 'bg-white' : 'bg-white/50'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSection;
