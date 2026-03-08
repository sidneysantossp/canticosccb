import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Music, Users, Play, Pause, Heart, TrendingUp, Clock, Share2, ListPlus } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { generatePersonSchema, generateBreadcrumbSchema } from '@/utils/schemaGenerator';
import { extractUUID, buildCompositorUrl, buildAlbumUrl } from '@/utils/slugUrl';
import { usePlayerStore } from '@/stores/playerStore';
import useFavoritesStore from '@/stores/favoritesStore';
import usePlaylistsStore from '@/stores/playlistsStore';
import useNotificationsStore, { createFavoriteNotification } from '@/stores/notificationsStore';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { usePlayerContext } from '@/contexts/PlayerContext';
import { buildHinoUrl, buildAlbumCoverUrl } from '@/lib/media-helper';
import { DEFAULT_COVER_URL } from '@/lib/config';
import { supabaseFetch, supabaseInsert, supabaseDelete, isSupabaseConfigured } from '@/lib/supabaseRest';

interface Composer {
  id: string;
  name: string;
  avatar_url?: string;
  photo_url?: string;
  bio?: string;
  followers_count: number;
  is_trending: boolean;
  created_at: string;
}

interface ComposerSong {
  id: string;
  title: string;
  duration?: string;
  plays?: number;
  cover_url?: string;
  audio_url?: string;
  number?: number;
  lyrics?: string;
  created_at?: string;
}

interface ComposerAlbum {
  id: string;
  title: string;
  cover_url?: string;
  year?: number;
  song_count?: number;
  created_at?: string;
}

