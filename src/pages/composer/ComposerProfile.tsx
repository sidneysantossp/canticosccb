import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  Save,
  AlertCircle,
  CheckCircle,
  Music,
  Edit3,
  MoreVertical,
  Share2,
  ExternalLink,
  Settings,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { compositoresApi } from '@/lib/api-client';
import { uploadComposerAvatar, uploadComposerBanner } from '@/lib/uploadHelpers';

const ComposerProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'social' | 'preferences'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [composerId, setComposerId] = useState<string | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    artisticName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    website: '',
    instagram: '',
    facebook: '',
    youtube: '',
    avatarUrl: '',
    bannerUrl: '',
    tipo_compositor: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    genres: [] as string[],
    notifications: {
      emailFollowers: true,
      emailComments: true,
      emailAnalytics: false,
      pushNewFollowers: true,
      pushMilestones: true
    }
  });

  // Carregar dados do compositor
  useEffect(() => {
    const loadComposerData = async () => {
      if (!user?.id) {
        setIsLoadingData(false);
        return;
      }

      try {
        setIsLoadingData(true);
        
        // Tentar carregar dados do compositor com timeout mais longo
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)); // 10 segundos
        // 1) Tenta buscar pelo usuario_id (relacionamento mais comum)
        const byUserRespPromise = compositoresApi.getByUsuarioId(Number(user.id));
        // 2) Fallback: tenta pelo id direto
        const byIdRespPromise = compositoresApi.get(Number(user.id));
        const composerDataResp = (await Promise.race([
          byUserRespPromise,
          timeout
        ])) as any || (await Promise.race([byIdRespPromise, timeout])) as any;
        
        // Normalizar possíveis formatos de resposta da API
        const pickComposer = (resp: any) => {
          const d = resp?.data ?? resp;
          if (!d) return null;
          // Arrays diretos
          if (Array.isArray(d)) return d[0] || null;
          // Arrays aninhados
          if (Array.isArray(d?.data)) return d.data[0] || null;
          if (Array.isArray(d?.compositores)) return d.compositores[0] || null;
          // Objetos nomeados
          if (d?.compositor?.id) return d.compositor;
          if (d?.data && d.data.id) return d.data;
          // Objeto direto
          if (d?.id) return d;
          return null;
        };

        let cd = pickComposer(composerDataResp) || pickComposer(await byIdRespPromise);
        // 3) Fallback: listar compositores e encontrar por usuario_id
        if (!cd) {
          try {
            const allResp: any = await compositoresApi.list({ limit: 500 } as any);
            const d = (allResp as any)?.data ?? allResp;
            const arr = d?.compositores || d?.data || d;
            if (Array.isArray(arr)) {
              cd = arr.find((c: any) => Number(c?.usuario_id) === Number(user.id)) || null;
            }
          } catch {}
        }
        // 4) Fallback extra: tentar buscar por email/nome na listagem
        if (!cd) {
          try {
            const byEmail = await compositoresApi.list({ search: user.email || '' } as any);
            cd = pickComposer(byEmail);
          } catch {}
        }
        if (!cd && (profile as any)?.nome) {
          try {
            const byName = await compositoresApi.list({ search: (profile as any).nome } as any);
            cd = pickComposer(byName);
          } catch {}
        }
        if (cd) {
          try { console.log('ComposerProfile - Dados do compositor resolvidos:', cd); } catch {}
          const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));
          setComposerId(String(cd.id));
          // Derivar preferências individuais do compositor (se existirem)
          const notifFromComposer = {
            emailFollowers: Number(cd?.notif_email_followers) === 1,
            emailComments: Number(cd?.notif_email_comments) === 1,
            emailAnalytics: Number(cd?.notif_email_analytics) === 1,
            pushNewFollowers: Number(cd?.notif_push_new_followers) === 1,
            pushMilestones: Number(cd?.notif_push_milestones) === 1,
          };

          const resolvedNotifications = {
            emailFollowers: notifFromComposer.emailFollowers,
            emailComments: notifFromComposer.emailComments,
            emailAnalytics: notifFromComposer.emailAnalytics,
            pushNewFollowers: notifFromComposer.pushNewFollowers,
            pushMilestones: notifFromComposer.pushMilestones,
          };

          setFormData({
            name: toStr(cd.nome || cd.name),
            artisticName: toStr(cd.nome_artistico || cd.artistic_name || cd.artist_name),
            email: toStr(cd.email),
            phone: toStr(cd.telefone || cd.phone || cd.celular),
            location: toStr(cd.localizacao || [cd.cidade, (cd.estado || cd.uf)].filter(Boolean).join(' - ')),
            bio: toStr(cd.biografia || cd.bio),
            website: toStr(cd.website),
            instagram: toStr(cd.instagram),
            facebook: toStr(cd.facebook),
            youtube: toStr(cd.youtube),
            avatarUrl: toStr(cd.avatar_url),
            bannerUrl: toStr(cd.banner_url),
            tipo_compositor: toStr(cd.tipo_compositor || cd.tipo || cd.genero || cd.categoria),
            endereco: toStr(cd.endereco || cd.logradouro || cd.address),
            numero: toStr(cd.numero || cd.number),
            complemento: toStr(cd.complemento || cd.compl),
            bairro: toStr(cd.bairro || cd.district),
            cidade: toStr(cd.cidade || cd.city),
            estado: toStr(cd.estado || cd.uf || cd.state),
            genres: [], // TODO: buscar gêneros da tabela de relacionamento
            notifications: resolvedNotifications
          });
        } else {
          // Se timeout ou não encontrou dados, usar dados básicos do profile
          console.log('ComposerProfile - Timeout ou sem dados, usando dados básicos');
          setFormData({
            name: (profile as any)?.nome || '',
            artisticName: (profile as any)?.nome || '',
            email: user.email || '',
            phone: '',
            location: '',
            bio: '',
            website: '',
            instagram: '',
            facebook: '',
            youtube: '',
            avatarUrl: (profile as any)?.avatar_url || '',
            bannerUrl: '',
            tipo_compositor: '',
            endereco: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            genres: [],
            notifications: {
              emailFollowers: true,
              emailComments: true,
              emailAnalytics: false,
              pushNewFollowers: true,
              pushMilestones: true
            }
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setMessage({ type: 'error', text: 'Erro ao carregar dados do perfil' });
        
        // Usar dados básicos em caso de erro
        setFormData({
          name: (profile as any)?.nome || '',
          artisticName: (profile as any)?.nome || '',
          email: user.email || '',
          phone: '',
          location: '',
          bio: '',
          website: '',
          instagram: '',
          facebook: '',
          youtube: '',
          avatarUrl: (profile as any)?.avatar_url || '',
          bannerUrl: '',
          tipo_compositor: '',
          endereco: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          genres: [],
          notifications: {
            emailFollowers: true,
            emailComments: true,
            emailAnalytics: false,
            pushNewFollowers: true,
            pushMilestones: true
          }
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadComposerData();
  }, [user]);

  const availableGenres = [
    'Hinos Clássicos',
    'Louvor',
    'Adoração',
    'Instrumental',
    'Coral',
    'Oração',
    'Evangélico',
    'Contemporâneo'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const toggleNotification = (key: string) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key as keyof typeof prev.notifications]
      }
    }));
  };

  // Upload de avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !composerId) return;

    try {
      setIsUploadingAvatar(true);
      setMessage(null);
      
      const avatarUrl = await uploadComposerAvatar(Number(composerId), file);
      
      // Atualizar no banco
      await compositoresApi.update(Number(composerId), { avatar_url: avatarUrl } as any);
      
      // Atualizar estado local
      setFormData(prev => ({ ...prev, avatarUrl }));
      
      setMessage({ type: 'success', text: 'Avatar atualizado com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao fazer upload do avatar' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Upload de banner
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !composerId) return;

    try {
      setIsUploadingBanner(true);
      setMessage(null);
      
      const bannerUrl = await uploadComposerBanner(Number(composerId), file);
      
      // Atualizar no banco
      await compositoresApi.update(Number(composerId), { banner_url: bannerUrl } as any);
      
      // Atualizar estado local
      setFormData(prev => ({ ...prev, bannerUrl }));
      
      setMessage({ type: 'success', text: 'Banner atualizado com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao fazer upload do banner' });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Salvar alterações
  const handleSave = async () => {
    if (!composerId) return;

    setIsLoading(true);
    setMessage(null);

    try {
      // Validações
      if (!formData.name.trim()) {
        throw new Error('Nome completo é obrigatório');
      }
      if (!formData.artisticName.trim()) {
        throw new Error('Nome artístico é obrigatório');
      }
      if (!formData.email.trim()) {
        throw new Error('Email é obrigatório');
      }

      // Atualizar no banco
      await compositoresApi.update(Number(composerId), {
        nome: formData.name,
        nome_artistico: formData.artisticName,
        email: formData.email,
        telefone: formData.phone,
        localizacao: formData.location,
        biografia: formData.bio,
        website: formData.website,
        instagram: formData.instagram,
        facebook: formData.facebook,
        youtube: formData.youtube,
        tipo_compositor: formData.tipo_compositor,
        endereco: formData.endereco,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
      } as any);

      // Persistir preferências de notificações no compositor (fonte única de verdade)
      await compositoresApi.update(Number(composerId), {
        notif_email_followers: formData.notifications.emailFollowers ? 1 : 0,
        notif_email_comments: formData.notifications.emailComments ? 1 : 0,
        notif_email_analytics: formData.notifications.emailAnalytics ? 1 : 0,
        notif_push_new_followers: formData.notifications.pushNewFollowers ? 1 : 0,
        notif_push_milestones: formData.notifications.pushMilestones ? 1 : 0,
      } as any);

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar perfil. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Editar Perfil</h1>
        <p className="text-text-muted">Gerencie suas informações públicas</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/50 text-green-400'
              : 'bg-red-500/10 border-red-500/50 text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <span className="ml-3 text-white">Carregando dados...</span>
        </div>
      ) : (
        <>
      {/* Profile Header */}
      <div className="bg-background-secondary rounded-xl p-6 border border-gray-800 mb-8">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-background-tertiary flex items-center justify-center overflow-hidden border-2 border-gray-700">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt={formData.artisticName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-text-muted" />
              )}
            </div>
            
            {/* Button Upload Avatar */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 w-10 h-10 bg-primary-500 text-black rounded-full flex items-center justify-center hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </button>
            
            {/* Hidden Input */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white">
                {formData.artisticName || 'Compositor'}
              </h2>
              {profile?.is_composer && (
                <span title="Verificado">
                  <CheckCircle className="w-6 h-6 text-primary-500" />
                </span>
              )}
            </div>
            <p className="text-text-muted mb-3">{formData.name || 'Nome não informado'}</p>
            <div className="flex flex-wrap gap-2">
              {formData.genres.length > 0 ? (
                formData.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm"
                  >
                    {genre}
                  </span>
                ))
              ) : (
                <span className="text-text-muted text-sm">Nenhum gênero selecionado</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => bannerInputRef.current?.click()}
              disabled={isUploadingBanner}
              className="px-4 py-2 bg-background-tertiary text-white rounded-lg hover:bg-background-hover transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isUploadingBanner ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  Editar Banner
                </>
              )}
            </button>
            
            {/* Hidden Input Banner */}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleBannerUpload}
              className="hidden"
            />

            {/* Menu 3 Pontos */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 bg-background-tertiary text-white rounded-lg hover:bg-background-hover transition-colors flex items-center justify-center"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-background-secondary border border-gray-700 rounded-lg shadow-xl z-10">
                  <button
                    onClick={() => {
                      window.open(`/compositor/${composerId}`, '_blank');
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-background-hover transition-colors flex items-center gap-3"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver perfil público
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + `/compositor/${composerId}`);
                      setMessage({ type: 'success', text: 'Link copiado!' });
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-background-hover transition-colors flex items-center gap-3"
                  >
                    <Share2 className="w-4 h-4" />
                    Compartilhar perfil
                  </button>
                  <div className="border-t border-gray-700"></div>
                  <button
                    onClick={() => {
                      window.location.href = '/settings';
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-background-hover transition-colors flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4" />
                    Configurações
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-700">
        {[
          { id: 'profile', label: 'Informações', icon: User },
          { id: 'social', label: 'Redes Sociais', icon: Globe },
          { id: 'preferences', label: 'Preferências', icon: Music }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-400 border-primary-400'
                  : 'text-text-muted border-transparent hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-6">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Nome Artístico</label>
                <div className="relative">
                  <Music className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="text"
                    value={formData.artisticName}
                    onChange={(e) => handleInputChange('artisticName', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-white font-medium mb-2">Localização</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Tipo de Compositor */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Tipo de Compositor</label>
                <input
                  type="text"
                  value={formData.tipo_compositor}
                  onChange={(e) => handleInputChange('tipo_compositor', e.target.value)}
                  className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="mt-6">
              <label className="block text-white font-medium mb-3">Endereço</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-text-muted text-sm mb-2">Logradouro</label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-text-muted text-sm mb-2">Número</label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                    className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-text-muted text-sm mb-2">Complemento</label>
                  <input
                    type="text"
                    value={formData.complemento}
                    onChange={(e) => handleInputChange('complemento', e.target.value)}
                    className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-text-muted text-sm mb-2">Bairro</label>
                  <input
                    type="text"
                    value={formData.bairro}
                    onChange={(e) => handleInputChange('bairro', e.target.value)}
                    className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-text-muted text-sm mb-2">Cidade</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-text-muted text-sm mb-2">Estado</label>
                  <input
                    type="text"
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-white font-medium mb-2">Biografia</label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <p className="text-text-muted text-sm mt-2">{formData.bio.length}/500 caracteres</p>
            </div>

            <div className="mt-6">
              <label className="block text-white font-medium mb-3">Gêneros Musicais</label>
              <div className="flex flex-wrap gap-2">
                {availableGenres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      formData.genres.includes(genre)
                        ? 'bg-primary-500 text-black'
                        : 'bg-background-tertiary text-white hover:bg-gray-700'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social Tab */}
      {activeTab === 'social' && (
        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-6">Redes Sociais</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://seusite.com"
                  className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Instagram</label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  placeholder="@seuinstagram"
                  className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Facebook</label>
              <div className="relative">
                <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={formData.facebook}
                  onChange={(e) => handleInputChange('facebook', e.target.value)}
                  placeholder="facebook.com/seuperfil"
                  className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">YouTube</label>
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={formData.youtube}
                  onChange={(e) => handleInputChange('youtube', e.target.value)}
                  placeholder="@seucanal"
                  className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-6">Notificações</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-white font-semibold mb-4">Notificações por Email</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Novos seguidores</p>
                    <p className="text-text-muted text-sm">Receba quando alguém começar a seguir você</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.emailFollowers}
                      onChange={() => toggleNotification('emailFollowers')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Comentários e interações</p>
                    <p className="text-text-muted text-sm">Quando alguém interagir com seus hinos</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.emailComments}
                      onChange={() => toggleNotification('emailComments')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Relatórios de analytics</p>
                    <p className="text-text-muted text-sm">Resumo semanal de desempenho</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.emailAnalytics}
                      onChange={() => toggleNotification('emailAnalytics')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-6">
              <h4 className="text-white font-semibold mb-4">Notificações Push</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Novos seguidores</p>
                    <p className="text-text-muted text-sm">Notificação instantânea</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.pushNewFollowers}
                      onChange={() => toggleNotification('pushNewFollowers')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Marcos alcançados</p>
                    <p className="text-text-muted text-sm">100K plays, 1M plays, etc.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.pushMilestones}
                      onChange={() => toggleNotification('pushMilestones')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 mt-8">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-black rounded-lg font-medium hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>
      </>
      )}
    </div>
  );
};

export default ComposerProfile;
