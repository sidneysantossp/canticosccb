import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, Disc, Edit, Calendar, User, Tag } from 'lucide-react';
import { Album, approveAlbum, getPendingAlbums } from '@/lib/admin/albumsAdminApi';

const PAGE_SIZE = 12;

const AdminAlbumsPending: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    void loadAlbums();
  }, [currentPage]);

  const loadAlbums = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getPendingAlbums(currentPage, PAGE_SIZE);
      setAlbums(result.data);
      setTotalCount(result.count);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      console.error('Erro ao carregar álbuns pendentes:', err);
      setError(err?.message || 'Erro ao carregar álbuns pendentes');
      setAlbums([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (albumId: string, title: string) => {
    if (!window.confirm(`Publicar "${title}" agora?`)) return;

    try {
      await approveAlbum(albumId);
      await loadAlbums();
    } catch (err: any) {
      console.error('Erro ao aprovar álbum:', err);
      window.alert(err?.message || 'Não foi possível publicar o álbum.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando álbuns pendentes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar álbuns pendentes</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button onClick={loadAlbums} className="btn-primary">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Álbuns Pendentes</h1>
          <p className="text-gray-400">{totalCount} álbuns aguardando publicação</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 font-semibold rounded-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {totalCount} Pendentes
          </span>
          <Link
            to="/admin/albums"
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
          >
            Ver todos os álbuns
          </Link>
        </div>
      </div>

      {albums.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <Disc className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-300 text-lg mb-2">Nenhum álbum pendente</p>
          <p className="text-gray-500 text-sm">Todos os álbuns já foram publicados ou ainda não há rascunhos para revisar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-yellow-600/50 transition-colors"
            >
              <div className="p-5 flex gap-5">
                <img
                  src={album.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(album.title || 'A')}&background=1f2937&color=9ca3af&size=240`}
                  alt={album.title}
                  className="w-28 h-28 rounded-xl object-cover flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h2 className="text-white text-xl font-bold truncate">{album.title}</h2>
                    <span className="px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 text-xs font-semibold border border-yellow-500/30">
                      Rascunho
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{album.artist || 'Sem artista informado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <span>{album.genre || 'Sem categorias'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>
                        Criado em {album.created_at ? new Date(album.created_at).toLocaleDateString('pt-BR') : 'data indisponível'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>{album.total_tracks || 0} faixa(s)</span>
                    <span>Status público: oculto</span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => handleApprove(album.id, album.title)}
                      className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Publicar Álbum
                    </button>
                    <Link
                      to={`/admin/albuns/editar/${album.id}`}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Revisar / Editar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((current) => current - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Anterior
          </button>
          <span className="text-gray-400">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((current) => current + 1)}
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

export default AdminAlbumsPending;
