import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usuariosApi } from '@/lib/api-client';
import { uploadUserAvatar } from '@/lib/uploadHelpers';
import { changePassword } from '@/lib/auth-client';
import { buildAvatarUrl } from '@/lib/media-helper';

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [, setIsLoadingData] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  // Preferências
  const [preferences, setPreferences] = useState({
    notificacoesEmail: true,
    reproducaoAutomatica: true,
    perfilPublico: false
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: 'Brasil',
    birthDate: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Carregar dados reais do compositor
  useEffect(() => {
    const loadComposerData = async () => {
      // Timeout de segurança
      const timeoutId = setTimeout(() => {
        setIsLoadingData(false);
      }, 10000); // 10 segundos

      try {
        // Se não tiver user, usar dados básicos
        if (!user?.id) {
          setFormData({
            name: '',
            email: '',
            phone: '',
            location: 'Brasil',
            birthDate: '',
            bio: '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          clearTimeout(timeoutId);
          setIsLoadingData(false);
          return;
        }

        // Se não for compositor, usar dados básicos do user
        if (!profile?.is_composer) {
          setFormData({
            name: (profile as any)?.nome || '',
            email: user.email || '',
            phone: '',
            location: 'Brasil',
            birthDate: '',
            bio: '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          clearTimeout(timeoutId);
          setIsLoadingData(false);
          return;
        }

        // Preencher com dados locais (sem buscar compositor)
        setFormData({
          name: (profile as any)?.nome || (user as any)?.nome || '',
          email: user.email || '',
          phone: '',
          location: 'Brasil',
          birthDate: '',
          bio: '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } catch (error) {
        console.error('EditProfilePage - Error loading data:', error);
        // Usar dados básicos em caso de erro
        setFormData({
          name: (profile as any)?.nome || '',
          email: user.email || '',
          phone: '',
          location: 'Brasil',
          birthDate: '',
          bio: '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } finally {
        clearTimeout(timeoutId);
        setIsLoadingData(false);
      }
    };

    // Só executar se tiver user ou profile
    if (user || profile) {
      loadComposerData();
    } else {
      setIsLoadingData(false);
    }
  }, [user, profile]);

  // Carregar dados reais do usuário (nome/email/avatar) da API PHP
  useEffect(() => {
    const loadUser = async () => {
      if (!user?.id) {
        return;
      }
      try {
        const res = await usuariosApi.get(user.id);

        const u = (res as any)?.data as { nome?: string; email?: string; avatar_url?: string; telefone?: string; localizacao?: string; data_nascimento?: string; biografia?: string; notificacoes_email?: number; reproducao_automatica?: number; perfil_publico?: number } | undefined;

        if (u) {
          const newFormData = {
            name: u.nome || (profile as any)?.nome || '',
            email: u.email || '',
            phone: u.telefone || '',
            location: u.localizacao || 'Brasil',
            birthDate: u.data_nascimento || '',
            bio: u.biografia || '',
          };

          setFormData(prev => ({
            ...prev,
            ...newFormData
          }));

          // Carregar preferências
          setPreferences({
            notificacoesEmail: u.notificacoes_email === 1,
            reproducaoAutomatica: u.reproducao_automatica === 1,
            perfilPublico: u.perfil_publico === 1
          });

          if (u.avatar_url) setAvatarPreviewUrl(u.avatar_url);
        }
      } catch (e) {
        console.error('❌ EditProfilePage - loadUser: Error', e);
        setFormData(prev => ({
          ...prev,
          name: (profile as any)?.nome || (user as any)?.nome || prev.name,
          email: user?.email || prev.email,
        }));
      } finally {
        setIsLoadingData(false);
      }
    };
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [activeSection, setActiveSection] = useState('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  const handlePreferenceChange = async (key: keyof typeof preferences) => {
    if (!user?.id) {
      console.error('❌ handlePreferenceChange: No user ID');
      return;
    }

    const newValue = !preferences[key];
    setPreferences(prev => ({ ...prev, [key]: newValue }));

    try {
      // Mapear nomes frontend -> backend
      const fieldMap = {
        notificacoesEmail: 'notificacoes_email',
        reproducaoAutomatica: 'reproducao_automatica',
        perfilPublico: 'perfil_publico'
      };

      const backendField = fieldMap[key];
      const payload = { [backendField]: newValue ? 1 : 0 };

      const result = await usuariosApi.update(user.id, payload as any);

      if ((result as any)?.error) {
        throw new Error((result as any).error);
      }
    } catch (error: any) {
      console.error(`❌ Erro ao salvar preferência ${key}:`, error);
      console.error('Detalhes do erro:', {
        message: error.message,
        response: error.response,
        error
      });
      // Reverter em caso de erro
      setPreferences(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const handleSavePersonal = async () => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Usuário não identificado.' });
      return;
    }
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      // Atualizar dados completos do usuário
      const res = await usuariosApi.update(user.id, {
        nome: formData.name,
        email: formData.email,
        telefone: formData.phone || null,
        localizacao: formData.location || null,
        data_nascimento: formData.birthDate || null,
        biografia: formData.bio || null,
      } as any);
      if ((res as any)?.error) throw new Error((res as any).error);

      // Persistir no localStorage
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const u = JSON.parse(raw);
          const updated = {
            ...u,
            nome: formData.name,
            email: formData.email,
            telefone: formData.phone || null,
            localizacao: formData.location || null,
            data_nascimento: formData.birthDate || null,
            biografia: formData.bio || null,
          };
          localStorage.setItem('user', JSON.stringify(updated));
        }
      } catch { }

      setMessage({ type: 'success', text: 'Informações salvas com sucesso!' });
    } catch (error: any) {
      console.error('handleSavePersonal - Error:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar informações.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePassword = async () => {
    if (!user?.email) {
      setMessage({ type: 'error', text: 'Usuário não identificado.' });
      return;
    }

    if (!formData.currentPassword) {
      setMessage({ type: 'error', text: 'Digite sua senha atual.' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await changePassword({
        email: user.email,
        senha_atual: formData.currentPassword,
        senha_nova: formData.newPassword
      });

      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Senha alterada com sucesso!' });
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ type: 'error', text: result.message || 'Erro ao alterar senha.' });
      }
    } catch (error: any) {
      console.error('handleSavePassword - Error:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao alterar senha. Verifique sua senha atual.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!user?.id) {
      console.error('❌ No user ID');
      setMessage({ type: 'error', text: 'Erro: usuário não identificado' });
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setMessage({ type: '', text: '' });

      // Upload de avatar do usuário
      const avatarUrl = await uploadUserAvatar(user.id, file);
      setMessage({ type: 'success', text: 'Foto de perfil atualizada com sucesso!' });
      // Mostrar preview imediato sem recarregar
      try {
        const url = new URL(avatarUrl);
        url.searchParams.set('t', Date.now().toString());
        setAvatarPreviewUrl(url.toString());
      } catch {
        const sep = avatarUrl.includes('?') ? '&' : '?';
        setAvatarPreviewUrl(`${avatarUrl}${sep}t=${Date.now()}`);
      }
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        error
      });
      setMessage({ type: 'error', text: error.message || 'Erro ao fazer upload da imagem.' });
    } finally {
      setIsUploadingAvatar(false);
      // Limpar o input para permitir selecionar a mesma imagem novamente
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const sections = [
    { id: 'personal', label: 'Informações Pessoais' },
    { id: 'security', label: 'Segurança' },
    { id: 'preferences', label: 'Preferências' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-background-secondary rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Editar Perfil</h1>
          <p className="text-text-muted">Atualize suas informações pessoais</p>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/50 text-green-500'
            : 'bg-red-500/10 border border-red-500/50 text-red-500'
          }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeSection === section.id
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-text-muted hover:text-white hover:bg-background-secondary'
                  }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'personal' && (
            <div className="bg-background-secondary rounded-xl p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Informações Pessoais</h2>

              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-background-tertiary flex items-center justify-center overflow-hidden">
                    {(avatarPreviewUrl || profile?.avatar_url) ? (
                      <img
                        src={buildAvatarUrl({
                          id: String(((user as any)?.id) || ((profile as any)?.id) || ''),
                          avatar_url: (avatarPreviewUrl || (profile as any)?.avatar_url || '') as string,
                          name: (profile as any)?.nome || formData.name || user.email
                        })}
                        alt={(profile as any)?.nome || formData.name || user.email}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-text-muted" />
                    )}
                  </div>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 bg-primary-500 p-2 rounded-full hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-4 h-4 text-black animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-black" />
                    )}
                  </button>

                  {/* Hidden Input */}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleAvatarUpload}
                    onClick={(e) => {
                      // Garantir que o input está limpo antes de abrir
                      (e.target as HTMLInputElement).value = '';
                    }}
                    className="hidden"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Foto do Perfil</h3>
                  <p className="text-sm text-text-muted">Clique no ícone para alterar sua foto</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Localização
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Sua cidade, Estado"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Data de Nascimento
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Biografia
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Conte um pouco sobre você..."
                />
              </div>

              <button
                onClick={handleSavePersonal}
                disabled={isLoading}
                className="flex items-center gap-2 bg-primary-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-primary-400 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="bg-background-secondary rounded-xl p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Segurança</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Senha Atual
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Digite sua senha atual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-white"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Digite sua nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-white"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Confirme sua nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-white"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSavePassword}
                disabled={isLoading}
                className="flex items-center gap-2 bg-primary-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-primary-400 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          )}

          {activeSection === 'preferences' && (
            <div className="bg-background-secondary rounded-xl p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Preferências</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Notificações por Email</h3>
                    <p className="text-sm text-text-muted">Receba atualizações sobre novos hinos e playlists</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.notificacoesEmail}
                      onChange={() => handlePreferenceChange('notificacoesEmail')}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Reprodução Automática</h3>
                    <p className="text-sm text-text-muted">Continue ouvindo hinos similares</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.reproducaoAutomatica}
                      onChange={() => handlePreferenceChange('reproducaoAutomatica')}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Perfil Público</h3>
                    <p className="text-sm text-text-muted">Permita que outros usuários vejam seu perfil</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.perfilPublico}
                      onChange={() => handlePreferenceChange('perfilPublico')}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;
