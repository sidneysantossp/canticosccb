import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Layers, Eye, EyeOff } from 'lucide-react';
import { albunsApi, Album } from '@/lib/api-client';

const AdminCollections: React.FC = () => {
  const [collections, setCollections] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadCollections();
  }, [currentPage]);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await albunsApi.list({ page: currentPage, limit: 12 });
      
      if (response.error) {
        setError(response.error);
        setCollections([]);
        return;
      }
      
      if (response.data) {
        const albumsData = response.data.albuns || response.data.data || response.data;
        
        if (Array.isArray(albumsData)) {
          // Filtrar apenas coleções (tipo = 'coletanea')
          const collectionsOnly = albumsData.filter((item: any) => item.tipo === 'coletanea');
          setCollections(collectionsOnly);
        } else {
          setCollections([]);
        }
        
        setTotalPages(response.data.pages || 1);
        setTotalCount(response.data.total || 0);
      } else {
        setCollections([]);
      }
    } catch (error: any) {
      console.error('Error loading collections:', error);
      setError(error?.message || 'Erro ao carregar coleções');
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${title}"?`)) return;

    try {
      await albunsApi.delete(id);
      loadCollections();
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  };

  const handleTogglePublished = async (id: number, currentStatus: number) => {
    try {
      await albunsApi.update(id, { ativo: currentStatus ? 0 : 1 });
      loadCollections();
    } catch (error) {
      console.error('Error toggling published:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando coleções...</p>
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
          <h1 className="text-3xl font-bold text-white">Coleções</h1>
          <p className="text-gray-400 mt-1">{totalCount} coleções cadastradas</p>
        </div>
        <Link
          to="/admin/collections/criar"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Coleção
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group"
          >
            <div className="relative aspect-square">
              <img
                src={collection.cover_url || 'https://via.placeholder.com/300x300?text=Sem+Capa'}
                alt={collection.title || collection.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleTogglePublished(collection.id, collection.ativo)}
                  className={`p-2 rounded-lg text-white transition-colors ${
                    collection.ativo 
                      ? 'bg-green-500/90 hover:bg-green-600' 
                      : 'bg-gray-500/90 hover:bg-gray-600'
                  }`}
                  title={collection.ativo ? 'Publicado' : 'Rascunho'}
                >
                  {collection.ativo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <Link
                  to={`/admin/collections/editar/${collection.id}`}
                  className="p-2 rounded-lg bg-blue-500/90 text-white hover:bg-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(collection.id, collection.title || collection.titulo)}
                  className="p-2 rounded-lg bg-red-500/90 text-white hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-white font-bold text-lg mb-1 truncate">
                {collection.title || collection.titulo}
              </h3>
              <p className="text-gray-400 text-sm line-clamp-2">
                {collection.description || collection.descricao || 'Sem descrição'}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                {collection.total_tracks || 0} hinos
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {collections.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Layers className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">Nenhuma coleção encontrada</p>
          <p className="text-gray-500 text-sm">Adicione a primeira coleção</p>
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

export default AdminCollections;
