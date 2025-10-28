import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Music } from 'lucide-react';
import {
  getAllGenres,
  deleteGenre,
  Genre
} from '@/lib/admin/genresAdminApi';

const AdminGenres: React.FC = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllGenres();
      setGenres(data);
    } catch (error: any) {
      console.error('Error loading genres:', error);
      setError(error?.message || 'Erro ao carregar gêneros');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar o gênero "${name}"?`)) return;

    try {
      await deleteGenre(id);
      loadGenres();
    } catch (error) {
      console.error('Error deleting genre:', error);
      alert('Erro ao deletar gênero');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando gêneros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar gêneros</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadGenres}
            className="btn-primary"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gêneros Musicais</h1>
          <p className="text-gray-400">Total: {genres.length} gêneros</p>
        </div>
        <Link
          to="/admin/genres/criar"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Gênero
        </Link>
      </div>

      {/* Tabela */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-gray-400 text-sm font-semibold">Nome</th>
              <th className="px-6 py-3 text-left text-gray-400 text-sm font-semibold">Descrição</th>
              <th className="px-6 py-3 text-right text-gray-400 text-sm font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {genres.map((genre) => (
              <tr key={genre.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Music className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="text-white font-medium">{genre.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-400 text-sm line-clamp-2">
                    {genre.description || '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/admin/genres/editar/${genre.id}`}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(genre.id, genre.name)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {genres.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">Nenhum gênero encontrado</p>
            <p className="text-gray-500 text-sm mb-4">Adicione o primeiro gênero musical</p>
            <Link
              to="/admin/genres/criar"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Criar Gênero
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGenres;
