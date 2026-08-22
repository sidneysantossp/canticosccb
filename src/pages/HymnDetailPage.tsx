import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Heart, Share2, ArrowLeft, Music, ChevronDown, ChevronLeft, ChevronRight, UserPlus, UserCheck } from 'lucide-react';
import { supabaseFetch, supabaseDelete, supabaseInsert, isSupabaseConfigured } from '@/lib/supabaseRest';
import { usePlayerStore } from '@/stores/playerStore';
import useFavoritesStore from '@/stores/favoritesStore';
import { usePlayerContext } from '@/contexts/PlayerContext';
import SEOHead from '@/components/SEO/SEOHead';
import { generateMusicRecordingSchema, generateBreadcrumbSchema } from '@/utils/schemaGenerator';
import { extractUUID, buildHinoUrl, buildCompositorUrl } from '@/utils/slugUrl';
import { getHinarioRangeForNumero } from '@/lib/hinarioRanges';
import { useAuth } from '@/contexts/AuthContext';
import sanitizeRichText from '@/utils/sanitizeHtml';
import { findRelatedCifra, findRelatedHinario, type RelatedCifraSummary } from '@/lib/hymnConnectionsApi';

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

const stripHtml = (value?: string) =>
  String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const truncateText = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1).trim()}…` : value;

const HymnDetailPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = rawId ? extractUUID(rawId) : undefined;
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
  const [relatedCifra, setRelatedCifra] = useState<RelatedCifraSummary | null>(null);
  const [relatedLyric, setRelatedLyric] = useState<{ numero: number; titulo: string } | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const hinarioRange = getHinarioRangeForNumero(relatedLyric?.numero || hymn?.numero);


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

  useEffect(() => {
    let cancelled = false;

    const loadRelatedConnections = async () => {
      if (!hymn?.id && !hymn?.numero) {
        setRelatedCifra(null);
        setRelatedLyric(null);
        return;
      }

      try {
        const [cifra, lyric] = await Promise.all([
          findRelatedCifra({ hymnId: hymn?.id, numero: hymn?.numero, titulo: hymn?.titulo }),
          findRelatedHinario(hymn?.numero),
        ]);

        if (!cancelled) {
          setRelatedCifra(cifra);
          setRelatedLyric(lyric ? { numero: lyric.numero, titulo: lyric.titulo } : null);
        }
      } catch (error) {
        console.error('Erro ao carregar cifra relacionada:', error);
        if (!cancelled) {
          setRelatedCifra(null);
          setRelatedLyric(null);
        }
      }
    };

    void loadRelatedConnections();

    return () => {
      cancelled = true;
    };
  }, [hymn?.id, hymn?.numero, hymn?.titulo]);

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

        // A notificação de novo seguidor deve ser criada por trigger/RPC de domínio
        // no banco. O navegador não recebe nem consulta o user_id privado do compositor.
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
    play({
      id: String(song.id),
      title: song.titulo,
      number: Number(song.numero || 0),
      category: song.categoria || hymn?.categoria || 'Hinos CCB',
      artist: song.compositor_nome || 'Coral CCB',
      duration: song.duracao || '00:00',
      coverUrl: song.cover_url || '',
      audioUrl: song.youtube_source ? '' : (song.audio_url || ''),
      plays: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
      youtubeSource: song.youtube_source || undefined
    } as any);
    openFullScreen('default');
  };

  const handlePlay = () => {
    if (!hymn) return;

    play({
      id: hymn.id,
      title: hymn.titulo,
      number: Number(hymn.numero || 0),
      category: hymn.categoria || 'Hinos CCB',
      artist: hymn.compositor_nome || 'Coral CCB',
      duration: hymn.duracao || '00:00',
      coverUrl: hymn.cover_url || '',
      audioUrl: hymn.youtube_source ? '' : (hymn.audio_url || ''),
      plays: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
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
      } catch  {
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

  const hymnPrimaryTitle = hymn.numero
    ? `Hino ${hymn.numero} CCB - ${hymn.titulo}`
    : `${hymn.titulo} - Hino CCB`;
  const lyricsExcerpt = truncateText(stripHtml(hymn.letra), 180);
  const hymnDescription = truncateText(
    [
      `Ouça ${hymnPrimaryTitle}${hymn.compositor_nome ? `, composto por ${hymn.compositor_nome}` : ''}.`,
      hymn.categoria ? `Categoria: ${hymn.categoria}.` : '',
      relatedLyric ? `Letra disponivel no Hinario ${relatedLyric.numero}.` : '',
      relatedCifra ? `Cifra relacionada disponivel${relatedCifra.original_key ? ` em ${relatedCifra.original_key}` : ''}.` : '',
      lyricsExcerpt ? `Letra: ${lyricsExcerpt}` : 'Áudio, letra e informações completas no Cânticos CCB.',
    ]
      .filter(Boolean)
      .join(' '),
    320
  );
  const hymnKeywords = [
    hymnPrimaryTitle,
    hymn.numero ? `hino ${hymn.numero} ccb` : null,
    hymn.numero ? `letra hino ${hymn.numero} ccb` : null,
    hymn.numero ? `cifra hino ${hymn.numero} ccb` : null,
    hymn.titulo,
    hymn.compositor_nome,
    hymn.categoria,
    'hinos ccb',
    'hinário 5',
  ]
    .filter(Boolean)
    .join(', ');
  const categorySlug = hymn.categoria
    ? hymn.categoria
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    : '';

  return (
    <>
      <SEOHead
        title={`${hymnPrimaryTitle}${hymn.compositor_nome ? ` - ${hymn.compositor_nome}` : ''}`}
        description={hymnDescription}
        keywords={hymnKeywords}
        canonical={buildHinoUrl(hymn.id, hymn.titulo, hymn.numero)}
        ogType="music.song"
        ogImage={hymn.cover_url}
        schemaData={[
          generateMusicRecordingSchema({
            name: hymnPrimaryTitle,
            url: buildHinoUrl(hymn.id, hymn.titulo, hymn.numero),
            artist: hymn.compositor_nome || 'Cânticos CCB',
            artistUrl: hymn.compositor_id ? buildCompositorUrl(hymn.compositor_id, hymn.compositor_nome || undefined) : '/',
            genre: hymn.categoria || 'Hinos CCB',
            image: hymn.cover_url,
            description: hymnDescription,
            audioUrl: hymn.youtube_source ? undefined : hymn.audio_url,
          }),
          generateBreadcrumbSchema([
            { name: 'Início', url: '/' },
            { name: hymn.categoria || 'Hinos', url: categorySlug ? `/categoria/${categorySlug}` : '/' },
            { name: hymn.titulo, url: buildHinoUrl(hymn.id, hymn.titulo, hymn.numero) },
          ]),
        ]}
      />

      <main className="min-h-screen bg-background-primary px-4 py-8 md:px-6 md:py-12">
        <article className="mx-auto max-w-4xl rounded-3xl border border-gray-300 bg-gray-200 px-6 py-8 text-gray-900 shadow-xl md:px-12 md:py-12">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            {hymn.titulo}
          </h1>

          <div className="mt-8 border-t border-gray-300 pt-8">
            {hymn.letra ? (
              (() => {
                const lyrics = hymn.letra || '';
                const looksHtml = /<[^>]+>/.test(lyrics);
                if (looksHtml) {
                  let processed = sanitizeRichText(lyrics);
                  processed = processed.replace(/ {2,}/g, (match) => '&nbsp;'.repeat(match.length));
                  processed = processed.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '<div class="h-4"></div>');
                  return (
                    <div
                      className="max-w-none text-base leading-8 [&_p]:my-1 [&_a]:text-blue-700 [&_a]:underline md:text-lg md:leading-9"
                      dangerouslySetInnerHTML={{ __html: processed }}
                    />
                  );
                }
                return (
                  <pre className="whitespace-pre-wrap font-sans text-base leading-8 md:text-lg md:leading-9">
                    {lyrics}
                  </pre>
                );
              })()
            ) : (
              <p className="text-base text-gray-600 md:text-lg">A letra deste hino ainda não está disponível.</p>
            )}
          </div>
        </article>
      </main>
    </>
  );
};
export default HymnDetailPage;
