import React, { useState, useEffect } from 'react';
import { Plug, Youtube, Save, CheckCircle, Eye, EyeOff, AlertTriangle, Loader } from 'lucide-react';
import { supabaseFetch, supabaseUpdate, supabaseInsert } from '@/lib/supabaseRest';

const AdminSettingsIntegrations: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);

  const [config, setConfig] = useState({
    analytics_enabled: false,
    google_analytics_id: '',
    facebook_pixel_id: '',
    youtube_api_key: '',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const rows = await supabaseFetch<any>('site_config', {
        config_key: 'in.(analytics_enabled,google_analytics_id,facebook_pixel_id,youtube_api_key)',
        select: 'config_key,config_value',
      });

      const configMap: Record<string, string> = {};
      for (const row of rows) {
        configMap[row.config_key] = row.config_value;
      }

      setConfig({
        analytics_enabled: configMap.analytics_enabled === 'true',
        google_analytics_id: configMap.google_analytics_id || '',
        facebook_pixel_id: configMap.facebook_pixel_id || '',
        youtube_api_key: configMap.youtube_api_key || '',
      });
    } catch (err: any) {
      console.error('Error loading integrations config:', err);
      setError(err?.message || 'Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfigKey = async (key: string, value: string) => {
    try {
      // Verificar se já existe
      const existing = await supabaseFetch<any>('site_config', {
        config_key: `eq.${key}`,
        select: 'id',
        limit: '1',
      });

      if (existing.length > 0) {
        await supabaseUpdate('site_config', { config_key: `eq.${key}` }, { config_value: value });
      } else {
        await supabaseInsert('site_config', { config_key: key, config_value: value });
      }
    } catch (err) {
      console.error(`Error saving config key ${key}:`, err);
      throw err;
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      await saveConfigKey('analytics_enabled', String(config.analytics_enabled));
      await saveConfigKey('google_analytics_id', config.google_analytics_id);
      await saveConfigKey('facebook_pixel_id', config.facebook_pixel_id);
      await saveConfigKey('youtube_api_key', config.youtube_api_key);

      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving integrations config:', err);
      setError(err?.message || 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando integrações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-400 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Integrações e Analytics */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Plug className="w-5 h-5" />
          Integrações e Analytics
        </h3>

        <div className="space-y-4">
          {/* Analytics Toggle */}
          <div className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div>
              <h4 className="text-white font-semibold">Analytics Habilitado</h4>
              <p className="text-gray-400 text-sm">Ativar coleta de dados de analytics</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.analytics_enabled}
                onChange={(e) => setConfig({ ...config, analytics_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Google Analytics + Facebook Pixel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">Google Analytics ID</label>
              <input
                type="text"
                value={config.google_analytics_id}
                onChange={(e) => setConfig({ ...config, google_analytics_id: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                placeholder="G-XXXXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">Facebook Pixel ID</label>
              <input
                type="text"
                value={config.facebook_pixel_id}
                onChange={(e) => setConfig({ ...config, facebook_pixel_id: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                placeholder="123456789012345"
              />
            </div>
          </div>
        </div>
      </div>

      {/* YouTube API */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-500" />
          YouTube Data API
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">YouTube API Key</label>
            <div className="relative">
              <input
                type={showYoutubeKey ? 'text' : 'password'}
                value={config.youtube_api_key}
                onChange={(e) => setConfig({ ...config, youtube_api_key: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-green-600"
                placeholder="AIzaSy..."
              />
              <button
                type="button"
                onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showYoutubeKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Necessária para importação de hinos via YouTube. Obtenha sua chave em{' '}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Google Cloud Console
              </a>
            </p>
          </div>

          {config.youtube_api_key && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">YouTube API Key configurada</span>
            </div>
          )}

          {!config.youtube_api_key && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm">YouTube API Key não configurada. A importação de hinos via YouTube não funcionará.</span>
            </div>
          )}
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
        >
          {isSaving ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salvar Integrações
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsIntegrations;
