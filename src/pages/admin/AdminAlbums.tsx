import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Disc } from 'lucide-react';
import { albunsApi, Album } from '@/lib/api-client';

const AdminAlbums: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [currentPage]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await albunsApi.list({ page: currentPage, limit: 12 });
      
      console.log('📦 Response albums:', response);
      
      if (response.error) {
        setError(response.error);
        setAlbums([]);
        return;
      }
      
      if (response.data) {
        const albumsData = response.data.albuns || response.data.data || response.data;
        
        if (Array.isArray(albumsData)) {
          setAlbums(albumsData);
        } else {
          console.error('Dados de álbuns não são um array:', albumsData);
          setAlbums([]);
        }
        
        setTotalPages(response.data.pages || 1);
        setTotalCount(response.data.total || 0);
      } else {
        setAlbums([]);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error?.message || 'Erro ao carregar dados');
      setAlbums([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${title}"?`)) return;

    try {
      await albunsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting album:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando álbuns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Álbuns</h1>
          <p className="text-gray-400 mt-1">{totalCount} álbuns cadastrados</p>
        </div>
        <Link
          to="/admin/albuns/criar"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Álbum
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {albums.map((album) => (
          <div
            key={album.id}
            className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group"
          >
            <div className="relative aspect-square">
              <img
                src={album.cover_url || 'https://via.placeholder.com/300x300?text=Sem+Capa'}
                alt={album.title || album.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  to={`/admin/albuns/editar/${album.id}`}
                  className="p-2 rounded-lg bg-blue-500/90 text-white hover:bg-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(album.id, album.title || album.titulo)}
                  className="p-2 rounded-lg bg-red-500/90 text-white hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-white font-bold text-lg mb-1 truncate">{album.title || album.titulo}</h3>
              <p className="text-gray-400 text-sm truncate">
                {album.artist || 'Sem artista'}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {album.genre && <span>{album.genre} • </span>}
                {album.total_tracks || 0} músicas
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {albums.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Disc className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">Nenhum álbum encontrado</p>
          <p className="text-gray-500 text-sm">Adicione o primeiro álbum</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Anterior
          </button>
          <span className="text-gray-400">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminAlbums;
