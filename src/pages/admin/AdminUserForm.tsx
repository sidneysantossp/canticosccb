import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, User as UserIcon, Mail, Shield, Ban } from 'lucide-react';
import { getUserById, updateUser, createUser, User } from '@/lib/admin/usersAdminApi';
import { uploadApi } from '@/lib/api-client';
import { buildAvatarUrl } from '@/lib/media-helper';

const AdminUserForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    avatar_url: '',
    is_admin: false,
    is_blocked: false,
    email_verified: false,
    password: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing && id) {
      loadUser(decodeURIComponent(id));
    }
  }, [id, isEditing]);

  const loadUser = async (userId: string) => {
    try {
      setIsLoading(true);
      const user = await getUserById(userId);
      
      if (user) {
        setFormData({
          name: user.name || '',
          username: user.username || '',
          email: user.email || '',
          avatar_url: user.avatar_url || '',
          is_admin: user.is_admin || false,
          is_blocked: user.is_blocked || false,
          email_verified: user.email_verified || false,
          password: ''
        });
        setAvatarPreview(user.avatar_url || '');
      } else {
        setError('Usuário não encontrado');
        setTimeout(() => navigate('/admin/users'), 2000);
      }
    } catch (error: any) {
      console.error('Error loading user:', error);
      setError(error?.message || 'Erro ao carregar usuário');
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

    if (!formData.username || !formData.username.trim()) {
      newErrors.username = 'Username é obrigatório';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username deve ter pelo menos 3 caracteres';
    }

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!isEditing && (!formData.password || formData.password.length < 6)) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const response = await uploadApi.avatar(file);
      if (response.data) {
        return response.data.url;
      }
      return null;
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setIsSaving(true);
      setError(null);

      let avatarUrl = formData.avatar_url?.split('?')[0] || '';

      // Upload de avatar se houver
      if (avatarFile) {
        const uploaded = await uploadAvatar(avatarFile);
        if (uploaded) avatarUrl = uploaded;
      }

      const userData = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        avatar_url: avatarUrl || undefined,
        is_admin: formData.is_admin,
        is_blocked: formData.is_blocked,
        email_verified: formData.email_verified,
        ...(formData.password && { password: formData.password })
      };

      if (isEditing && id) {
        await updateUser(decodeURIComponent(id), userData);
      } else {
        await createUser(userData);
      }

      navigate('/admin/users');
    } catch (error: any) {
      console.error('Error saving user:', error);
      setError(error?.message || 'Erro ao salvar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando usuário...</p>
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
            to="/admin/users"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
            </h1>
            <p className="text-gray-400 mt-1">Gerencie informações e permissões do usuário</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Avatar do Usuário</h2>
            
            <div className="flex items-center gap-6">
              {avatarPreview && (
                <img
                  src={
                    avatarPreview.startsWith('data:')
                      ? avatarPreview
                      : buildAvatarUrl({
                          id: String(id || ''),
                          avatar_url: avatarPreview,
                          name: formData.name || formData.username || 'User'
                        })
                  }
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover"
                />
              )}

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`flex-1 ${isDragging ? 'border-green-600' : 'border-gray-700'}`}
              >
                <label className="flex flex-col items-center justify-center h-32 bg-gray-800/50 border-2 border-dashed rounded-lg cursor-pointer hover:border-green-600 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-gray-400 text-sm">
                    {avatarFile ? avatarFile.name : 'Arraste uma imagem ou clique para selecionar'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Informações Básicas
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full bg-gray-800 border ${errors.name ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600`}
                  placeholder="João Silva"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full bg-gray-800 border ${errors.username ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600`}
                  placeholder="joaosilva"
                />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full bg-gray-800 border ${errors.email ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600`}
                  placeholder="usuario@exemplo.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Senha *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full bg-gray-800 border ${errors.password ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600`}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Permissões e Status */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Permissões e Status
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-white font-medium">Administrador</p>
                    <p className="text-gray-400 text-sm">Acesso completo ao painel admin</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_admin}
                  onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <Ban className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-white font-medium">Bloqueado</p>
                    <p className="text-gray-400 text-sm">Impede o acesso do usuário</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_blocked}
                  onChange={(e) => setFormData({ ...formData, is_blocked: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-white font-medium">Email Verificado</p>
                    <p className="text-gray-400 text-sm">Marca o email como verificado</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.email_verified}
                  onChange={(e) => setFormData({ ...formData, email_verified: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 sticky bottom-6 bg-gray-950/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <Link
              to="/admin/users"
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
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Usuário'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserForm;
