import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Crown, 
  Shield, 
  Volume2, 
  Download,
  Play,
  ChevronRight,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { getPremiumVisibility } from '@/lib/admin/premiumAdminApi';
import { usuariosApi } from '@/lib/api-client';
import { buildAvatarUrl } from '@/lib/media-helper';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, profile, signOut } = useAuth();
  
  // Usar dados do AuthContext (mais completos)
  const user = {
    name: (profile as any)?.name || (profile as any)?.nome || authUser?.email?.split('@')[0] || 'Usuário',
    email: authUser?.email || '',
    avatar: (profile as any)?.avatar_url || ''
  };
  
  const [settings, setSettings] = useState({
    // Audio
    audioQuality: 'high',
    normalizeVolume: true,
    crossfade: false,
    
    // Playback
    autoplay: true,
    gaplessPlayback: true,
    showUnavailableSongs: false,
    
    // Downloads
    downloadQuality: 'high',
    downloadOverWifiOnly: true,
    
    // Notifications
    pushNotifications: true,
    emailNotifications: false
  });

  const [premiumEnabled, setPremiumEnabled] = useState<boolean>(false);
  const SETTINGS_STORAGE_KEY = 'user_settings_prefs_v1';
  const updateTimer = useRef<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const enabled = await getPremiumVisibility();
      setPremiumEnabled(enabled);
    };
    load();
  }, []);

  useEffect(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SETTINGS_STORAGE_KEY) : null;
      if (raw) {
        const saved = JSON.parse(raw);
        setSettings(prev => ({ ...prev, ...saved }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      }
    } catch {}
  }, [settings]);

  useEffect(() => {
    const hydrate = async () => {
      const userId: any = (authUser as any)?.id || (profile as any)?.id;
      if (!userId) return;
      try {
        const res = await usuariosApi.get(Number(userId));
        const u: any = (res as any)?.data || {};
        const next = {
          autoplay: u?.reproducao_automatica === 1,
          gaplessPlayback: u?.reproducao_sem_pausas === 1,
          crossfade: u?.crossfade === 1,
          audioQuality: u?.qualidade_audio || settings.audioQuality,
          downloadQuality: u?.qualidade_download || settings.downloadQuality,
          downloadOverWifiOnly: u?.download_wifi_only === 1,
          showUnavailableSongs: u?.mostrar_hinos_indisponiveis === 1,
        } as any;
        setSettings(prev => ({ ...prev, ...next }));
        try {
          if (typeof localStorage !== 'undefined') {
            const merged = { ...settings, ...next } as any;
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
          }
        } catch {}
      } catch {}
    };
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id, (profile as any)?.id]);

  const handleToggle = async (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));

    const userId: any = (authUser as any)?.id || (profile as any)?.id;
    if (!userId) return;

    const nextVal = !((settings as any)[key]);
    const map: Record<string, string> = {
      autoplay: 'reproducao_automatica',
      gaplessPlayback: 'reproducao_sem_pausas',
      crossfade: 'crossfade',
      showUnavailableSongs: 'mostrar_hinos_indisponiveis',
      downloadOverWifiOnly: 'download_wifi_only',
    };
    const field = map[key];
    if (!field) return;

    if (updateTimer.current) window.clearTimeout(updateTimer.current);
    updateTimer.current = window.setTimeout(async () => {
      try { await usuariosApi.update(Number(userId), { [field]: nextVal ? 1 : 0 } as any); } catch {}
    }, 300);
  };

  const handleSelectChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));

    const userId: any = (authUser as any)?.id || (profile as any)?.id;
    if (!userId) return;

    const map: Record<string, string> = {
      audioQuality: 'qualidade_audio',
      downloadQuality: 'qualidade_download',
    };
    const field = map[key];
    if (!field) return;

    if (updateTimer.current) window.clearTimeout(updateTimer.current);
    updateTimer.current = window.setTimeout(async () => {
      try { await usuariosApi.update(Number(userId), { [field]: value } as any); } catch {}
    }, 300);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {}
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    window.location.href = '/login';
  };

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={enabled}
        onChange={onChange}
      />
      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
    </label>
  );

  const SelectDropdown = ({ value, options, onChange }: { 
    value: string; 
    options: { value: string; label: string }[]; 
    onChange: (value: string) => void;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-background-tertiary border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

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
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-text-muted">Personalize sua experiência</p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-background-secondary rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img 
                  src={buildAvatarUrl({
                    id: String(((authUser as any)?.id) || ((profile as any)?.id) || ''),
                    avatar_url: user.avatar,
                    name: user.name
                  })}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-text-muted" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{user.name}</h2>
              <p className="text-text-muted text-sm">{user.email}</p>
            </div>
          </div>
          <Link
            to="/profile"
            className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
          >
            Ver perfil
          </Link>
        </div>
      </div>

      {/* Account Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-primary-400">Conta</h3>
        </div>
        
        <div className="bg-background-secondary rounded-xl divide-y divide-gray-700">
          <Link
            to="/edit-profile"
            className="flex items-center justify-between p-4 hover:bg-background-tertiary transition-colors"
          >
            <div>
              <h4 className="text-white font-medium">Editar perfil</h4>
              <p className="text-text-muted text-sm">Nome, email e foto</p>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted" />
          </Link>
          
          {premiumEnabled && (
            <Link
              to="/subscription"
              className="flex items-center justify-between p-4 hover:bg-background-tertiary transition-colors"
            >
              <div>
                <h4 className="text-white font-medium">Plano e assinatura</h4>
                <p className="text-text-muted text-sm">Premium</p>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted" />
            </Link>
          )}
          
          <Link
            to="/privacy"
            className="flex items-center justify-between p-4 hover:bg-background-tertiary transition-colors"
          >
            <div>
              <h4 className="text-white font-medium">Privacidade</h4>
              <p className="text-text-muted text-sm">Controle seus dados</p>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted" />
          </Link>
        </div>
      </div>

      {/* Audio Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-primary-400">Áudio</h3>
        </div>
        
        <div className="bg-background-secondary rounded-xl divide-y divide-gray-700">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Qualidade do áudio</h4>
                <p className="text-text-muted text-sm">Alta</p>
              </div>
              <SelectDropdown
                value={settings.audioQuality}
                options={[
                  { value: 'low', label: 'Baixa (96 kbps)' },
                  { value: 'normal', label: 'Normal (160 kbps)' },
                  { value: 'high', label: 'Alta (320 kbps)' }
                ]}
                onChange={(value) => handleSelectChange('audioQuality', value)}
              />
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Normalizar volume</h4>
                <p className="text-text-muted text-sm">Iguala o volume de diferentes hinos</p>
              </div>
              <ToggleSwitch
                enabled={settings.normalizeVolume}
                onChange={() => handleToggle('normalizeVolume')}
              />
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Crossfade</h4>
                <p className="text-text-muted text-sm">Transição suave entre hinos</p>
              </div>
              <ToggleSwitch
                enabled={settings.crossfade}
                onChange={() => handleToggle('crossfade')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Playback Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Play className="w-5 h-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-primary-400">Reprodução</h3>
        </div>
        
        <div className="bg-background-secondary rounded-xl divide-y divide-gray-700">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Reprodução automática</h4>
                <p className="text-text-muted text-sm">Continue ouvindo hinos similares</p>
              </div>
              <ToggleSwitch
                enabled={settings.autoplay}
                onChange={() => handleToggle('autoplay')}
              />
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Reprodução sem pausas</h4>
                <p className="text-text-muted text-sm">Elimina pausas entre faixas</p>
              </div>
              <ToggleSwitch
                enabled={settings.gaplessPlayback}
                onChange={() => handleToggle('gaplessPlayback')}
              />
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Mostrar hinos indisponíveis</h4>
                <p className="text-text-muted text-sm">Em playlists</p>
              </div>
              <ToggleSwitch
                enabled={settings.showUnavailableSongs}
                onChange={() => handleToggle('showUnavailableSongs')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Downloads Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-primary-400">Downloads</h3>
        </div>
        
        <div className="bg-background-secondary rounded-xl divide-y divide-gray-700">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Qualidade do download</h4>
                <p className="text-text-muted text-sm">Alta</p>
              </div>
              <SelectDropdown
                value={settings.downloadQuality}
                options={[
                  { value: 'normal', label: 'Normal (160 kbps)' },
                  { value: 'high', label: 'Alta (320 kbps)' }
                ]}
                onChange={(value) => handleSelectChange('downloadQuality', value)}
              />
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Download apenas via Wi-Fi</h4>
                <p className="text-text-muted text-sm">Economize dados móveis</p>
              </div>
              <ToggleSwitch
                enabled={settings.downloadOverWifiOnly}
                onChange={() => handleToggle('downloadOverWifiOnly')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="bg-background-secondary rounded-xl">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 text-red-500 hover:bg-red-500/10 transition-colors rounded-xl"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair da conta</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
