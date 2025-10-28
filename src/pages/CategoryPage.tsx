import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Heart, Music, ListPlus, Share2, Plus } from 'lucide-react';
import { buildAlbumCoverUrl } from '@/lib/media-helper';
import { apiFetch } from '@/lib/api-helper';
import { getAll as getAllCategories } from '@/lib/categoriesApi';
import { usePlayerStore } from '@/stores/playerStore';
import useFavoritesStore from '@/stores/favoritesStore';
import { usePlayerContext } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import AddToPlaylistModal from '@/components/modals/AddToPlaylistModal';
import SEOHead from '@/components/SEO/SEOHead';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  background_color: string;
  image_url?: string;
}

interface Song {
  id: string;
  title: string;
  number?: number;
  artist: string;
  duration: string;
  cover_url?: string;
  audio_url?: string;
  plays_count?: number;
}

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [bulkTracksForModal, setBulkTracksForModal] = useState<any[] | null>(null);

  const { play, pause, currentTrack, isPlaying } = usePlayerStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const { openFullScreen } = usePlayerContext();
  const { user } = useAuth();

  useEffect(() => {
    if (slug) {
      loadCategoryData();
    }
  }, [slug]);

  const loadCategoryData = async () => {
    try {
      setIsLoading(true);

      // 1) Resolver metadados da categoria pelo slug
      const all = await getAllCategories({ limit: 1000 });
      const found = (all || []).find((c: any) => String(c.slug).toLowerCase() === String(slug).toLowerCase());

      const toTitle = (s: string) => s.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      const resolvedName = found?.name || toTitle(String(slug));

      setCategory({
        id: String(found?.id || slug),
        name: resolvedName,
        slug: String(slug),
        description: found?.description,
        background_color: found?.background_color || '#6366f1',
        image_url: found?.image_url,
      });

      // 2) Buscar hinos dessa categoria no backend PHP
      const res = await apiFetch(`/api/hinos/index.php?categoria=${encodeURIComponent(resolvedName)}&ativo=1&limit=50`);
      if (!res.ok) throw new Error('Falha ao carregar hinos da categoria');
      const json = await res.json();
      const list = Array.isArray(json?.hinos) ? json.hinos : (Array.isArray(json) ? json : []);

      const formattedSongs: Song[] = list.map((h: any) => ({
        id: String(h.id),
        title: String(h.titulo || 'Hino'),
        number: h.numero != null ? Number(h.numero) : undefined,
        artist: String(h.compositor || 'Compositor Desconhecido'),
        duration: formatDuration(h.duracao),
        cover_url: h.cover_url || undefined,
        audio_url: h.audio_url || undefined,
        plays_count: h.plays_count != null ? Number(h.plays_count) : undefined,
      }));

      setSongs(formattedSongs);
    } catch (error) {
      console.error('Erro ao carregar categoria:', error);
      setSongs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToQueue = (song: Song) => {
    const track = resolveSongTrack(song);
    const { addToQueue } = (usePlayerStore as any).getState();
    addToQueue(track);
  };

  const resolveSongTrack = (song: Song) => {
    const coverUrl = song.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title)}&background=1f2937&color=ffffff`;
    let audioUrl = song.audio_url || '';
    if (!audioUrl) {
      // fallback simples: mantém vazio, o player deve lidar com ausência
      audioUrl = '';
    }
    return {
      id: song.id,
      title: song.title,
      number: song.number || 0,
      category: category?.name || 'Categoria',
      artist: song.artist || 'Compositor',
      duration: song.duration,
      audioUrl,
      coverUrl,
      lyrics: '',
      isLiked: false,
      createdAt: new Date().toISOString(),
    } as any;
  };

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    const tracks = songs.map(resolveSongTrack);
    const first = tracks[0];
    const { clearQueue, addToQueue, setRepeat } = (usePlayerStore as any).getState();
    clearQueue();
    setRepeat('all');
    tracks.slice(1).forEach((t: any) => addToQueue(t));
    play(first);
    openFullScreen();
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const title = category?.name || 'Categoria';
    const text = `Confira os hinos da categoria ${title}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // ignore cancel
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copiado!');
      } catch {}
    }
  };

  const formatDuration = (seconds: number | string | null): string => {
    if (!seconds) return '3:45';
    const num = typeof seconds === 'string' ? parseInt(seconds) : seconds;
    const mins = Math.floor(num / 60);
    const secs = num % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = (song: Song) => {
    const track = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      coverUrl: song.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title)}&background=1f2937&color=ffffff`,
      audioUrl: song.audio_url || '',
      number: song.number || 0,
      category: category?.name || 'Categoria',
      plays: song.plays_count || 0,
      isLiked: isFavorite(parseInt(song.id)),
      createdAt: new Date().toISOString()
    };

    if (currentTrack?.id === song.id && isPlaying) {
      pause();
    } else {
      play(track);
      openFullScreen();
    }
  };

  const handleToggleFavorite = (song: Song) => {
    const songId = parseInt(song.id);
    const uid = user?.id ? Number(user.id) : undefined;
    if (isFavorite(songId)) {
      removeFavorite(songId, uid);
    } else {
      addFavorite({
        id: songId,
        title: song.title,
        artist: song.artist,
        album: category?.name || 'Categoria',
        duration: song.duration,
        coverUrl: song.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title)}&background=1f2937&color=ffffff`
      }, uid);
    }
  };

  const handleAddToPlaylist = (song: Song) => {
    setSelectedTrack({
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      coverUrl: song.cover_url
    });
    setBulkTracksForModal(null);
    setShowPlaylistModal(true);
  };

  const handleAddCategoryToPlaylist = () => {
    if (songs.length === 0) return;
    const tracks = songs.map((song) => ({
      id: song.id,
      title: song.number ? `Hino ${song.number} - ${song.title}` : song.title,
      artist: song.artist,
      duration: song.duration,
      coverUrl: song.cover_url,
    }));
    setSelectedTrack(null);
    setBulkTracksForModal(tracks);
    setShowPlaylistModal(true);
  };

  if (isLoading) {
  return (
      <div className="min-h-screen bg-background-primary pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-8 w-32 bg-gray-800 rounded animate-pulse mb-6"></div>
          <div className="h-12 w-64 bg-gray-800 rounded animate-pulse mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-800 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background-primary pt-20 pb-24 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Categoria não encontrada</h2>
          <p className="text-gray-400 mb-6">Esta categoria não existe ou foi removida.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-black font-bold rounded-full hover:bg-primary-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Home
          </Link>
        </div>
      </div>
    );
  }

  const categoryImage = buildAlbumCoverUrl({ id: String(category.id), cover_url: category.image_url });

  return (
    <>
      <SEOHead
        title={`${category.name} - Cânticos CCB`}
        description={category.description || `Explore hinos da categoria ${category.name}`}
      />

      <div className="min-h-screen bg-background-primary">
        <div className="text-white bg-gradient-to-b from-green-700 to-transparent pt-20 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <img
                src={categoryImage}
                alt={category.name}
                className="w-56 h-56 md:w-56 md:h-56 object-cover ring-4 ring-primary-500/30 rounded-md mx-auto md:mx-0"
              />
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight text-center md:text-left">{category.name}</h1>
                {category.description && (
                  <p className="text-white/90 mt-1 max-w-2xl text-base text-center md:text-left">{category.description}</p>
                )}
                <div className="flex items-center justify-center md:justify-start gap-6 text-white/80 mt-3">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    <span className="font-semibold text-white">{songs.length}</span>
                    <span>{songs.length === 1 ? 'hino' : 'hinos'}</span>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3 w-full max-w-xl justify-center md:justify-start">
                  <button
                    onClick={handlePlayAll}
                    aria-label="Reproduzir categoria"
                    className="h-9 w-9 rounded-full bg-primary-500 hover:bg-primary-600 text-black font-semibold transition-colors flex items-center justify-center"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleAddCategoryToPlaylist}
                    className="h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ListPlus className="w-4 h-4" />
                    Adicionar à playlist
                  </button>
                  <button
                    onClick={handleShare}
                    aria-label="Compartilhar"
                    className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center justify-center"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-24">
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Hinos dessa Categoria</h2>

          {songs.length === 0 ? (
            <div className="text-center py-16">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nenhum hino encontrado</h3>
              <p className="text-gray-400">Esta categoria ainda não possui hinos cadastrados.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {songs.map((song, index) => (
                <div
                  key={song.id}
                  className="group bg-background-secondary hover:bg-background-tertiary rounded-lg p-4 transition-colors flex items-center gap-4"
                >
                  {/* Cover with Play Overlay */}
                  <button
                    onClick={() => handlePlayPause(song)}
                    aria-label={currentTrack?.id === song.id && isPlaying ? 'Pausar' : 'Reproduzir'}
                    className="relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden"
                  >
                    <img
                      src={buildAlbumCoverUrl({ id: String(song.id), cover_url: song.cover_url })}
                      alt={song.title}
                      className="w-12 h-12 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      {currentTrack?.id === song.id && isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </button>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate group-hover:text-primary-400 transition-colors">
                      {song.number && `${song.number} - `}{song.title}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                  </div>

                  {/* Duration */}
                  <span className="ml-auto text-gray-400 text-sm w-12 text-right">
                    {song.duration}
                  </span>

                  {/* Actions (hidden on mobile) */}
                  <div className="hidden md:flex items-center gap-3">
                    <button
                      onClick={() => handleAddToQueue(song)}
                      className="p-2 hover:bg-white/10 rounded-full transition-all"
                      title="Adicionar à fila"
                    >
                      <Plus className="w-5 h-5 text-gray-400 hover:text-primary-400" />
                    </button>
                    <button
                      onClick={() => handleAddToPlaylist(song)}
                      className="p-2 hover:bg-white/10 rounded-full transition-all"
                      title="Adicionar à playlist"
                    >
                      <ListPlus className="w-5 h-5 text-gray-400 hover:text-primary-400" />
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(song)}
                      className={`p-2 hover:bg-white/10 rounded-full transition-all`}
                      title={isFavorite(parseInt(song.id)) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <Heart className={`w-5 h-5 ${
                        isFavorite(parseInt(song.id)) 
                          ? 'text-red-500 fill-red-500' 
                          : 'text-gray-400 hover:text-red-500'
                      }`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => {
          setShowPlaylistModal(false);
          setSelectedTrack(null);
          setBulkTracksForModal(null);
        }}
        track={selectedTrack}
        bulkTracks={bulkTracksForModal || undefined}
      />
    </>
  );
};

export default CategoryPage;
