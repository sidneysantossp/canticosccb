import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, AlertTriangle } from 'lucide-react';
import { usuariosApi, uploadApi, type Usuario } from '@/lib/api-client';
import { buildAvatarUrl } from '@/lib/media-helper';

const AdminUserEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    avatar_url: '',
    tipo: 'usuario' as 'usuario' | 'compositor' | 'admin',
    ativo: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const decodedId = decodeURIComponent(id);
      console.log('Loading user with ID:', decodedId);
      loadUser(decodedId);
    }
  }, [id]);

  const loadUser = async (userId: string) => {
    try {
      setIsLoading(true);
      setLoadError(null);
      console.log('Fetching user:', userId);
      const response = await usuariosApi.get(parseInt(userId));
      console.log('User fetched:', response);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        const user = response.data;
        setFormData({
          nome: user.nome || '',
          email: user.email || '',
          avatar_url: user.avatar_url || '',
          tipo: (user.tipo as 'usuario' | 'compositor' | 'admin') || 'usuario',
          ativo: user.ativo === 1,
        });
      } else {
        const msg = 'Usuário não encontrado';
        setLoadError(msg);
        setTimeout(() => navigate('/admin/users'), 2000);
      }
    } catch (error: any) {
      console.error('Error loading user:', error);
      const msg = error?.message || 'Erro ao carregar usuário';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.nome || !formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !id) return;

    try {
      setIsSaving(true);
      
      // Preparar dados para update
      const updates = {
        nome: formData.nome,
        email: formData.email,
        avatar_url: formData.avatar_url || undefined,
        tipo: formData.tipo,
        ativo: formData.ativo ? 1 : 0,
      };

      console.log('Updating user with:', updates);
      const response = await usuariosApi.update(parseInt(id), updates);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      console.log('User updated successfully');
      navigate('/admin/users');
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      console.error('Arquivo inválido: selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      console.error('Arquivo muito grande: a imagem deve ter no máximo 5MB');
      return;
    }

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      // Upload usando API PHP
      const uploadResponse = await uploadApi.avatar(file);
      
      if (uploadResponse.error || !uploadResponse.data) {
        throw new Error(uploadResponse.error || 'Erro no upload');
      }

      const { url } = uploadResponse.data;
      console.log('Upload successful! URL:', url);
      
      // Atualizar o estado com a nova URL
      setFormData(prev => ({ 
        ...prev, 
        avatar_url: url 
      }));

      // Persistir imediatamente no banco
      try {
        if (id) {
          console.log('Persisting avatar_url immediately for user:', id, url);
          await usuariosApi.update(parseInt(id), { avatar_url: url });
        }
      } catch (persistErr) {
        console.warn('Could not persist avatar immediately, will rely on Save button.', persistErr);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando usuário...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6 bg-gray-950 min-h-screen">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center max-w-md mx-auto">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar usuário</h2>
          <p className="text-red-300 mb-4">{loadError}</p>
          <button
            onClick={() => navigate('/admin/users')}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Voltar para Usuários
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-white">Editar Usuário</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Informações</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome Completo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-800 border ${
                    errors.nome ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all`}
                  placeholder="João Silva"
                  disabled={isSaving}
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-red-400">{errors.nome}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-4 py-3 bg-gray-800 border ${
                  errors.email ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all`}
                placeholder="joao@email.com"
                disabled={isSaving}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Avatar */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Avatar</h2>

            {/* Preview do Avatar */}
            <div className="mb-4 flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
              <div className="relative">
                <img
                  key={formData.avatar_url} // Force re-render on URL change
                  src={
                    formData.avatar_url
                      ? (() => {
                          const normalized = buildAvatarUrl({
                            id: String(id || ''),
                            avatar_url: formData.avatar_url,
                            name: formData.nome || 'User'
                          });
                          return `${normalized}${normalized.includes('?') ? '&' : '?'}v=${Date.now()}`;
                        })()
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.nome || 'User')}&background=random`
                  }
                  alt="Avatar preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary-500"
                  style={{
                    maxWidth: '80px',
                    maxHeight: '80px'
                  }}
                  onError={(e) => {
                    console.error('Failed to load image:', formData.avatar_url);
                    console.error('Error event:', e);
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.nome || 'User')}&background=random`;
                  }}
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-semibold">{formData.nome || 'Nome do usuário'}</p>
                <p className="text-gray-400 text-sm">{formData.email || 'email@exemplo.com'}</p>
                {formData.avatar_url && (
                  <p className="text-xs text-green-400 mt-1">✓ Avatar personalizado</p>
                )}
              </div>
            </div>

            {/* Drag and Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-gray-700 hover:border-primary-500'
              } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading || isSaving}
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  <p className="text-gray-400">Fazendo upload...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-12 h-12 text-gray-500" />
                  <div>
                    <p className="text-white font-medium mb-1">
                      Arraste uma imagem ou clique para selecionar
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG ou WEBP (máx. 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* URL Manual */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Ou cole a URL da imagem
              </label>
              <input
                type="url"
                value={formData.avatar_url}
                onChange={(e) => handleChange('avatar_url', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="https://exemplo.com/avatar.jpg"
                disabled={isSaving || isUploading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Cole a URL da imagem do avatar ou deixe em branco para usar avatar gerado automaticamente
              </p>
            </div>
          </div>

          {/* Permissões e Status */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Permissões e Status</h2>

            <div className="space-y-4">
              {/* Tipo de Usuário */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Usuário
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => handleChange('tipo', e.target.value as 'usuario' | 'compositor' | 'admin')}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isSaving}
                >
                  <option value="usuario">Usuário</option>
                  <option value="compositor">Compositor</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Define o nível de acesso do usuário
                </p>
              </div>

              {/* Status Ativo */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => handleChange('ativo', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-2 focus:ring-green-500"
                  disabled={isSaving}
                />
                <div>
                  <span className="text-white font-medium">Ativo</span>
                  <p className="text-xs text-gray-400">Usuário pode acessar a plataforma</p>
                </div>
              </label>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              Salvar
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              disabled={isSaving}
              className="px-8 py-4 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserEdit;
