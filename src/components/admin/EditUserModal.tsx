import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Ban, Image as ImageIcon, AtSign } from 'lucide-react';
import { User as UserType } from '@/lib/admin/usersAdminApi';

interface EditUserModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, updates: Partial<UserType>) => Promise<void>;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user.name || user.full_name || '',
    username: user.username || '',
    email: user.email || '',
    avatar_url: user.avatar_url || '',
    is_admin: user.is_admin || false,
    is_blocked: user.is_blocked || false,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user.name || user.full_name || '',
        username: user.username || '',
        email: user.email || '',
        avatar_url: user.avatar_url || '',
        is_admin: user.is_admin || false,
        is_blocked: user.is_blocked || false,
      });
      setErrors({});
    }
  }, [isOpen, user]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      setIsSaving(true);
      await onSave(user.id, {
        name: formData.name,
        full_name: formData.name,
        username: formData.username,
        email: formData.email,
        avatar_url: formData.avatar_url,
        is_admin: formData.is_admin,
        is_blocked: formData.is_blocked,
      });
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao editar
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <User className="w-6 h-6 text-primary-500" />
              Editar Usuário
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Altere as informações do usuário abaixo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <img
              src={formData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.username || 'User')}&background=random`}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-primary-500"
            />
            <div>
              <p className="text-white font-semibold">{formData.name || 'Nome do usuário'}</p>
              <p className="text-gray-400 text-sm">@{formData.username || 'username'}</p>
            </div>
          </div>

          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-4 py-3 bg-gray-800 border ${
                errors.name ? 'border-red-500' : 'border-gray-700'
              } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all`}
              placeholder="João Silva"
              disabled={isSaving}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <AtSign className="w-4 h-4 inline mr-2" />
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className={`w-full px-4 py-3 bg-gray-800 border ${
                errors.username ? 'border-red-500' : 'border-gray-700'
              } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all`}
              placeholder="joaosilva"
              disabled={isSaving}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-400">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
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

          {/* Avatar URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <ImageIcon className="w-4 h-4 inline mr-2" />
              URL do Avatar
            </label>
            <input
              type="url"
              value={formData.avatar_url}
              onChange={(e) => handleChange('avatar_url', e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              placeholder="https://exemplo.com/avatar.jpg"
              disabled={isSaving}
            />
            <p className="mt-1 text-xs text-gray-500">
              Deixe em branco para usar avatar gerado automaticamente
            </p>
          </div>

          {/* Permissões */}
          <div className="space-y-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <h3 className="text-sm font-semibold text-white mb-3">Permissões e Status</h3>
            
            {/* Admin Toggle */}
            <label className="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
              <div className="flex items-center gap-3">
                <Shield className={`w-5 h-5 ${formData.is_admin ? 'text-purple-400' : 'text-gray-500'}`} />
                <div>
                  <p className="text-white font-medium">Administrador</p>
                  <p className="text-xs text-gray-400">Acesso total ao painel admin</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.is_admin}
                  onChange={(e) => handleChange('is_admin', e.target.checked)}
                  className="sr-only peer"
                  disabled={isSaving}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </div>
            </label>

            {/* Block Toggle */}
            <label className="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
              <div className="flex items-center gap-3">
                <Ban className={`w-5 h-5 ${formData.is_blocked ? 'text-red-400' : 'text-gray-500'}`} />
                <div>
                  <p className="text-white font-medium">Bloqueado</p>
                  <p className="text-xs text-gray-400">Impede o acesso do usuário</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.is_blocked}
                  onChange={(e) => handleChange('is_blocked', e.target.checked)}
                  className="sr-only peer"
                  disabled={isSaving}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg border border-gray-700 text-gray-300 font-semibold hover:bg-gray-800 transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
