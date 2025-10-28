import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Hash } from 'lucide-react';
import {
  getAllTags,
  deleteTag,
  Tag
} from '@/lib/admin/tagsAdminApi';

const AdminTags: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllTags();
      setTags(data);
    } catch (error: any) {
      console.error('Error loading tags:', error);
      setError(error?.message || 'Erro ao carregar tags');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar a tag "${name}"?`)) return;

    try {
      await deleteTag(id);
      loadTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Erro ao deletar tag');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando tags...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar tags</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadTags}
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
          <h1 className="text-3xl font-bold text-white mb-2">Tags</h1>
          <p className="text-gray-400">Total: {tags.length} tags</p>
        </div>
        <Link
          to="/admin/tags/criar"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Tag
        </Link>
      </div>

      {/* Grid de Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Hash className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{tag.name}</h3>
                  <p className="text-gray-500 text-xs">/{tag.slug}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link
                to={`/admin/tags/editar/${tag.id}`}
                className="flex-1 p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-colors text-center text-sm font-medium"
              >
                <Edit className="w-4 h-4 mx-auto" />
              </Link>
              <button
                onClick={() => handleDelete(tag.id, tag.name)}
                className="flex-1 p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors text-center text-sm font-medium"
              >
                <Trash2 className="w-4 h-4 mx-auto" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {tags.length === 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <Hash className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">Nenhuma tag encontrada</p>
          <p className="text-gray-500 text-sm mb-4">Crie a primeira tag para organizar seu conteúdo</p>
          <Link
            to="/admin/tags/criar"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Criar Tag
          </Link>
        </div>
      )}
    </div>
  );
};

export default AdminTags;
