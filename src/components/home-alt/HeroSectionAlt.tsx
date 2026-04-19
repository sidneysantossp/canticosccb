import React from 'react';
import { Link } from 'react-router-dom';
import { Play, ChevronRight } from 'lucide-react';
import { buildBannerUrl } from '@/lib/media-helper';

interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  button_text?: string;
  link_url?: string;
  gradient_overlay?: string;
}

interface HeroSectionAltProps {
  banners: Banner[];
  isDarkMode: boolean;
}

const HeroSectionAlt: React.FC<HeroSectionAltProps> = ({ banners, isDarkMode }) => {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [failedSlides, setFailedSlides] = React.useState<Record<string, true>>({});

  const markSlideAsFailed = React.useCallback((slideId: string) => {
    setFailedSlides((prev) => (prev[slideId] ? prev : { ...prev, [slideId]: true }));
  }, []);

  const isVideoUrl = React.useCallback((url: string) => {
    const value = String(url || '').toLowerCase();
    return /\.(mp4|webm|mov)(\?|#|$)/i.test(value);
  }, []);

  React.useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners || banners.length === 0) {
    return (
      <div className={`relative h-[400px] md:h-[500px] overflow-hidden ${
        isDarkMode ? 'bg-gradient-to-br from-gray-900 to-black' : 'bg-gradient-to-br from-gray-100 to-white'
      }`}>
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center max-w-3xl">
            <h1 className={`text-4xl md:text-6xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Cânticos CCB
            </h1>
            <p className={`text-lg md:text-xl mb-8 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Louve ao Senhor com hinos e adoração
            </p>
            <Link
              to="/hinos-cantados-ccb"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                isDarkMode 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              <Play size={20} />
              Explorar Hinos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentSlide];
  const currentBannerUrl = buildBannerUrl(currentBanner);
  const currentBannerFailed = failedSlides[currentBanner.id];
  const currentBannerIsVideo = isVideoUrl(currentBannerUrl);

  return (
    <div className="relative h-[400px] md:h-[500px] overflow-hidden">
      {/* Banner Media */}
      <div className="absolute inset-0">
        {currentBannerFailed ? (
          <div className={`w-full h-full flex items-center justify-center ${
            isDarkMode ? 'bg-neutral-950' : 'bg-neutral-100'
          }`}>
            <img
              src="/logo-canticos-ccb.png"
              alt="Cânticos CCB"
              className="w-full h-full object-contain p-8 md:p-12 opacity-90"
            />
          </div>
        ) : currentBannerIsVideo ? (
          <video
            src={currentBannerUrl}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            controls={false}
            onError={() => markSlideAsFailed(currentBanner.id)}
          />
        ) : (
          <img
            src={currentBannerUrl}
            alt={currentBanner.title}
            className="w-full h-full object-cover"
            onError={() => markSlideAsFailed(currentBanner.id)}
          />
        )}
        <div className={`absolute inset-0 ${
          currentBanner.gradient_overlay || (isDarkMode 
            ? 'bg-gradient-to-t from-black via-black/50 to-transparent'
            : 'bg-gradient-to-t from-white via-white/50 to-transparent')
        }`} />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end pb-12 px-6">
        <div className="max-w-3xl">
          <h1 className={`text-4xl md:text-6xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            {currentBanner.title}
          </h1>
          {currentBanner.description && (
            <p className={`text-lg md:text-xl mb-6 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>
              {currentBanner.description}
            </p>
          )}
          {currentBanner.button_text && currentBanner.link_url && (
            <Link
              to={currentBanner.link_url}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                isDarkMode 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {currentBanner.button_text}
              <ChevronRight size={20} />
            </Link>
          )}
        </div>
      </div>

      {/* Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide
                  ? (isDarkMode ? 'bg-white w-8' : 'bg-black w-8')
                  : (isDarkMode ? 'bg-white/50' : 'bg-black/50')
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSectionAlt;
