import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, Users, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildAvatarUrl } from '@/lib/media-helper';
import { ComposerCardSkeleton } from '@/components/ui/SkeletonLoader';
import { useCachedData } from '@/hooks/usePreloadData';
import { apiFetch } from '@/lib/api-helper';

interface Compositor {
  id: string;
  name: string;
  description: string;
  image: string;
  totalHinos: number;
  popularHino: string;
  followers: number;
  isTrending: boolean;
}

type Composer = Compositor & {
  avatar_url?: string;
  photo_url?: string;
  imageUrl?: string;
  image?: string;
  followers_count?: number;
  followers?: number;
  bio?: string;
  category?: string;
  is_trending?: boolean;
  total_hymns?: number;
  popularHino?: string;
  verificado?: number;
  verified?: boolean;
};

const ComposersSection: React.FC = () => {
  // Estado para controlar se Ã© desktop
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Detectar tamanho da tela
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const isDesktopSize = width >= 1024;
      console.log('ðŸ–¥ï¸ Largura detectada:', width, 'px - Desktop:', isDesktopSize);
      setIsDesktop(isDesktopSize);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Sem mocks: sempre exibir vazio quando nÃ£o houver dados reais

  const [composers, setComposers] = useState<Composer[]>([]);
  const [isLoading, setIsLoading] = useState(true); // ComeÃ§ar com loading
  const [currentCompositorIndex, setCurrentCompositorIndex] = useState(0);
  
  // Touch/Swipe controls
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Carregar compositores do banco de dados
  useEffect(() => {
    loadComposersFromDatabase();
  }, []);

  const loadComposersFromDatabase = async () => {
    try {
      setIsLoading(true);
      console.log('ðŸŽµ ComposersSection - Carregando do banco...');
      
      // 1) Mostrar cache imediatamente (se existir)
      const cachedComposers = useCachedData('featuredComposers') as Composer[] | undefined;
      if (cachedComposers && cachedComposers.length > 0) {
        console.log('âœ… Usando compositores do cache (placeholder):', cachedComposers.length);
        setComposers(cachedComposers);
      }

      // 2) Buscar do backend SEMPRE e sobrescrever se diferente
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout loading composers')), 6000)
      );

      const fetchPromise = apiFetch('api/compositores/index.php?limit=100')
        .then(res => {
          if (!res.ok) throw new Error('Erro ao carregar compositores');
          return res.json();
        })
        .then(data => {
          console.log('🎵 Compositores do banco:', data);
          
          // O endpoint retorna { compositores: [...] }
          const compositoresArray = data.compositores || data || [];
          
          return compositoresArray.map((comp: any) => ({
            id: String(comp.id),
            name: comp.nome || 'Compositor',
            description: comp.biografia || 'Compositor da CCB',
            image: comp.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comp.nome || 'C')}&size=400&background=1a1a1a&color=00D1FF`,
            avatar_url: comp.avatar_url,
            photo_url: comp.avatar_url,
            imageUrl: comp.avatar_url,
            followers_count: 0, // TODO: implementar sistema de seguidores
            followers: 0,
            is_trending: false, // TODO: implementar sistema de trending
            popularHino: 'Hinos populares',
            total_hymns: 0, // TODO: contar hinos do compositor
            verificado: comp.verificado ?? 0,
            verified: Boolean(comp.verificado),
          }));
        });

      const fresh = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]);

      if (fresh && Array.isArray(fresh)) {
        const cacheCount = cachedComposers?.length || 0;
        const freshCount = fresh.length;
        const cacheIds = (cachedComposers || []).map((c: any) => c.id).join(',');
        const freshIds = fresh.map((c: any) => c.id).join(',');
        console.log('ðŸ“¦ Cache vs Backend:', { cacheCount, freshCount, cacheIds, freshIds });
        console.log('ðŸ“¦ Fresh data completa:', fresh.map(c => `${c.id}:${c.name}`));

        const isDifferent = cacheCount !== freshCount || cacheIds !== freshIds;
        if (isDifferent) {
          console.log('ðŸ”„ Substituindo cache por dados do backend');
          setComposers(fresh as Composer[]);
        } else if (!cachedComposers || cacheCount === 0) {
          console.log('âœ… Usando dados do backend (sem cache)');
          setComposers(fresh as Composer[]);
        } else {
          console.log('âœ… Cache e backend idÃªnticos, mantendo cache');
        }
      } else {
        console.warn('âš ï¸ Backend retornou vazio. Mantendo lista vazia.');
        setComposers([]);
      }
      
    } catch (error) {
      console.error('âŒ Erro ao carregar compositores:', error);
      setComposers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Converter compositores para formato do componente
  const displayComposers = composers.map(c => {
    // Priorizar avatar_url, depois photo_url, por Ãºltimo gerar fallback
    const avatarUrl = c.avatar_url || c.photo_url || '';
    const finalImage = buildAvatarUrl({ id: String(c.id), avatar_url: avatarUrl, name: c.name });
    
    console.log(`ðŸ–¼ï¸ Avatar de ${c.name}:`, { avatar_url: c.avatar_url, photo_url: c.photo_url, final: finalImage });
    
    return {
      id: c.id,
      name: c.name,
      description: c.bio || c.description || c.category || 'Compositor da CCB',
      image: finalImage,
      totalHinos: c.total_hymns ?? c.totalHinos ?? 0,
      popularHino: c.popularHino ?? 'Hinos populares',
      followers: c.followers_count ?? c.followers ?? 0,
      isTrending: Boolean(c.is_trending ?? c.isTrending),
      verified: Boolean(c.verified ?? (c as any).verificado === 1),
    };
  });

  console.log('ðŸŽµ [ComposersSection] RENDERIZANDO SEÃ‡ÃƒO DE COMPOSITORES');
  console.log('ðŸŽµ [ComposersSection] Compositores originais:', composers.length);
  console.log('ðŸŽµ [ComposersSection] DisplayComposers:', displayComposers.length);
  console.log('ðŸŽµ [ComposersSection] IDs:', displayComposers.map(c => `${c.id}:${c.name}`).join(', '));
  console.log('ðŸŽµ [ComposersSection] Largura da tela:', window.innerWidth + 'px');
  console.log('ðŸŽµ [ComposersSection] Ã‰ Desktop?', isDesktop);

  // Format followers count
  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  // Auto-rotate compositores: 1 card por vez no mobile
  useEffect(() => {
    if (displayComposers.length <= 2) return; // NÃ£o rotacionar se tiver 2 ou menos
    
    const interval = setInterval(() => {
      setCurrentCompositorIndex((prev) => {
        // No mobile, avanÃ§a 1 card por vez
        if (!isDesktop) {
          const nextIndex = prev + 1;
          // Reset para 0 quando chegar ao final (sem scroll infinito complexo)
          if (nextIndex >= displayComposers.length) {
            return 0;
          }
          return nextIndex;
        } else if (displayComposers.length > 4) {
          // Desktop: carrossel normal se > 4 compositores
          return prev + 1;
        }
        return prev; // NÃ£o rotaciona no desktop se <= 4
      });
    }, isDesktop ? 5000 : 3500); // 3.5s no mobile para movimento mais fluido
    
    return () => clearInterval(interval);
  }, [displayComposers.length, isDesktop]);

  const nextCompositor = () => {
    setCurrentCompositorIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= displayComposers.length) {
        return 0;
      }
      return nextIndex;
    });
  };

  const prevCompositor = () => {
    setCurrentCompositorIndex((prev) => {
      if (prev <= 0) {
        return displayComposers.length - 1;
      }
      return prev - 1;
    });
  };

  // Touch/Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && displayComposers.length > 2) {
      nextCompositor();
    }
    if (isRightSwipe && displayComposers.length > 2) {
      prevCompositor();
    }
  };


  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Compositores em Destaque
          </h2>
          <div className="hidden md:flex gap-2">
            <div className="w-10 h-10 bg-gray-800 rounded-full animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-800 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Skeleton Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <ComposerCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (displayComposers.length === 0) {
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Compositores em Destaque
          </h2>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-400">Nenhum compositor encontrado</p>
        </div>
      </section>
    );
  }

  console.log('ðŸŽµ Renderizando compositores:', displayComposers.length, displayComposers.map(c => c.name));

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Compositores em Destaque
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Compositores recém chegados
          </p>
        </div>
        
        {/* Controles de navegaÃ§Ã£o */}
        <div className="flex items-center gap-3">
          <Link 
            to="/compositores" 
            className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
          >
            Ver todos
          </Link>
          
          {/* Setas de navegaÃ§Ã£o */}
          {displayComposers.length > 2 && (
            <div className="flex gap-2">
              <button
                onClick={prevCompositor}
                className="p-1.5 md:p-2 rounded-full bg-background-secondary hover:bg-background-tertiary text-white transition-colors"
                aria-label="Compositor anterior"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={nextCompositor}
                className="p-1.5 md:p-2 rounded-full bg-background-secondary hover:bg-background-tertiary text-white transition-colors"
                aria-label="PrÃ³ximo compositor"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile e Tablet: Dois Cards por vez com scroll infinito suave */}
      {!isDesktop && (
      <div>
        {displayComposers.length > 0 && (
          <>
            <div 
              ref={carouselRef}
              className={`grid ${displayComposers.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-4 transition-all duration-800 touch-pan-x`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Mostrar 2 compositores se houver mais de 1, senão mostrar apenas 1 */}
              {(displayComposers.length === 1 
                ? [displayComposers[0]]
                : [
                    displayComposers[currentCompositorIndex % displayComposers.length],
                    displayComposers[(currentCompositorIndex + 1) % displayComposers.length]
                  ]
              ).map((compositor, index) => (
                    <Link 
                      key={`mobile-${compositor.id}-${currentCompositorIndex}-${index}`}
                      to={`/compositor/${compositor.id}`} 
                      className="block group bg-background-secondary rounded-lg overflow-hidden hover:bg-background-tertiary transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/20 cursor-pointer h-full"
                    >
                      <div className="p-3 sm:p-4 h-full flex flex-col">
                        <div className="relative rounded-full mb-3 w-32 h-32 sm:w-36 sm:h-36 mx-auto overflow-hidden flex-shrink-0">
                          <img 
                            src={compositor.image}
                            alt={compositor.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        </div>
                        
                        <div className="text-center flex-1 flex flex-col justify-between">
                          <div>
                            {/* Trending Badge - Altura fixa para padronizar */}
                            <div className="h-5 flex items-center justify-center mb-2">
                              {compositor.isTrending && (
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-primary-400" />
                                  <span className="text-xs text-primary-400 font-medium">Em Alta</span>
                                </div>
                              )}
                            </div>
                            
                            {compositor.verified && (
                              <div className="flex justify-center mb-1">
                                <span className="inline-flex items-center gap-1 md:px-2 md:py-0.5 px-1.5 py-0.5 rounded-full bg-primary-500/10 text-primary-400 md:text-[10px] text-[9px] font-medium">
                                  <BadgeCheck className="w-3 h-3" />
                                  Verificado
                                </span>
                              </div>
                            )}
                            <h3 className="text-sm font-bold text-white mb-1 line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                              {compositor.name}
                            </h3>
                          </div>
                          
                          <div>
                            {/* Followers Count */}
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Users className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {formatFollowers(compositor.followers)}
                              </span>
                            </div>
                            
                            <p className="text-gray-500 text-xs">
                              Compositor
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                ))}
            </div>
            
            {/* Dots Indicator Mobile - Centralizado fora do grid */}
            <div className="w-full flex justify-center items-center mt-6">
              <div className="flex space-x-2">
                {displayComposers.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      (currentCompositorIndex % displayComposers.length) === index 
                        ? 'bg-primary-500 scale-110' 
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      )}

      {/* Desktop: Grid (<=4) ou Carrossel Infinito com 5 visÃ­veis (>4) */}
      {isDesktop && (
      <div>
        {displayComposers.length <= 4 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayComposers.map((compositor) => (
              <Link
                key={String(compositor.id)}
                to={`/compositor/${compositor.id}`}
                className="block group bg-background-secondary rounded-lg overflow-hidden hover:bg-background-tertiary transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary-500/20 cursor-pointer"
              >
                <div className="p-3">
                  <div className="relative rounded-full mb-3 w-28 h-28 md:w-32 md:h-32 mx-auto overflow-hidden">
                    <img
                      src={compositor.image}
                      alt={compositor.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                  <div className="text-center">
                    {compositor.isTrending && (
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 text-primary-400" />
                        <span className="text-xs text-primary-400 font-medium">Top Trends</span>
                      </div>
                    )}
                    {compositor.verified && (
                      <div className="flex justify-center mb-1">
                        <span className="inline-flex items-center gap-1 md:px-2 md:py-0.5 px-1.5 py-0.5 rounded-full bg-primary-500/10 text-primary-400 md:text-[10px] text-[9px] font-medium">
                          <BadgeCheck className="w-3 h-3" />
                          Verificado
                        </span>
                      </div>
                    )}
                    <h3 className="text-base font-bold text-white mb-1 flex items-center justify-center">
                      {compositor.name}
                    </h3>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">{formatFollowers(compositor.followers)} seguidores</span>
                    </div>
                    <p className="text-gray-500 text-xs">Compositor</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden w-full">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${(currentCompositorIndex % displayComposers.length) * 300}px)`,
                width: `${(displayComposers.length * 2) * 300}px`
              }}
            >
              {[...displayComposers, ...displayComposers].map((compositor, index) => (
                <div key={`${compositor.id}-${index}`} style={{ width: '300px', minWidth: '300px' }} className="flex-shrink-0 px-3">
                  <Link to={`/compositor/${compositor.id}`} className="block group bg-background-secondary rounded-lg overflow-hidden hover:bg-background-tertiary transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary-500/20 h-full cursor-pointer">
                    <div className="p-4">
                      <div className="relative rounded-full mb-4 w-36 h-36 lg:w-40 lg:h-40 mx-auto overflow-hidden">
                        <img
                          src={compositor.image}
                          alt={compositor.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      </div>
                      <div className="text-center">
                        {compositor.isTrending && (
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <TrendingUp className="w-3 h-3 text-primary-400" />
                            <span className="text-xs text-primary-400 font-medium">Top Trends</span>
                          </div>
                        )}
                        {compositor.verified && (
                          <div className="flex justify-center mb-1">
                            <span className="inline-flex items-center gap-1 md:px-2 md:py-0.5 px-1.5 py-0.5 rounded-full bg-primary-500/10 text-primary-400 md:text-[10px] text-[9px] font-medium">
                              <BadgeCheck className="w-3 h-3" />
                              Verificado
                            </span>
                          </div>
                        )}
                        <h3 className="text-base font-bold text-white mb-1 leading-tight flex items-center justify-center">
                          {compositor.name}
                        </h3>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-400">{formatFollowers(compositor.followers)} seguidores</span>
                        </div>
                        <p className="text-gray-400 text-sm">Compositor</p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4 space-x-2">
              {displayComposers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentCompositorIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    (currentCompositorIndex % displayComposers.length) === index ? 'bg-primary-500' : 'bg-gray-600'
                  }`}
                  aria-label={`Ir para compositor ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      )}
    </section>
  );
};

export default ComposersSection;
























