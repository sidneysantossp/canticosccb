import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Heart, Share2, ArrowLeft, Music, ChevronDown, ChevronLeft, ChevronRight, UserPlus, UserCheck } from 'lucide-react';
import { supabaseFetch, supabaseDelete, supabaseInsert, isSupabaseConfigured } from '@/lib/supabaseRest';
import { usePlayerStore } from '@/stores/playerStore';
import useFavoritesStore from '@/stores/favoritesStore';
import { usePlayerContext } from '@/contexts/PlayerContext';
import SEOHead from '@/components/SEO/SEOHead';
import { generateMusicRecordingSchema, generateBreadcrumbSchema } from '@/utils/schemaGenerator';
import { useAuth } from '@/contexts/AuthContext';

interface Hymn {
  id: string;
  numero: number;
  titulo: string;
  compositor_nome?: string;
  compositor_id?: string;
  participacao_especial?: string;
  categoria?: string;
  cover_url?: string;
  audio_url?: string;
  letra?: string;
  duracao?: string;
  youtube_source?: string;
}

const HymnDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { play } = usePlayerStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const { openFullScreen } = usePlayerContext();
  const { user } = useAuth();
  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [relatedSongs, setRelatedSongs] = useState<any[]>([]);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const sanitizeHtml = useMemo(() => (html: string) => {
    if (!html) return '';
    let out = html;
    out = out.replace(/<\/(?:script|style)>/gi, '')
             .replace(/<(?:script|style)[^>]*>[\s\S]*?<\/(?:script|style)>/gi, '');
    out = out.replace(/ on[a-z]+\s*=\s*"[^"]*"/gi, '')
             .replace(/ on[a-z]+\s*=\s*'[^']*'/gi, '')
             .replace(/ on[a-z]+\s*=\s*[^\s>]+/gi, '');
    out = out.replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"')
             .replace(/(href|src)\s*=\s*'javascript:[^']*'/gi, "$1='#'");
    return out;
  }, []);

  useEffect(() => {
    loadHymn();
    setLyricsOpen(false);
  }, [id]);

  const loadHymn = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        console.warn('Supabase not configured');
        setHymn(null);
        return;
      }

      const rows = await supabaseFetch<any>('hinos', {
        id: `eq.${id}`,
        select: 'id,numero,titulo,compositor_nome,compositor_id,participacao_especial,categoria,cover_url,audio_url,letra,duracao,youtube_source',
        limit: '1'
      });

      if (rows.length > 0) {
        setHymn({
          id: String(rows[0].id),
          numero: rows[0].numero,
          titulo: rows[0].titulo,
          compositor_nome: rows[0].compositor_nome,
          compositor_id: rows[0].compositor_id,
          participacao_especial: rows[0].participacao_especial,
          categoria: rows[0].categoria,
          cover_url: rows[0].cover_url,
          audio_url: rows[0].audio_url,
          letra: rows[0].letra,
          duracao: rows[0].duracao,
          youtube_source: rows[0].youtube_source
        });
      } else {
        setHymn(null);
      }
    } catch (error) {
      console.error('Erro ao carregar hino:', error);
      setHymn(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRelatedSongs = async (composerName: string, currentId: string) => {
    try {
      const rows = await supabaseFetch<any>('hinos', {
        compositor_nome: `eq.${composerName}`,
        id: `neq.${currentId}`,
        select: 'id,numero,titulo,compositor_nome,cover_url,categoria',
        limit: '20',
        order: 'numero.asc'
      });
      setRelatedSongs(rows || []);
    } catch (err) {
      console.error('Erro ao carregar hinos relacionados:', err);
      setRelatedSongs([]);
    }
  };

  useEffect(() => {
    if (hymn?.compositor_nome && hymn.id) {
      loadRelatedSongs(hymn.compositor_nome, hymn.id);
    } else {
      setRelatedSongs([]);
    }
  }, [hymn?.compositor_nome, hymn?.id]);

  // Check if user follows the composer
  useEffect(() => {
    const checkFollow = async () => {
      if (!user?.id || !hymn?.compositor_id || !isSupabaseConfigured) {
        setIsFollowing(false);
        return;
      }
      try {
        const rows = await supabaseFetch<any>('user_follows', {
          composer_id: `eq.${hymn.compositor_id}`,
          user_id: `eq.${user.id}`,
          select: 'id'
        });
        setIsFollowing(rows.length > 0);
      } catch {
        setIsFollowing(false);
      }
    };
    checkFollow();
  }, [user?.id, hymn?.compositor_id]);

  const handleFollow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!hymn?.compositor_id || !isSupabaseConfigured || followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabaseDelete('user_follows', {
          composer_id: `eq.${hymn.compositor_id}`,
          user_id: `eq.${user.id}`
        });
        setIsFollowing(false);
      } else {
        await supabaseInsert('user_follows', {
          composer_id: hymn.compositor_id,
          user_id: user.id
        });
        setIsFollowing(true);

        // Criar notificação para o compositor
        try {
          const composerRows = await supabaseFetch<any>('composers', {
            id: `eq.${hymn.compositor_id}`,
            select: 'user_id'
          });
          const composerUserId = composerRows?.[0]?.user_id;
          if (composerUserId) {
            const followerName = user.user_metadata?.name || user.email || 'Alguém';
            await supabaseInsert('notifications', {
              user_id: composerUserId,
              composer_id: hymn.compositor_id,
              type: 'follow',
              title: '👤 Novo seguidor',
              message: `${followerName} começou a seguir você.`,
              link: '/composer/followers',
              read: false,
              is_read: false,
              metadata: { follower_id: user.id, follower_name: followerName },
            });
          }
        } catch (notifErr) {
          console.warn('Falha ao criar notificação de follow:', notifErr);
        }
      }
    } catch (err) {
      console.error('Erro ao seguir/deixar de seguir:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 300;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handlePlayRelated = (song: any) => {
    const fallback = 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3';
    play({
      id: String(song.id),
      title: song.titulo,
      artist: song.compositor_nome || 'Coral CCB',
      coverUrl: song.cover_url || '',
      audioUrl: song.youtube_source ? '' : (song.audio_url || fallback),
      youtubeSource: song.youtube_source || undefined
    } as any);
    openFullScreen('default');
  };

  const handlePlay = () => {
    if (!hymn) return;
    
    const fallback = 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3';
    play({
      id: hymn.id,
      title: hymn.titulo,
      artist: hymn.compositor_nome || 'Coral CCB',
      coverUrl: hymn.cover_url || '',
      audioUrl: hymn.youtube_source ? '' : (hymn.audio_url || fallback),
      youtubeSource: hymn.youtube_source || undefined
    } as any);
    
    // Abrir player fullscreen no mobile (< 768px)
    openFullScreen('default');
  };

  const handleFavorite = () => {
    if (!hymn) return;
    
    if (isFavorite(hymn.id)) {
      removeFavorite(hymn.id, user?.id);
    } else {
      addFavorite({
        id: hymn.id,
        title: hymn.titulo,
        artist: hymn.compositor_nome || 'Coral CCB',
        album: hymn.categoria || 'Hinos CCB',
        duration: hymn.duracao || '00:00',
        coverUrl: hymn.cover_url || '',
      }, user?.id);
    }
  };

  const handleShare = async () => {
    if (!hymn) return;
    const url = window.location.href;
    const text = `${hymn.titulo}${hymn.compositor_nome ? ` - ${hymn.compositor_nome}` : ''}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
      } catch (err) {
        // Usuário cancelou o compartilhamento
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareMessage('Link copiado!');
        setTimeout(() => setShareMessage(null), 2000);
      } catch {
        setShareMessage('Não foi possível copiar');
        setTimeout(() => setShareMessage(null), 2000);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!hymn) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Hino não encontrado</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-primary-500 hover:text-primary-400"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${hymn.titulo}${hymn.compositor_nome ? ` - ${hymn.compositor_nome}` : ''}`}
        description={`Ouça ${hymn.titulo}${hymn.compositor_nome ? ` de ${hymn.compositor_nome}` : ''} na Cânticos CCB. ${hymn.categoria ? `Categoria: ${hymn.categoria}.` : ''}`}
        keywords={`${hymn.titulo}, ${hymn.compositor_nome || 'CCB'}, hino, ${hymn.categoria || 'hinos'}, congregação cristã`}
        canonical={`/hino/${id}`}
        ogType="music.song"
        ogImage={hymn.cover_url}
        schemaData={[
          generateMusicRecordingSchema({
            name: hymn.titulo,
            url: `/hino/${id}`,
            artist: hymn.compositor_nome || 'Cânticos CCB',
            artistUrl: hymn.compositor_id ? `/compositor/${hymn.compositor_id}` : '/',
            genre: hymn.categoria || 'Hinos CCB',
            image: hymn.cover_url,
          }),
          generateBreadcrumbSchema([
            { name: 'Início', url: '/' },
            { name: hymn.categoria || 'Hinos', url: hymn.categoria ? `/categoria/${hymn.categoria.toLowerCase()}` : '/' },
            { name: hymn.titulo, url: `/hino/${id}` },
          ]),
        ]}
      />
      
      <div className="min-h-screen bg-background-primary">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary-900/20 to-background-primary">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-text-muted hover:text-white mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>

            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
              {/* Cover */}
              <img
                src={hymn.cover_url || 'https://picsum.photos/seed/hymn/300/300'}
                alt={hymn.titulo}
                className="w-48 h-48 rounded-lg shadow-2xl object-cover"
              />

              {/* Info */}
              <div className="flex-1">
                <p className="text-sm text-text-muted mb-2">HINO</p>
                <h1 className="text-2xl md:text-4xl font-bold text-white mb-4">
                  {hymn.numero > 0 && !hymn.titulo.includes(String(hymn.numero))
                    ? `${hymn.numero} - ${hymn.titulo}`
                    : hymn.titulo}
                </h1>
                {hymn.compositor_nome && (
                  <div className="flex items-center gap-3 mb-2">
                    {hymn.compositor_id ? (
                      <Link
                        to={`/compositor/${hymn.compositor_id}`}
                        className="text-lg text-text-muted hover:text-primary-400 transition-colors"
                      >
                        {hymn.compositor_nome}
                      </Link>
                    ) : (
                      <p className="text-lg text-text-muted">{hymn.compositor_nome}</p>
                    )}
                  </div>
                )}
                {hymn.participacao_especial && (
                  <p className="text-sm text-gray-400 mb-4">
                    <span className="text-gray-500">Part. Especial:</span> {hymn.participacao_especial}
                  </p>
                )}
                {hymn.categoria && (
                  <span className="inline-block px-3 py-1 bg-background-tertiary text-text-muted rounded-full text-sm">
                    {hymn.categoria}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handlePlay}
                className="flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-semibold transition-colors"
              >
                <Play className="w-5 h-5" />
                Reproduzir
              </button>

              {hymn.compositor_id && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-1.5 px-5 py-3 rounded-full text-sm font-medium transition-colors ${
                    isFollowing
                      ? 'bg-background-tertiary text-white hover:bg-red-900/30 hover:text-red-400'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isFollowing ? (
                    <><UserCheck className="w-5 h-5" /> Seguindo</>
                  ) : (
                    <><UserPlus className="w-5 h-5" /> Seguir</>
                  )}
                </button>
              )}
              
              <button
                onClick={handleFavorite}
                className={`p-3 rounded-full transition-colors ${
                  isFavorite(hymn.id)
                    ? 'bg-primary-600 text-white'
                    : 'bg-background-tertiary text-text-muted hover:text-white'
                }`}
              >
                <Heart className={`w-6 h-6 ${isFavorite(hymn.id) ? 'fill-current' : ''}`} />
              </button>

              <div className="relative">
                <button
                  onClick={handleShare}
                  className="p-3 rounded-full bg-background-tertiary text-text-muted hover:text-white transition-colors"
                >
                  <Share2 className="w-6 h-6" />
                </button>
                {shareMessage && (
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-primary-400 whitespace-nowrap bg-background-secondary px-2 py-1 rounded">
                    {shareMessage}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Letra - Accordion */}
        {hymn.letra && (
          <div className="max-w-7xl mx-auto px-4 pt-8">
            <button
              onClick={() => setLyricsOpen(!lyricsOpen)}
              className="w-full flex items-center justify-between bg-background-secondary hover:bg-background-tertiary rounded-lg px-6 py-4 transition-colors group"
            >
              <h2 className="text-2xl font-bold text-white">Letra</h2>
              <ChevronDown
                className={`w-6 h-6 text-text-muted group-hover:text-white transition-transform duration-300 ${
                  lyricsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                lyricsOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="bg-background-secondary rounded-b-lg px-6 pb-6 pt-2 -mt-1">
                {(() => {
                  const lyrics = hymn.letra || '';
                  const looksHtml = /<[^>]+>/.test(lyrics);
                  if (looksHtml) {
                    let processed = sanitizeHtml(lyrics);
                    processed = processed.replace(/ {2,}/g, (match) => '&nbsp;'.repeat(match.length));
                    processed = processed.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '<div class="h-4"></div>');
                    return (
                      <div
                        className="max-w-none text-text-primary leading-relaxed font-mono text-sm [&_p]:my-0.5 [&_a]:text-primary-400 [&_a]:no-underline"
                        dangerouslySetInnerHTML={{ __html: processed }}
                      />
                    );
                  }
                  return (
                    <pre className="text-text-primary whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {lyrics}
                    </pre>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Ouça também - Carrossel */}
        {relatedSongs.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Ouça também</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollCarousel('left')}
                  className="p-2 rounded-full bg-background-secondary hover:bg-background-tertiary text-text-muted hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="p-2 rounded-full bg-background-secondary hover:bg-background-tertiary text-text-muted hover:text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {relatedSongs.map((song) => (
                <Link
                  key={song.id}
                  to={`/hymn/${song.id}`}
                  className="flex-shrink-0 w-44 group"
                >
                  <div className="relative w-44 h-44 rounded-lg overflow-hidden mb-3 bg-background-tertiary">
                    <img
                      src={song.cover_url || 'https://picsum.photos/seed/' + song.id + '/300/300'}
                      alt={song.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePlayRelated(song);
                        }}
                        className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg"
                      >
                        <Play className="w-5 h-5 ml-0.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-white text-sm font-medium truncate group-hover:text-primary-400 transition-colors">
                    {song.numero > 0 ? `${song.numero} - ` : ''}{song.titulo}
                  </p>
                  <p className="text-text-muted text-xs truncate">
                    {song.compositor_nome || 'Desconhecido'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HymnDetailPage;
