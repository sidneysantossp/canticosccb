import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Grid } from 'lucide-react';
import { categoriasApi, uploadApi } from '@/lib/api-client';

const COLORS = [
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#f59e0b', label: 'Laranja' },
  { value: '#eab308', label: 'Amarelo' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#6b7280', label: 'Cinza' }
];

const AdminCategoryForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    descricao: '',
    cor: '#3b82f6',
    imagem_url: '',
    ativo: 1
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      loadCategory(parseInt(id));
    }
  }, [id, isEditing]);

  const loadCategory = async (categoryId: number) => {
    try {
      setIsLoading(true);
      const response = await categoriasApi.get(categoryId);

      if (response.data) {
        const category = response.data;
        setFormData({
          nome: category.nome,
          slug: category.slug,
          descricao: category.descricao || '',
          cor: '#3b82f6',
          imagem_url: category.imagem_url || '',
          ativo: category.ativo
        });
        setImagePreview(category.imagem_url || '');
      }
    } catch (error: any) {
      console.error('Erro ao carregar categoria:', error);
      setError(error?.message || 'Erro ao carregar categoria');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (nome: string) => {
    setFormData({
      ...formData,
      nome,
      slug: generateSlug(nome)
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const response = await uploadApi.cover(file);
      if (response.data) {
        return response.data.url;
      }
      return null;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      let imagemUrl = formData.imagem_url;

      // Upload de imagem se houver
      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        if (uploaded) imagemUrl = uploaded;
      }

      const categoryData = {
        nome: formData.nome.trim(),
        slug: formData.slug.trim(),
        descricao: formData.descricao.trim() || undefined,
        imagem_url: imagemUrl || undefined,
        ativo: formData.ativo
      };

      let response;
      if (isEditing && id) {
        response = await categoriasApi.update(parseInt(id), categoryData);
      } else {
        response = await categoriasApi.create(categoryData);
      }

      if (response.error) {
        throw new Error(response.error);
      }

      navigate('/admin/categories');
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      setError(error?.message || 'Erro ao salvar categoria');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando categoria...</p>
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
            to="/admin/categories"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
            </h1>
            <p className="text-gray-400 mt-1">Organize seus conteúdos por categorias temáticas</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Grid className="w-5 h-5" />
              Informações da Categoria
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Ex: Louvor e Adoração"
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="louvor-e-adoracao"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Gerado automaticamente a partir do nome
                </p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-green-600"
                  placeholder="Descreva brevemente esta categoria..."
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Status
                </label>
                <select
                  value={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                >
                  <option value="1">Ativo</option>
                  <option value="0">Inativo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Imagem da Categoria */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Imagem da Categoria</h2>
            
            <div className="space-y-4">
              {imagePreview && (
                <div>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-md rounded-lg shadow-lg"
                  />
                </div>
              )}

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative ${dragActive ? 'border-green-600' : 'border-gray-700'}`}
              >
                <label className="flex flex-col items-center justify-center h-48 bg-gray-800/50 border-2 border-dashed rounded-lg cursor-pointer hover:border-green-600 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-gray-400 text-sm">
                    {imageFile ? imageFile.name : 'Arraste uma imagem ou clique para selecionar'}
                  </span>
                  <span className="text-gray-500 text-xs mt-1">
                    PNG, JPG ou JPEG (máx. 10MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 sticky bottom-6 bg-gray-950/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <Link
              to="/admin/categories"
              className="flex-1 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isSaving || isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{isUploading ? 'Enviando...' : 'Salvando...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Categoria'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCategoryForm;
