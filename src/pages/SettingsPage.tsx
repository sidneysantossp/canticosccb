import React, { useState } from 'react';
import { User, Bell, Lock, Music, Volume2, Download, Globe, Moon, Smartphone, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const [settings, setSettings] = useState({
    // Audio
    audioQuality: 'high',
    crossfade: false,
    crossfadeDuration: 5,
    equalizer: 'flat',
    normalizeVolume: true,
    
    // Playback
    autoplay: true,
    gaplessPlayback: true,
    showUnavailableSongs: false,
    
    // Download
    downloadQuality: 'high',
    downloadOverCellular: false,
    removeDownloadsOnDelete: true,
    
    // Notifications
    newReleases: true,
    recommendations: true,
    playlistUpdates: false,
    emailNotifications: true,
    
    // Privacy
    privateSession: false,
    showInFriendActivity: true,
    allowExplicit: true,
    
    // Display
    theme: 'dark',
    language: 'pt-BR'
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const settingsSections = [
    {
      title: 'Conta',
      icon: User,
      items: [
        {
          id: 'profile',
          label: 'Editar perfil',
          description: 'Nome, email e foto',
          type: 'link',
          action: () => navigate('/profile/edit')
        },
        {
          id: 'subscription',
          label: 'Plano e assinatura',
          description: 'Premium',
          type: 'link',
          action: () => navigate('/subscription')
        },
        {
          id: 'privacy',
          label: 'Privacidade',
          description: 'Controle seus dados',
          type: 'link',
          action: () => navigate('/privacy')
        }
      ]
    },
    {
      title: 'Áudio',
      icon: Music,
      items: [
        {
          id: 'audioQuality',
          label: 'Qualidade do áudio',
          description: 'Alta',
          type: 'select',
          options: [
            { value: 'low', label: 'Baixa (96 kbps)' },
            { value: 'normal', label: 'Normal (160 kbps)' },
            { value: 'high', label: 'Alta (320 kbps)' },
            { value: 'lossless', label: 'Sem perda (FLAC)' }
          ]
        },
        {
          id: 'normalizeVolume',
          label: 'Normalizar volume',
          description: 'Iguala o volume de diferentes músicas',
          type: 'toggle'
        },
        {
          id: 'crossfade',
          label: 'Crossfade',
          description: 'Transição suave entre músicas',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Reprodução',
      icon: Volume2,
      items: [
        {
          id: 'autoplay',
          label: 'Reprodução automática',
          description: 'Continue ouvindo músicas similares',
          type: 'toggle'
        },
        {
          id: 'gaplessPlayback',
          label: 'Reprodução sem pausas',
          description: 'Elimina pausas entre faixas',
          type: 'toggle'
        },
        {
          id: 'showUnavailableSongs',
          label: 'Mostrar músicas indisponíveis',
          description: 'Em playlists',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Downloads',
      icon: Download,
      items: [
        {
          id: 'downloadQuality',
          label: 'Qualidade do download',
          description: 'Alta',
          type: 'select',
          options: [
            { value: 'normal', label: 'Normal (160 kbps)' },
            { value: 'high', label: 'Alta (320 kbps)' }
          ]
        },
        {
          id: 'downloadOverCellular',
          label: 'Download via dados móveis',
          description: 'Permitir downloads usando rede móvel',
          type: 'toggle'
        },
        {
          id: 'removeDownloadsOnDelete',
          label: 'Remover downloads ao excluir',
          description: 'Remove downloads ao excluir playlists',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Notificações',
      icon: Bell,
      items: [
        {
          id: 'newReleases',
          label: 'Novos lançamentos',
          description: 'De artistas que você segue',
          type: 'toggle'
        },
        {
          id: 'recommendations',
          label: 'Recomendações',
          description: 'Baseadas no seu gosto musical',
          type: 'toggle'
        },
        {
          id: 'playlistUpdates',
          label: 'Atualizações de playlists',
          description: 'Quando playlists forem atualizadas',
          type: 'toggle'
        },
        {
          id: 'emailNotifications',
          label: 'Notificações por email',
          description: 'Receber novidades por email',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Privacidade',
      icon: Lock,
      items: [
        {
          id: 'privateSession',
          label: 'Sessão privada',
          description: 'Não salva seu histórico de reprodução',
          type: 'toggle'
        },
        {
          id: 'showInFriendActivity',
          label: 'Mostrar atividade para amigos',
          description: 'Seus amigos podem ver o que você está ouvindo',
          type: 'toggle'
        },
        {
          id: 'allowExplicit',
          label: 'Permitir conteúdo explícito',
          description: 'Mostrar músicas com conteúdo explícito',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Exibição',
      icon: Moon,
      items: [
        {
          id: 'theme',
          label: 'Tema',
          description: 'Escuro',
          type: 'select',
          options: [
            { value: 'light', label: 'Claro' },
            { value: 'dark', label: 'Escuro' },
            { value: 'auto', label: 'Automático' }
          ]
        },
        {
          id: 'language',
          label: 'Idioma',
          description: 'Português (Brasil)',
          type: 'select',
          options: [
            { value: 'pt-BR', label: 'Português (Brasil)' },
            { value: 'en-US', label: 'English (US)' },
            { value: 'es-ES', label: 'Español' }
          ]
        }
      ]
    }
  ];

  const toggleSetting = (key: string) => {
    setSettings({
      ...settings,
      [key]: !settings[key as keyof typeof settings]
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="min-h-screen bg-background-primary p-6 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Configurações</h1>
          <p className="text-text-muted">Personalize sua experiência</p>
        </div>

        {/* User Card */}
        {user && (
          <div className="bg-gradient-to-r from-primary-900/30 to-background-secondary rounded-2xl p-6 mb-8 border border-primary-500/20">
            <div className="flex items-center gap-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                <p className="text-text-muted">{user.email}</p>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                Ver perfil
              </button>
            </div>
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-8">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.title}>
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="w-5 h-5 text-primary-500" />
                  <h2 className="text-xl font-bold text-white">{section.title}</h2>
                </div>

                <div className="bg-background-secondary rounded-xl border border-gray-800 overflow-hidden">
                  {section.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-4 hover:bg-background-hover transition-colors ${
                        index !== section.items.length - 1 ? 'border-b border-gray-800' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1">{item.label}</h3>
                          <p className="text-text-muted text-sm">{item.description}</p>
                        </div>

                        <div className="ml-4">
                          {item.type === 'toggle' && (
                            <button
                              onClick={() => toggleSetting(item.id)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                settings[item.id as keyof typeof settings]
                                  ? 'bg-primary-500'
                                  : 'bg-gray-700'
                              }`}
                            >
                              <div
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                  settings[item.id as keyof typeof settings]
                                    ? 'transform translate-x-6'
                                    : ''
                                }`}
                              />
                            </button>
                          )}

                          {item.type === 'select' && (
                            <select
                              value={settings[item.id as keyof typeof settings] as string}
                              onChange={(e) => updateSetting(item.id, e.target.value)}
                              className="px-4 py-2 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              {item.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}

                          {item.type === 'link' && (
                            <button
                              onClick={item.action}
                              className="p-2 hover:bg-background-tertiary rounded-full transition-colors"
                            >
                              <ChevronRight className="w-5 h-5 text-text-muted" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Logout Section */}
        <div className="mt-8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-background-secondary hover:bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:border-red-500/50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Sair da conta</span>
          </button>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-sm text-text-muted">
            <button className="hover:text-white transition-colors">Sobre</button>
            <span>•</span>
            <button className="hover:text-white transition-colors">Comunidades</button>
            <span>•</span>
            <button className="hover:text-white transition-colors">Para artistas</button>
          </div>
          <p className="text-text-muted text-xs">
            © 2024 Cânticos CCB. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
