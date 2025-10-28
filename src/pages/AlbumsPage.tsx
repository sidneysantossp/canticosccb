import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Play, Search, ArrowLeft, MoreVertical, Heart, Share2, ListPlus, Info } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
// import { getPublishedAlbums } from '@/lib/albumsApi';
import useFavoritesStore from '@/stores/favoritesStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useAuth } from '@/contexts/AuthContext';

interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  totalTracks: number;
  releaseYear: string;
}

const AlbumsPage: React.FC = () => {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const { play } = usePlayerStore();
  const { user } = useAuth();

  useEffect(() => {
    loadAlbums();
  }, []);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAlbums = async () => {
    setIsLoading(true);
    try {
      // Buscar álbuns publicados do banco de dados
      const albumsData = await getPublishedAlbums();

      // Converter para formato da interface
      const formattedAlbums: Album[] = albumsData.map(album => ({
        id: album.id,
        title: album.title,
        artist: album.artist,
        coverUrl: album.cover_url || 'https://picsum.photos/300/300',
        totalTracks: album.total_tracks,
        releaseYear: album.release_year?.toString() || new Date().getFullYear().toString()
      }));

      setAlbums(formattedAlbums);
    } catch (error) {
      console.error('Erro ao carregar álbuns:', error);
      setAlbums([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Funções de ação do menu
  const handlePlayAlbum = async (album: Album, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Buscar primeira faixa do álbum e reproduzir
    console.log('Reproduzir álbum:', album.title);
    setOpenMenuId(null);
    navigate(`/album/${album.id}`);
  };

  const handleToggleFavorite = (album: Album, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const albumId = parseInt(album.id);
    const uid = user?.id ? Number(user.id) : undefined;
    if (isFavorite(albumId)) {
      removeFavorite(albumId, uid);
    } else {
      addFavorite({
        id: albumId,
        title: album.title,
        artist: album.artist,
        album: album.title,
        duration: `${album.totalTracks} faixas`,
        coverUrl: album.coverUrl
      }, uid);
    }
    setOpenMenuId(null);
  };

  const handleShare = (album: Album, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = `${window.location.origin}/album/${album.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: album.title,
        text: `Confira o álbum "${album.title}" de ${album.artist}`,
        url: url
      }).catch(() => {
        // Fallback para copiar link
        navigator.clipboard.writeText(url);
        alert('Link copiado para a área de transferência!');
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copiado para a área de transferência!');
    }
    setOpenMenuId(null);
  };

  const handleAddToPlaylist = (album: Album, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Abrir modal de adicionar à playlist
    console.log('Adicionar à playlist:', album.title);
    setOpenMenuId(null);
  };

  const handleViewDetails = (album: Album, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    navigate(`/album/${album.id}`);
  };

  const filteredAlbums = albums.filter(album =>
    album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    album.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <SEOHead
        title="Álbuns - Cânticos CCB"
        description="Explore nossa coleção completa de álbuns de hinos da Congregação Cristã no Brasil"
        keywords="álbuns, hinários, CCB, coleções, hinos"
      />

      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary-900 to-background pt-6 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Botão Voltar */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-6 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Voltar</span>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-500 rounded-xl">
                <Music className="w-8 h-8 text-black" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Álbuns</h1>
                <p className="text-gray-300 mt-1">
                  Coleções especiais de hinos para edificação espiritual
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xl mt-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar álbuns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Albums Grid */}
        <div className="max-w-7xl mx-auto px-6 mt-8">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-800 aspect-square rounded-lg mb-4"></div>
                  <div className="bg-gray-800 h-4 rounded mb-2"></div>
                  <div className="bg-gray-800 h-3 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredAlbums.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-400">
                  {filteredAlbums.length} {filteredAlbums.length === 1 ? 'álbum encontrado' : 'álbuns encontrados'}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredAlbums.map((album) => (
                  <div key={album.id} className="relative">
                    <Link
                      to={`/album/${album.id}`}
                      className="group bg-background-secondary hover:bg-background-tertiary rounded-lg p-4 transition-all duration-300 hover:scale-105 cursor-pointer block"
                    >
                      {/* Cover */}
                      <div className="relative mb-4 aspect-square">
                        <img
                          src={album.coverUrl}
                          alt={album.title}
                          className="w-full h-full object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
                          loading="lazy"
                        />
                        
                        {/* Overlay com ícone de Play ao hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center shadow-xl">
                            <Play className="w-6 h-6 text-black fill-black ml-0.5" />
                          </div>
                        </div>

                        {/* Botão Menu (3 pontinhos) */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === album.id ? null : album.id);
                          }}
                          className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <MoreVertical className="w-4 h-4 text-white" />
                        </button>
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="font-semibold text-white mb-1 truncate group-hover:text-primary-400 transition-colors">
                          {album.title}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">
                          {album.artist}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {album.totalTracks} faixas • {album.releaseYear}
                        </p>
                      </div>
                    </Link>

                    {/* Dropdown Menu */}
                    {openMenuId === album.id && (
                      <div
                        ref={menuRef}
                        className="absolute top-16 right-4 bg-background-tertiary border border-gray-700 rounded-lg shadow-xl z-50 min-w-[200px] overflow-hidden"
                      >
                        <button
                          onClick={(e) => handlePlayAlbum(album, e)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                        >
                          <Play className="w-4 h-4 text-primary-500" />
                          <span className="text-white text-sm">Reproduzir</span>
                        </button>

                        <button
                          onClick={(e) => handleToggleFavorite(album, e)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                        >
                          <Heart 
                            className={`w-4 h-4 ${isFavorite(parseInt(album.id)) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
                          />
                          <span className="text-white text-sm">
                            {isFavorite(parseInt(album.id)) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                          </span>
                        </button>

                        <button
                          onClick={(e) => handleAddToPlaylist(album, e)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                        >
                          <ListPlus className="w-4 h-4 text-gray-400" />
                          <span className="text-white text-sm">Adicionar à playlist</span>
                        </button>

                        <button
                          onClick={(e) => handleShare(album, e)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                        >
                          <Share2 className="w-4 h-4 text-gray-400" />
                          <span className="text-white text-sm">Compartilhar</span>
                        </button>

                        <div className="border-t border-gray-700"></div>

                        <button
                          onClick={(e) => handleViewDetails(album, e)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                        >
                          <Info className="w-4 h-4 text-gray-400" />
                          <span className="text-white text-sm">Ver detalhes</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Nenhum álbum encontrado</p>
              <p className="text-gray-500 text-sm mt-2">
                Tente buscar por outro termo
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AlbumsPage;
