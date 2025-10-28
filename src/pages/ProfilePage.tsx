import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Edit3, 
  Music, 
  Heart, 
  Clock, 
  Users, 
  Settings,
  Camera,
  Mail,
  Calendar,
  MapPin,
  Award,
  Play,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextMock';
import { usePlayerStore } from '@/stores/playerStore';
import { usePlayerContext } from '@/contexts/PlayerContext';
import { getProfileDashboardData, type FollowedComposer, type UserPlaylist } from '@/lib/profileDashboardApi';
import { uploadUserAvatar } from '@/lib/uploadHelpers';
import { buildAvatarUrl } from '@/lib/media-helper';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { play } = usePlayerStore();
  const { openFullScreen } = usePlayerContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [composerData, setComposerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    playlistsCount: 0,
    favoritesCount: 0,
    hoursListened: 0,
    followersCount: 0
  });
  const [recentPlays, setRecentPlays] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [followedComposers, setFollowedComposers] = useState<FollowedComposer[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([]);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarTempUrl, setAvatarTempUrl] = useState<string | null>(null);

  // Debug: Log profile changes
  useEffect(() => {
    console.log('👤 ProfilePage - Profile updated:', {
      hasProfile: !!profile,
      avatarUrl: profile?.avatar_url,
      name: (profile as any)?.nome,
      isComposer: profile?.is_composer
    });
  }, [profile]);

  // Carregar todos os dados do usuário
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      console.log('ProfilePage - Loading data (agregado)...', { 
        userId: user?.id, 
        isComposer: profile?.is_composer 
      });

      try {
        const data = await getProfileDashboardData(String(user.id), !!profile?.is_composer);
        setStats(data.stats || { playlistsCount: 0, favoritesCount: 0, hoursListened: 0, followersCount: 0 });
        setRecentPlays(data.recentPlays || []);
        setActivities(data.activities || []);
        setFollowedComposers(data.followedComposers || []);
        setUserPlaylists(data.playlists || []);
        setComposerData(data.composerProfile || null);
      } catch (error) {
        console.error('❌ Erro crítico ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, profile]);
  
  const statsDisplay = [
    { label: 'Playlists Criadas', value: stats.playlistsCount.toString(), icon: Music },
    { label: 'Músicas Curtidas', value: stats.favoritesCount.toString(), icon: Heart },
    { label: 'Horas Ouvidas', value: stats.hoursListened.toString(), icon: Clock },
    { label: 'Seguidores', value: stats.followersCount.toString(), icon: Users }
  ];

  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'playlists', label: 'Minhas Playlists' },
    { id: 'activity', label: 'Atividade Recente' },
    { id: 'following', label: 'Seguindo' }
  ];

  // Função para upload de avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 ProfilePage - handleAvatarUpload triggered');
    
    // Para compositores, redirecionar para a página de perfil do compositor
    if (profile?.is_composer) {
      navigate('/composer/profile');
      return;
    }
    
    const file = e.target.files?.[0];
    console.log('📸 File selected:', file ? {
      name: file.name,
      size: file.size,
      type: file.type
    } : 'No file');
    
    if (!file) {
      console.warn('⚠️ No file selected');
      return;
    }
    
    if (!user?.id) {
      console.error('❌ No user ID');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      console.log('📸 Starting upload for user:', user.id);
      
      const avatarUrl = await uploadUserAvatar(user.id, file);

      console.log('✅ Avatar uploaded successfully:', avatarUrl);
      // Atualizar UI imediatamente sem refresh completo e sem quebrar query string
      if (avatarUrl) {
        try {
          const url = new URL(avatarUrl);
          url.searchParams.set('t', Date.now().toString());
          setAvatarTempUrl(url.toString());
        } catch {
          // Fallback simples
          const sep = avatarUrl.includes('?') ? '&' : '?';
          setAvatarTempUrl(`${avatarUrl}${sep}t=${Date.now()}`);
        }
      }
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      alert(error.message || 'Erro ao fazer upload da imagem.');
    } finally {
      setIsUploadingAvatar(false);
      // Limpar o input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  // Função para editar perfil
  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-text-muted mb-4">Você precisa estar logado para ver o perfil</p>
          <Link 
            to="/login"
            className="bg-primary-500 text-black px-6 py-2 rounded-full font-semibold hover:bg-primary-400 transition-colors"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {(avatarTempUrl || composerData?.avatar_url || profile?.avatar_url) ? (
                <img 
                  src={
                    avatarTempUrl || buildAvatarUrl({
                      id: String(user.id),
                      avatar_url: (composerData?.avatar_url || profile?.avatar_url) as string,
                      name: (profile as any)?.nome || user.email
                    })
                  }
                  alt={composerData?.nome || (profile as any)?.nome || user.email}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('❌ Failed to load avatar:', e.currentTarget.src);
                    // Limpa url temporária para exibir placeholder
                    if (avatarTempUrl) setAvatarTempUrl(null);
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => console.log('✅ Avatar loaded successfully')}
                />
              ) : (
                <User className="w-16 h-16 text-white/80" />
              )}
            </div>
            <button 
              onClick={() => {
                if (profile?.is_composer) {
                  navigate('/composer/profile');
                } else {
                  avatarInputRef.current?.click();
                }
              }}
              disabled={isUploadingAvatar}
              className="absolute bottom-2 right-2 bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={profile?.is_composer ? "Ir para perfil do compositor" : "Alterar avatar"}
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
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
                console.log('📸 Input clicked');
                (e.target as HTMLInputElement).value = '';
              }}
              className="hidden"
            />
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                {composerData?.artistic_name || composerData?.nome || (profile as any)?.nome || user.nome || user.email}
              </h1>
              <button 
                onClick={() => {
                  if (profile?.is_composer) {
                    navigate('/composer/profile');
                  } else {
                    handleEditProfile();
                  }
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Editar Perfil"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 text-white/80 mb-4">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{composerData?.email || user.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Membro desde { (composerData?.created_at || (profile as any)?.created_at || (user as any)?.created_at)
                    ? new Date((composerData?.created_at || (profile as any)?.created_at || (user as any)?.created_at) as string)
                        .toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                    : '—' }
                </span>
              </div>
              {composerData?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{composerData.location}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="text-sm">
                {profile?.is_composer ? 'Compositor Verificado' : `Seja bem-vindo, ${composerData?.artistic_name || composerData?.nome || (profile as any)?.nome || user.nome || user.email}`}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              to="/settings"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Configurações</span>
            </Link>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsDisplay.map((stat) => (
          <div key={stat.label} className="bg-background-secondary rounded-xl p-6 text-center">
            <stat.icon className="w-8 h-8 text-primary-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-400 text-primary-400'
                  : 'border-transparent text-text-muted hover:text-white hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Recently Played */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Tocados Recentemente</h3>
              {recentPlays.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentPlays.map((play) => (
                    <div key={play.id} className="bg-background-secondary rounded-lg p-4 hover:bg-background-tertiary transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img 
                            src={play.hymn?.cover_url || 'https://placehold.co/48x48/1a1a1a/green?text=CCB'} 
                            alt={play.hymn?.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <button 
                            onClick={() => {
                              if (play.hymn) {
                                play(play.hymn as any);
                                openFullScreen();
                              }
                            }}
                            className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Play className="w-4 h-4 text-white fill-current" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">{play.hymn?.title}</h4>
                          <p className="text-sm text-text-muted truncate">{play.hymn?.composer_name || 'Compositor Desconhecido'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-background-secondary rounded-lg p-8 text-center">
                  <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhum hino tocado ainda</p>
                  <p className="text-sm text-gray-500 mt-2">Comece a ouvir seus hinos favoritos</p>
                </div>
              )}
            </div>

            {/* Top Playlists */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Minhas Playlists</h3>
              {userPlaylists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {userPlaylists.slice(0, 3).map((playlist) => (
                    <Link
                      key={playlist.id}
                      to={`/playlist/${playlist.id}`}
                      className="bg-background-secondary rounded-lg p-4 hover:bg-background-tertiary transition-colors group"
                    >
                      <div className="relative mb-4">
                        <img 
                          src={playlist.cover_url || 'https://placehold.co/200x200/1a1a1a/green?text=Playlist'} 
                          alt={playlist.name}
                          className="w-full aspect-square rounded-lg object-cover"
                        />
                        <button className="absolute bottom-2 right-2 bg-primary-500 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                          <Play className="w-4 h-4 text-black fill-current" />
                        </button>
                      </div>
                      <h4 className="font-semibold text-white mb-1 truncate">{playlist.name}</h4>
                      <p className="text-sm text-text-muted">{playlist.songs_count} {playlist.songs_count === 1 ? 'hino' : 'hinos'}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-background-secondary rounded-lg p-8 text-center">
                  <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhuma playlist criada ainda</p>
                  <p className="text-sm text-gray-500 mt-2">Crie sua primeira playlist e organize seus hinos favoritos</p>
                  <Link 
                    to="/library" 
                    className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-500 transition-colors"
                  >
                    Criar Playlist
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'playlists' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Minhas Playlists</h3>
              <Link
                to="/library"
                className="bg-primary-500 text-black px-4 py-2 rounded-full font-semibold hover:bg-primary-400 transition-colors"
              >
                Criar Playlist
              </Link>
            </div>
            {userPlaylists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userPlaylists.map((playlist) => (
                  <Link
                    key={playlist.id}
                    to={`/playlist/${playlist.id}`}
                    className="bg-background-secondary rounded-lg p-4 hover:bg-background-tertiary transition-colors group"
                  >
                    <div className="relative mb-4">
                      <img 
                        src={playlist.cover_url || 'https://placehold.co/200x200/1a1a1a/green?text=Playlist'} 
                        alt={playlist.name}
                        className="w-full aspect-square rounded-lg object-cover"
                      />
                      <button className="absolute bottom-2 right-2 bg-primary-500 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        <Play className="w-4 h-4 text-black fill-current" />
                      </button>
                    </div>
                    <h4 className="font-semibold text-white mb-1 truncate">{playlist.name}</h4>
                    <p className="text-sm text-text-muted line-clamp-2">{playlist.description || `${playlist.songs_count} ${playlist.songs_count === 1 ? 'hino' : 'hinos'}`}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-background-secondary rounded-lg p-12 text-center">
                <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-white mb-2">Nenhuma playlist ainda</h4>
                <p className="text-gray-400 mb-6">Crie playlists personalizadas com seus hinos favoritos</p>
                <Link 
                  to="/library" 
                  className="inline-block px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-500 transition-colors font-semibold"
                >
                  Criar Minha Primeira Playlist
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Atividade Recente</h3>
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const getActivityIcon = () => {
                    switch (activity.activity_type) {
                      case 'favorite': return <Heart className="w-5 h-5 text-red-400" />;
                      case 'playlist_created': return <Music className="w-5 h-5 text-green-400" />;
                      case 'follow': return <Users className="w-5 h-5 text-blue-400" />;
                      case 'play': return <Play className="w-5 h-5 text-purple-400" />;
                      default: return <Music className="w-5 h-5 text-gray-400" />;
                    }
                  };

                  const getActivityMessage = () => {
                    switch (activity.activity_type) {
                      case 'favorite': return `Curtiu "${activity.related_title}"`;
                      case 'playlist_created': return `Criou a playlist "${activity.related_title}"`;
                      case 'playlist_updated': return `Atualizou a playlist "${activity.related_title}"`;
                      case 'follow': return `Começou a seguir ${activity.related_title}`;
                      case 'play': return `Ouviu "${activity.related_title}"`;
                      default: return 'Atividade';
                    }
                  };

                  return (
                    <div key={activity.id} className="flex items-start gap-4 p-4 bg-background-secondary rounded-lg hover:bg-background-tertiary transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon()}
                      </div>
                      <div className="flex-1">
                        <p className="text-white">{getActivityMessage()}</p>
                        <p className="text-sm text-text-muted mt-1">
                          {new Date(activity.created_at).toLocaleDateString('pt-BR', { 
                            day: 'numeric', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-background-secondary rounded-lg p-12 text-center">
                <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-white mb-2">Nenhuma atividade ainda</h4>
                <p className="text-gray-400 mb-6">Suas atividades como curtidas, playlists criadas e compartilhamentos aparecerão aqui</p>
                <Link 
                  to="/" 
                  className="inline-block px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-500 transition-colors font-semibold"
                >
                  Explorar Hinos
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Compositores que Você Segue</h3>
            {followedComposers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {followedComposers.map((composer) => (
                  <Link
                    key={composer.id}
                    to={`/compositor/${composer.id}`}
                    className="bg-background-secondary rounded-lg p-6 text-center hover:bg-background-tertiary transition-colors group"
                  >
                    <img 
                      src={composer.photo_url || 'https://placehold.co/96x96/1a1a1a/green?text=Compositor'} 
                      alt={composer.artistic_name || composer.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-primary-400"
                    />
                    <h4 className="font-semibold text-white mb-1 truncate">{composer.artistic_name || composer.name}</h4>
                    <p className="text-sm text-text-muted mb-2">
                      {composer.followers_count} {composer.followers_count === 1 ? 'seguidor' : 'seguidores'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {composer.songs_count} {composer.songs_count === 1 ? 'hino' : 'hinos'}
                    </p>
                    <button className="mt-4 bg-primary-500 text-black px-4 py-2 rounded-full font-semibold hover:bg-primary-400 transition-colors text-sm">
                      Seguindo
                    </button>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-background-secondary rounded-lg p-12 text-center">
                <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-white mb-2">Você ainda não segue ninguém</h4>
                <p className="text-gray-400 mb-6">Siga seus compositores favoritos para receber atualizações sobre novos hinos</p>
                <Link 
                  to="/compositores" 
                  className="inline-block px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-500 transition-colors font-semibold"
                >
                  Descobrir Compositores
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
