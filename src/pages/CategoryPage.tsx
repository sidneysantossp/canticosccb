import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Heart, Music, ListPlus, Share2, Plus, Search, X } from 'lucide-react';
import { buildAlbumCoverUrl } from '@/lib/media-helper';
import { supabaseFetch, isSupabaseConfigured } from '@/lib/supabaseRest';
import { getAll as getAllCategories } from '@/lib/categoriesApi';
import { usePlayerStore } from '@/stores/playerStore';
import useFavoritesStore from '@/stores/favoritesStore';
import { usePlayerContext } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import AddToPlaylistModal from '@/components/modals/AddToPlaylistModal';
import LoginRequiredModal from '@/components/modals/LoginRequiredModal';
import SEOHead from '@/components/SEO/SEOHead';
import { generateBreadcrumbSchema, generateItemListSchema } from '@/utils/schemaGenerator';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  background_color: string;
  image_url?: string;
  meta_title?: string;
  meta_description?: string;
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
  const [filterNumber, setFilterNumber] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterComposer, setFilterComposer] = useState('');
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
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
        meta_title: found?.meta_title,
        meta_description: found?.meta_description,
      });

      // 2) Buscar hinos dessa categoria no Supabase
      if (!isSupabaseConfigured) {
        setSongs([]);
        return;
      }

      // Buscar via hino_categorias (múltiplas categorias) + fallback coluna única
      let hinoIds: string[] = [];
      try {
        // Buscar o ID da categoria pelo nome
        const cats = await supabaseFetch<any>('categorias', {
          nome: `ilike.%${resolvedName}%`,
          select: 'id',
          limit: '5',
        });
        if (cats.length > 0) {
          const catIds = cats.map((c: any) => String(c.id));
          // Buscar hino_ids relacionados
          const rels = await supabaseFetch<any>('hino_categorias', {
            categoria_id: `in.(${catIds.join(',')})`,
            select: 'hino_id',
          });
          hinoIds = rels.map((r: any) => String(r.hino_id));
        }
      } catch (e) {
        console.warn('hino_categorias lookup failed, using fallback:', e);
      }

      let list: any[] = [];
      if (hinoIds.length > 0) {
        // Buscar hinos pelos IDs encontrados via hino_categorias
        list = await supabaseFetch<any>('hinos', {
          id: `in.(${hinoIds.join(',')})`,
          ativo: 'eq.true',
          select: 'id,numero,titulo,compositor_nome,categoria,cover_url,audio_url,duracao,plays_count,youtube_source',
          order: 'created_at.desc',
          limit: '50',
        });
      }

      // Fallback: buscar pela coluna categoria única (para hinos sem hino_categorias)
      const fallbackList = await supabaseFetch<any>('hinos', {
        categoria: `ilike.%${resolvedName}%`,
        ativo: 'eq.true',
        select: 'id,numero,titulo,compositor_nome,categoria,cover_url,audio_url,duracao,plays_count,youtube_source',
        limit: '50',
      });

      // Mesclar sem duplicatas
      const seenIds = new Set(list.map((h: any) => String(h.id)));
      for (const h of fallbackList) {
        if (!seenIds.has(String(h.id))) {
          list.push(h);
          seenIds.add(String(h.id));
        }
      }

      const formattedSongs: Song[] = list.map((h: any) => ({
        id: String(h.id),
        title: String(h.titulo || 'Hino'),
        number: h.numero != null ? Number(h.numero) : undefined,
        artist: String(h.compositor_nome || 'Compositor Desconhecido'),
        duration: formatDuration(h.duracao),
        cover_url: h.cover_url || undefined,
        audio_url: h.audio_url || undefined,
        plays_count: h.plays_count != null ? Number(h.plays_count) : undefined,
        youtube_source: h.youtube_source || undefined,
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
    if (!user) { setShowLoginModal(true); return; }
    const track = resolveSongTrack(song);
    const { addToQueue } = (usePlayerStore as any).getState();
    addToQueue(track);
  };

  const resolveSongTrack = (song: Song) => {
    const coverUrl = song.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title)}&background=1f2937&color=ffffff`;
    const ytSource = (song as any).youtube_source || undefined;
    let audioUrl = ytSource ? '' : (song.audio_url || '');
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
      youtubeSource: ytSource,
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
    const ytSource = (song as any).youtube_source || undefined;
    const track = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      coverUrl: song.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title)}&background=1f2937&color=ffffff`,
      audioUrl: ytSource ? '' : (song.audio_url || ''),
      number: song.number || 0,
      category: category?.name || 'Categoria',
      plays: song.plays_count || 0,
      isLiked: isFavorite(parseInt(song.id)),
      createdAt: new Date().toISOString(),
      youtubeSource: ytSource,
    };

    if (currentTrack?.id === song.id && isPlaying) {
      pause();
    } else {
      play(track);
      openFullScreen();
    }
  };

  const handleToggleFavorite = (song: Song) => {
    if (!user) { setShowLoginModal(true); return; }
    const songId = parseInt(song.id);
    const uid = user?.id ? Number(user.id) : undefined;
    const isFav = isFavorite(songId);
    
    if (isFav) {
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
    if (!user) { setShowLoginModal(true); return; }
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
    if (!user) { setShowLoginModal(true); return; }
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

  // Filtrar hinos por número, nome e compositor (client-side)
  const filteredSongs = songs.filter((song) => {
    if (filterNumber) {
      const num = String(song.number || '');
      if (!num.includes(filterNumber.trim())) return false;
    }
    if (filterName) {
      const name = song.title.toLowerCase();
      if (!name.includes(filterName.toLowerCase().trim())) return false;
    }
    if (filterComposer) {
      const artist = song.artist.toLowerCase();
      if (!artist.includes(filterComposer.toLowerCase().trim())) return false;
    }
    return true;
  });

  const categoryImage = category.image_url || `https://picsum.photos/seed/category-${category.id}/400/400`;

  return (
    <>
      <SEOHead
        title={category.meta_title || `${category.name} - Cânticos CCB`}
        description={category.meta_description || category.description || `Explore hinos da categoria ${category.name} na Cânticos CCB`}
        keywords={`${category.name}, hinos, CCB, congregação cristã, ${category.slug}`}
        canonical={`/categoria/${slug}`}
        ogImage={category.image_url}
        schemaData={[
          generateBreadcrumbSchema([
            { name: 'Início', url: '/' },
            { name: 'Categorias', url: '/categories' },
            { name: category.name, url: `/categoria/${slug}` },
          ]),
        ]}
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
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://picsum.photos/seed/category-fallback-${category.id}/400/400`; }}
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

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={filterNumber}
                onChange={(e) => setFilterNumber(e.target.value)}
                placeholder="Número do hino"
                className="w-full pl-10 pr-9 py-2.5 bg-background-secondary border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {filterNumber && (
                <button onClick={() => setFilterNumber('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Nome do hino"
                className="w-full pl-10 pr-9 py-2.5 bg-background-secondary border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {filterName && (
                <button onClick={() => setFilterName('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={filterComposer}
                onChange={(e) => setFilterComposer(e.target.value)}
                placeholder="Compositor"
                className="w-full pl-10 pr-9 py-2.5 bg-background-secondary border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {filterComposer && (
                <button onClick={() => setFilterComposer('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {filteredSongs.length === 0 && songs.length > 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">Nenhum resultado</h3>
              <p className="text-gray-400 text-sm">Tente ajustar os filtros de busca.</p>
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center py-16">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nenhum hino encontrado</h3>
              <p className="text-gray-400">Esta categoria ainda não possui hinos cadastrados.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSongs.map((song, index) => (
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
                      title={user ? 'Adicionar à fila' : 'Faça login para adicionar à fila'}
                    >
                      <Plus className="w-5 h-5 text-gray-400 hover:text-primary-400" />
                    </button>
                    <button
                      onClick={() => handleAddToPlaylist(song)}
                      className="p-2 hover:bg-white/10 rounded-full transition-all"
                      title={user ? 'Adicionar à playlist' : 'Faça login para adicionar à playlist'}
                    >
                      <ListPlus className="w-5 h-5 text-gray-400 hover:text-primary-400" />
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(song)}
                      className={`p-2 hover:bg-white/10 rounded-full transition-all`}
                      title={user ? (isFavorite(parseInt(song.id)) ? 'Remover dos favoritos' : 'Adicionar aos favoritos') : 'Faça login para favoritar'}
                    >
                      <Heart className={`w-5 h-5 ${
                        user && isFavorite(parseInt(song.id)) 
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

      {/* Login Required Modal */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Login Necessário"
        message="Você precisa estar logado para realizar esta ação"
      />

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