export default function ComposerPublicProfilePage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = rawId ? extractUUID(rawId) : undefined;
  const navigate = useNavigate();
  const { play, pause, currentTrack, isPlaying } = usePlayerStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const { playlists, addTrackToPlaylist } = usePlaylistsStore();
  const { addNotification } = useNotificationsStore();
  const { user } = useAuth();
  const { refreshCount } = useNotifications();
  const { openFullScreen } = usePlayerContext();

  const [composer, setComposer] = useState<Composer | null>(null);
  const [songs, setSongs] = useState<ComposerSong[]>([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<ComposerSong | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'hinos' | 'albuns' | 'sobre'>('hinos');
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [publishedSongsCount, setPublishedSongsCount] = useState<number | null>(null);
  const [showSongInfoModal, setShowSongInfoModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState<ComposerSong | null>(null);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [albums, setAlbums] = useState<ComposerAlbum[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);

  // Funções definidas antes dos useEffects
  const fetchCounts = async (composerId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const followers = await supabaseFetch<any>('user_follows', {
        composer_id: `eq.${composerId}`,
        select: 'id'
      });
      setFollowersCount(followers.length);

      const songs = await supabaseFetch<any>('hinos', {
        compositor_id: `eq.${composerId}`,
        ativo: 'eq.true',
        select: 'id'
      });
      setPublishedSongsCount(songs.length);
    } catch (error) {
      console.error('❌ Erro ao carregar contagens do compositor:', error);
    }
  };

  const loadComposer = async (composerId: string) => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🎵 Carregando perfil do compositor:', composerId);

      const composerRows = await supabaseFetch<any>('composers', {
        id: `eq.${composerId}`,
        select: 'id,name,artistic_name,bio,biography,photo_url,avatar_url,verified,is_trending,followers_count,created_at'
      });

      if (composerRows.length === 0) {
        console.error('❌ Compositor não encontrado');
        setComposer(null);
        setIsLoading(false);
        return;
      }

      const composerData = composerRows[0];
      const mappedComposer: Composer = {
        id: String(composerData.id),
        name: composerData.artistic_name || composerData.name || 'Compositor',
        avatar_url: composerData.avatar_url || composerData.photo_url,
        photo_url: composerData.photo_url || composerData.avatar_url,
        bio: composerData.biography || composerData.bio || '',
        followers_count: composerData.followers_count || 0,
        is_trending: Boolean(composerData.is_trending),
        created_at: composerData.created_at || new Date().toISOString()
      };

      setComposer(mappedComposer);

      try {
        const hymnRows = await supabaseFetch<any>('hinos', {
          compositor_id: `eq.${composerId}`,
          ativo: 'eq.true',
          select: 'id,titulo,duracao,plays,cover_url,audio_url,numero,letra,created_at,youtube_source',
          limit: '1000'
        });

        const mapped = hymnRows.map((h: any) => {
          let audioUrl = h.audio_url || '';
          if (audioUrl && !audioUrl.startsWith('http') && !audioUrl.endsWith('.mp3')) {
            audioUrl = audioUrl + '.mp3';
          }
          const coverUrl = h.cover_url || DEFAULT_COVER_URL;

          return {
            id: String(h.id),
            title: h.titulo,
            duration: h.duracao,
            plays: h.plays || 0,
            cover_url: coverUrl,
            audio_url: audioUrl,
            number: h.numero,
            lyrics: h.letra,
            created_at: h.created_at,
            youtube_source: h.youtube_source || undefined,
          };
        });
        setSongs(mapped);
        setPublishedSongsCount(mapped.length);
      } catch (e) {
        console.warn('Não foi possível carregar hinos do compositor');
        setSongs([]);
        setPublishedSongsCount(0);
      }
      console.log('✅ Compositor carregado:', mappedComposer);
    } catch (error) {
      console.error('❌ Erro ao carregar compositor:', error);
      setComposer(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const checkIfFollowing = async (composerId: string) => {
    if (!user?.id || !isSupabaseConfigured) {
      setIsFollowing(false);
      return;
    }

    try {
      const rows = await supabaseFetch<any>('user_follows', {
        composer_id: `eq.${composerId}`,
        user_id: `eq.${user.id}`,
        select: 'id'
      });
      setIsFollowing(rows.length > 0);
    } catch (error) {
      console.error('❌ Erro ao verificar seguidor:', error);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      setShowFollowModal(true);
      return;
    }

    if (!id || !isSupabaseConfigured) return;

    try {
      if (isFollowing) {
        const success = await supabaseDelete('user_follows', {
          composer_id: `eq.${id}`,
          user_id: `eq.${user.id}`
        });

        if (success) {
          setIsFollowing(false);
          setFollowersCount((prev) => Math.max(0, (prev || 0) - 1));
          console.log('✅ Deixou de seguir compositor');
        }
      } else {
        const result = await supabaseInsert<any>('user_follows', {
          composer_id: id,
          user_id: user.id
        });

        if (result) {
          setIsFollowing(true);
          setFollowersCount((prev) => (prev || 0) + 1);
          console.log('✅ Seguindo compositor');

          // Criar notificação para o compositor
          try {
            const composerRows = await supabaseFetch<any>('composers', {
              id: `eq.${id}`,
              select: 'user_id'
            });
            const composerUserId = composerRows?.[0]?.user_id;
            if (composerUserId) {
              const followerName = user.user_metadata?.name || user.email || 'Alguém';
              await supabaseInsert('notifications', {
                user_id: composerUserId,
                composer_id: id,
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

          setTimeout(() => {
            refreshCount();
          }, 500);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao seguir/deixar de seguir:', error);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `Confira o perfil de ${composer?.name || 'este compositor'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: composer?.name || 'Compositor',
          text: shareText,
          url: shareUrl,
        });
        console.log('✅ Compartilhado com sucesso');
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      // Fallback: copiar URL
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copiado para a área de transferência!');
      } catch (error) {
        console.error('❌ Erro ao copiar link:', error);
      }
    }
  };

  // useEffects
  useEffect(() => {
    if (id) {
      loadComposer(id);
      fetchCounts(id);
      checkIfFollowing(id);
      // Scroll para o topo quando a página carregar
      window.scrollTo(0, 0);
    }
  }, [id, user]);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Abrir álbum diretamente no player (tema de álbum) com fila de faixas
  const handleOpenAlbum = async (album: ComposerAlbum) => {
    if (!isSupabaseConfigured) {
      navigate(buildAlbumUrl(album.id, album.title));
      return;
    }

    try {
      const hymnRows = await supabaseFetch<any>('album_hinos', {
        album_id: `eq.${album.id}`,
        select: 'hinos(id,titulo,ordem,numero,categoria,compositor,duracao,audio_url,cover_url,letra)'
      });
      const list: any[] = hymnRows.map((row: any) => row.hinos).filter(Boolean);

      const toMMSS = (v: any) => {
        if (v == null) return '0:00';
        if (typeof v === 'string' && v.includes(':')) return v;
        const n = Number(v);
        if (!Number.isFinite(n)) return '0:00';
        const mins = Math.floor(n / 60);
        const secs = Math.floor(n % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
      };

      const albumCover = buildAlbumCoverUrl({ id: String(album.id), cover_url: album.cover_url });
      const tracks = list.map((h: any) => ({
        id: String(h.id),
        title: h.titulo,
        number: h.ordem || h.numero || 0,
        category: h.categoria || 'Cantados',
        artist: composer?.name || h.compositor || 'Compositor',
        duration: toMMSS(h.duracao),
        audioUrl: buildHinoUrl({ id: String(h.id), audio_url: h.audio_url }),
        coverUrl: h.cover_url || album.cover_url || albumCover || DEFAULT_COVER_URL,
        album: album.title,
        lyrics: h.letra || h.lyrics || '',
        plays: 0,
        isLiked: false,
        createdAt: album.created_at,
      }));

      if (tracks.length > 0) {
        const first = tracks[0];
        const { clearQueue, addToQueue, setRepeat } = (usePlayerStore as any).getState();
        clearQueue();
        setRepeat('all');
        tracks.slice(1).forEach((t: any) => addToQueue(t));
        play(first as any);
        openFullScreen('album');
        return;
      }
    } catch (e) {
      console.warn('Não foi possível abrir o álbum diretamente no player:', e);
    }
    // Fallback: navegar para a página do álbum
    navigate(buildAlbumUrl(album.id, album.title));
  };

  useEffect(() => {
    const loadAlbums = async () => {
      if (!composer?.id || !isSupabaseConfigured) return;
      setLoadingAlbums(true);
      try {
        const albumRows = await supabaseFetch<any>('albums', {
          compositor_id: `eq.${composer.id}`,
          is_published: 'eq.true',
          select: 'id,title,cover_url,year,created_at',
          limit: '1000'
        });

        const mapped: ComposerAlbum[] = albumRows.map((a: any) => ({
          id: String(a.id),
          title: a.title || 'Álbum',
          cover_url: buildAlbumCoverUrl({ id: String(a.id), cover_url: a.cover_url }),
          year: a.year ?? undefined,
          song_count: 0,
          created_at: a.created_at,
        }));
        setAlbums(mapped);
      } catch {
        setAlbums([]);
      } finally {
        setLoadingAlbums(false);
      }
    };
    if (activeTab === 'albuns') loadAlbums();
  }, [activeTab, composer?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary pb-24">
        <div className="bg-gradient-to-b from-primary-900 to-background pt-20 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="h-32 w-32 bg-gray-800 rounded-full animate-pulse mb-4" />
            <div className="h-8 bg-gray-800 rounded w-64 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-800 rounded w-48 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!composer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary pb-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Compositor não encontrado</h2>
          <button
            onClick={() => navigate('/compositores')}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            Ver todos os compositores
          </button>
        </div>
      </div>
    );
  }

  const displayFollowersCount = followersCount ?? composer.followers_count ?? 0;
  const displaySongsCount = publishedSongsCount ?? songs.length;

  const avatarUrl = composer.avatar_url || composer.photo_url;
  const finalImage = avatarUrl && avatarUrl.trim() !== ''
    ? avatarUrl
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(composer.name)}&size=400&background=1a1a1a&color=00D1FF`;

  const formatDuration = (value?: string | number | null) => {
    if (!value && value !== 0) return '3:47';

    if (typeof value === 'string') {
      if (value.includes(':')) return value;
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return value;
      value = numeric;
    }

    if (typeof value === 'number') {
      const minutes = Math.floor(value / 60);
      const seconds = Math.floor(value % 60).toString().padStart(2, '0');
      return `${minutes}:${seconds}`;
    }

    return '3:47';
  };

  const handlePlaySong = (song: ComposerSong) => {
    if (currentTrack?.id === song.id && isPlaying) {
      pause();
      return;
    }

    // Se não tem audio_url válido, usar o primeiro MP3 disponível como fallback
    let audioUrl = '';
    if (song.audio_url && song.audio_url.trim() !== '') {
      audioUrl = buildHinoUrl({ id: song.id, audio_url: song.audio_url });
    } else {
      // Fallback: usar um MP3 real do servidor
      console.warn('⚠️ Hino sem audio_url, usando fallback');
      audioUrl = buildHinoUrl({
        id: song.id,
        audio_url: 'a-capelacantados-o-deus-bendito-www-canticosccb-com-br-1761280811.mp3'
      });
    }

    const coverUrlResolved = song.cover_url
      ? buildAlbumCoverUrl({ id: String(song.id), cover_url: song.cover_url })
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title)}&background=1f2937&color=ffffff`;

    const ytSrc = (song as any).youtube_source || undefined;
    play({
      id: song.id,
      title: song.title,
      number: song.number || 0,
      category: 'Hino',
      artist: composer?.name || 'Compositor',
      duration: formatDuration(song.duration),
      audioUrl: ytSrc ? '' : audioUrl,
      coverUrl: coverUrlResolved,
      lyrics: song.lyrics,
      isLiked: false,
      createdAt: song.created_at,
      youtubeSource: ytSrc,
    } as any);

    console.log('🎵 Tocando:', song.title, 'Audio URL:', audioUrl);
    openFullScreen();
  };

  return (
    <>
      <SEOHead
        title={`${composer.name} | Compositor CCB`}
        description={composer.bio || `Conheça ${composer.name}, compositor da CCB. Veja perfil público, hinos publicados, álbuns e acompanhe suas publicações.`}
        keywords={`${composer.name}, compositor ccb, hinos de ${composer.name}, compositor da congregação cristã`}
        canonical={buildCompositorUrl(composer.id, composer.name)}
        ogType="profile"
        ogImage={composer.avatar_url || composer.photo_url}
        schemaData={[
          generatePersonSchema({
            name: composer.name,
            url: buildCompositorUrl(composer.id, composer.name),
            image: composer.avatar_url || composer.photo_url,
            description: composer.bio || `Compositor da Congregação Cristã no Brasil`,
            jobTitle: 'Compositor',
          }),
          generateBreadcrumbSchema([
            { name: 'Início', url: '/' },
            { name: 'Compositores', url: '/compositores' },
            { name: composer.name, url: buildCompositorUrl(composer.id, composer.name) },
          ]),
        ]}
      />

      <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary pb-24">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary-900 to-background pt-20 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <img
                src={finalImage}
                alt={composer.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary-500/30"
              />

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-white">
                    {composer.name}
                  </h1>
                  {composer.is_trending && (
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Em Alta
                    </span>
                  )}
                </div>

                {composer.bio && (
                  <div className="mb-4 max-w-3xl">
                    <p
                      className={`text-gray-300 transition-all duration-300 ${!isBioExpanded ? 'line-clamp-3' : ''
                        }`}
                    >
                      {composer.bio}
                    </p>
                    {composer.bio.length > 200 && !isBioExpanded && (
                      <button
                        onClick={() => {
                          setActiveTab('sobre');
                          setIsBioExpanded(true);
                        }}
                        className="mt-2 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
                      >
                        Ler mais...
                      </button>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mb-6">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold text-white">
                      {formatFollowers(displayFollowersCount)}
                    </span>
                    <span>seguidores</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Music className="w-5 h-5" />
                    <span className="font-semibold text-white">{displaySongsCount}</span>
                    <span>hinos</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock className="w-5 h-5" />
                    <span>
                      Membro desde {new Date(composer.created_at).toLocaleDateString('pt-BR', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${isFollowing
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-primary-500 hover:bg-primary-600 text-black'
                      }`}
                  >
                    <Heart className={`w-5 h-5 ${isFollowing ? 'fill-current' : ''}`} />
                    {isFollowing ? 'Seguindo' : 'Seguir'}
                  </button>

                  <button
                    onClick={handleShare}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    Compartilhar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 mt-8">
          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-800 mb-8">
            <button
              onClick={() => setActiveTab('hinos')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${activeTab === 'hinos'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-white'
                }`}
            >
              Hinos
            </button>
            <button
              onClick={() => setActiveTab('albuns')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${activeTab === 'albuns'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-white'
                }`}
            >
              Álbuns
            </button>
            <button
              onClick={() => setActiveTab('sobre')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${activeTab === 'sobre'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-white'
                }`}
            >
              Sobre
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'hinos' && (
            <div>
              {songs.length > 0 ? (
                <div className="space-y-3">
                  {songs.map((song) => (
                    <div
                      key={song.id}
                      className="group bg-background-secondary/90 hover:bg-background-secondary rounded-2xl transition-colors"
                    >
                      <div
                        onClick={() => handlePlaySong(song)}
                        role="button"
                        tabIndex={0}
                        className="w-full text-left px-5 py-4"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={song.cover_url || DEFAULT_COVER_URL}
                            alt={song.title}
                            className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_COVER_URL; }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
                              {song.number ? `Hino ${song.number} - ${song.title}` : song.title}
                            </h3>
                            <p className="text-sm text-gray-400 truncate">
                              {composer?.name || 'Compositor'} · Cantados
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-400 tabular-nums">
                              {formatDuration(song.duration)}
                            </span>
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${currentTrack?.id === song.id && isPlaying
                                  ? 'bg-primary-500 text-black'
                                  : 'text-gray-400 group-hover:text-white'
                                }`}
                            >
                              {currentTrack?.id === song.id && isPlaying ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </div>
                            <button
                              type="button"
                              className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors text-gray-500 hover:text-primary-400"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedSongForPlaylist(song);
                                setShowPlaylistModal(true);
                              }}
                              title="Adicionar à playlist"
                            >
                              <ListPlus className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className={`hidden md:inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${user && isFavorite(parseInt(song.id))
                                  ? 'text-red-500 hover:text-red-400'
                                  : 'text-gray-500 hover:text-primary-400'
                                }`}
                              onClick={(event) => {
                                event.stopPropagation();

                                if (!user) {
                                  // Mostrar modal de informações com alerta de login
                                  setSelectedSong(song);
                                  setShowSongInfoModal(true);
                                  return;
                                }

                                const songId = parseInt(song.id);
                                const uid = user?.id ? Number(user.id) : undefined;
                                if (isFavorite(songId)) {
                                  removeFavorite(songId, uid);
                                } else {
                                  addFavorite({
                                    id: songId,
                                    title: song.title,
                                    artist: composer?.name || 'Compositor',
                                    album: 'Hinos CCB',
                                    duration: formatDuration(song.duration),
                                    coverUrl: song.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title)}&background=1f2937&color=ffffff`
                                  }, uid);

                                  // Enviar notificação para o compositor
                                  if (user && composer) {
                                    addNotification(createFavoriteNotification(
                                      user.email?.split('@')[0] || 'Usuário',
                                      'https://i.pravatar.cc/40',
                                      song.title,
                                      song.id
                                    ));
                                  }
                                }
                              }}
                              title={user ? 'Favoritar hino' : 'Faça login para favoritar'}
                            >
                              <Heart className={`w-4 h-4 ${user && isFavorite(parseInt(song.id)) ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Nenhum hino ainda
                  </h3>
                  <p className="text-gray-400">
                    Este compositor ainda não publicou nenhum hino.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'albuns' && (
            <div className="py-4">
              {loadingAlbums ? (
                <div className="text-center py-16">
                  <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white mt-4">Carregando álbuns...</p>
                </div>
              ) : albums.length === 0 ? (
                <div className="text-center py-16">
                  <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Nenhum álbum ainda</h3>
                  <p className="text-gray-400">Este compositor ainda não criou nenhum álbum.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {albums.map((album) => (
                    <div
                      key={album.id}
                      className="group bg-background-secondary/90 hover:bg-background-secondary rounded-2xl transition-colors"
                    >
                      <div
                        onClick={() => handleOpenAlbum(album)}
                        role="button"
                        tabIndex={0}
                        className="w-full text-left px-5 py-4"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={album.cover_url || DEFAULT_COVER_URL}
                            alt={album.title}
                            className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_COVER_URL; }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
                              {album.title}
                            </h3>
                            <p className="text-sm text-gray-400 truncate">
                              {composer?.name || 'Compositor'} · Álbum{album.year ? ` · ${album.year}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-400 tabular-nums">
                              {album.song_count || 0} {(album.song_count || 0) === 1 ? 'faixa' : 'faixas'}
                            </span>
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors text-gray-400 group-hover:text-white`}
                            >
                              <Play className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sobre' && (
            <div className="max-w-3xl py-8">
              <h3 className="text-2xl font-bold text-white mb-6">Sobre {composer.name}</h3>

              {composer.bio ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-300 mb-2">Biografia</h4>
                    <p className="text-gray-400 leading-relaxed whitespace-pre-line">
                      {composer.bio}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8 p-6 bg-gray-900/50 rounded-lg border border-gray-800">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Seguidores</p>
                      <p className="text-2xl font-bold text-white">{formatFollowers(displayFollowersCount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Membro desde</p>
                      <p className="text-lg font-semibold text-white">
                        {new Date(composer.created_at).toLocaleDateString('pt-BR', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">
                    Este compositor ainda não adicionou informações sobre si.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de Informações do Hino */}
        {showSongInfoModal && selectedSong && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background-secondary rounded-2xl p-6 w-full max-w-md border border-gray-700">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Informações</h3>
                <button
                  onClick={() => setShowSongInfoModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Song Info */}
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={selectedSong.cover_url || DEFAULT_COVER_URL}
                  alt={selectedSong.title}
                  className="w-16 h-16 rounded-lg object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_COVER_URL; }}
                />
                <div>
                  <h4 className="font-semibold text-white text-lg">
                    {selectedSong.number ? `Hino ${selectedSong.number} - ${selectedSong.title}` : selectedSong.title}
                  </h4>
                  <p className="text-gray-400">{composer?.name || 'Compositor'}</p>
                </div>
              </div>

              {/* Song Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Duração</span>
                  <span className="text-white font-medium">{formatDuration(selectedSong.duration)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Reproduções</span>
                  <span className="text-white font-medium">{selectedSong.plays.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">ID</span>
                  <span className="text-white font-medium text-xs">#{selectedSong.id}</span>
                </div>
              </div>

              {/* Login Alert */}
              {!user && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-yellow-500" />
                    <span className="text-yellow-500 font-medium">Login necessário</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Faça login para adicionar este hino aos seus favoritos e acessar outras funcionalidades.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!user ? (
                  <>
                    <button
                      onClick={() => {
                        setShowSongInfoModal(false);
                        navigate('/login');
                      }}
                      className="flex-1 bg-primary-500 hover:bg-primary-600 text-black font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => setShowSongInfoModal(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Sair
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowSongInfoModal(false)}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-black font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Fechar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Follow - Login necessário */}
        {showFollowModal && composer && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background-secondary rounded-2xl p-6 w-full max-w-md border border-gray-700">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Seguir Compositor</h3>
                <button
                  onClick={() => setShowFollowModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Composer Info */}
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={composer.avatar_url || composer.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(composer.name)}&size=400&background=1a1a1a&color=00D1FF`}
                  alt={composer.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-white text-lg">{composer.name}</h4>
                  <p className="text-gray-400">{formatFollowers(displayFollowersCount)} seguidores</p>
                </div>
              </div>

              {/* Login Alert */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-blue-500 font-medium">Login necessário</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Faça login para seguir {composer.name} e receber notificações sobre novos hinos e atualizações.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFollowModal(false);
                    navigate('/login');
                  }}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-black font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowFollowModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Adicionar à Playlist */}
        {showPlaylistModal && selectedSongForPlaylist && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPlaylistModal(false)}
          >
            <div
              className="bg-gradient-to-b from-[#124e2a] to-[#000201] rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Adicionar à Playlist
              </h3>
              <p className="text-gray-300 text-sm mb-6">
                {selectedSongForPlaylist.title}
              </p>

              {playlists.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Você ainda não tem playlists. Crie uma primeiro!
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => {
                        addTrackToPlaylist(playlist.id, {
                          id: parseInt(selectedSongForPlaylist.id),
                          title: selectedSongForPlaylist.title,
                          artist: composer?.name || 'Compositor',
                          duration: formatDuration(selectedSongForPlaylist.duration),
                          coverUrl: selectedSongForPlaylist.cover_url || ''
                        });
                        setShowPlaylistModal(false);
                        alert(`"${selectedSongForPlaylist.title}" adicionada à playlist "${playlist.name}"!`);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="w-12 h-12 rounded bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                        {playlist.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{playlist.name}</p>
                        <p className="text-gray-400 text-sm">{playlist.tracks.length} hinos</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowPlaylistModal(false)}
                className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
