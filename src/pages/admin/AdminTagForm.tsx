import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Hash } from 'lucide-react';
import {
  getTagById,
  createTag,
  updateTag,
  generateSlug,
  CreateTagData
} from '@/lib/admin/tagsAdminApi';

const AdminTagForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadTag(id);
    }
  }, [id, isEditing]);

  const loadTag = async (tagId: string) => {
    try {
      setIsLoading(true);
      const tag = await getTagById(tagId);

      if (tag) {
        setFormData({
          name: tag.name,
          slug: tag.slug
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar tag:', error);
      setError(error?.message || 'Erro ao carregar tag');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    setFormData({
      name,
      slug: generateSlug(name)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      setError('Nome e slug são obrigatórios');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const tagData: CreateTagData = {
        name: formData.name.trim(),
        slug: formData.slug.trim()
      };

      if (isEditing && id) {
        await updateTag(id, tagData);
      } else {
        await createTag(tagData);
      }

      navigate('/admin/tags');
    } catch (error: any) {
      console.error('Erro ao salvar tag:', error);
      setError(error?.message || 'Erro ao salvar tag');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando tag...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin/tags"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEditing ? 'Editar Tag' : 'Nova Tag'}
            </h1>
            <p className="text-gray-400 mt-1">Organize e classifique seu conteúdo com tags</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações da Tag */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Hash className="w-5 h-5" />
              Informações da Tag
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Nome da Tag *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Ex: Adoração, Família, Natal..."
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Slug (URL amigável)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="adoracao"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Gerado automaticamente a partir do nome
                </p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 sticky bottom-6 bg-gray-950/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <Link
              to="/admin/tags"
              className="flex-1 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Tag'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminTagForm;
