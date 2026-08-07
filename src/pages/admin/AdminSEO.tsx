import React, { useState, useEffect } from 'react';
import { Search, Save, Globe, FileText, Code, BarChart, AlertTriangle } from 'lucide-react';
import { getSiteConfigMap, parseBooleanConfig, upsertSiteConfigEntries } from '@/lib/admin/adminTableUtils';
import { DEFAULT_SITE_URL, normalizeAssetUrl, normalizeSiteUrl } from '@/utils/siteUrl';

const normalizeRobotsText = (value: string) => value
  .replace(/https:\/\/canticosccb\.com\.br\/robots\.txt/gi, `${DEFAULT_SITE_URL}/robots.txt`)
  .replace(/https:\/\/canticosccb\.com\.br\/sitemap\.xml/gi, `${DEFAULT_SITE_URL}/sitemap.xml`);

const AdminSEO: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  const [settings, setSettings] = useState({
    // Meta Tags
    site_title: 'Cânticos CCB',
    site_description: 'Plataforma independente de hinos, cifras, compositores e playlists relacionados à CCB',
    site_keywords: 'hinos ccb, cânticos ccb, hinário ccb, congregação cristã',
    site_url: DEFAULT_SITE_URL,
    
    // Open Graph
    og_title: 'Cânticos CCB',
    og_description: 'Plataforma independente de hinos, cifras, compositores e playlists relacionados à CCB',
    og_image: `${DEFAULT_SITE_URL}/logo-canticos-ccb.png`,
    
    // Twitter
    twitter_card: 'summary_large_image',
    twitter_site: '@canticosccb',
    
    // Robots
    robots_index: true,
    robots_follow: true,
    robots_txt: `User-agent: *\nDisallow: /admin/\nAllow: /\n\nSitemap: ${DEFAULT_SITE_URL}/sitemap.xml`,
    
    // Schema
    schema_name: 'Cânticos CCB',
    schema_type: 'Organization',
    
    // Analytics
    google_analytics_id: '',
    google_search_console_id: ''
  });

  useEffect(() => {
    const loadSeoSettings = async () => {
      try {
        const config = await getSiteConfigMap([
          'site_title',
          'site_description',
          'site_keywords',
          'site_url',
          'og_title',
          'og_description',
          'og_image',
          'twitter_card',
          'twitter_site',
          'robots_index',
          'robots_follow',
          'robots_txt',
          'schema_name',
          'schema_type',
          'google_analytics_id',
          'google_search_console_id'
        ]);

        setSettings((current) => ({
          ...current,
          site_title: config.site_title || current.site_title,
          site_description: config.site_description || current.site_description,
          site_keywords: config.site_keywords || current.site_keywords,
          site_url: normalizeSiteUrl(config.site_url || current.site_url, current.site_url),
          og_title: config.og_title || current.og_title,
          og_description: config.og_description || current.og_description,
          og_image: normalizeAssetUrl(config.og_image || current.og_image),
          twitter_card: config.twitter_card || current.twitter_card,
          twitter_site: config.twitter_site || current.twitter_site,
          robots_index: parseBooleanConfig(config.robots_index, current.robots_index),
          robots_follow: parseBooleanConfig(config.robots_follow, current.robots_follow),
          robots_txt: normalizeRobotsText(config.robots_txt || current.robots_txt),
          schema_name: config.schema_name || current.schema_name,
          schema_type: config.schema_type || current.schema_type,
          google_analytics_id: config.google_analytics_id || current.google_analytics_id,
          google_search_console_id: config.google_search_console_id || current.google_search_console_id,
        }));
        setIsLoading(false);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar configura\u00e7\u00f5es de SEO');
        setIsLoading(false);
      }
    };

    void loadSeoSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      setError(null);
      const normalizedSiteUrl = normalizeSiteUrl(settings.site_url, settings.site_url);
      const normalizedOgImage = normalizeAssetUrl(settings.og_image);
      const normalizedRobotsTxt = normalizeRobotsText(settings.robots_txt);

      await upsertSiteConfigEntries({
        site_title: settings.site_title,
        site_description: settings.site_description,
        site_keywords: settings.site_keywords,
        site_url: normalizedSiteUrl,
        og_title: settings.og_title,
        og_description: settings.og_description,
        og_image: normalizedOgImage,
        twitter_card: settings.twitter_card,
        twitter_site: settings.twitter_site,
        robots_index: settings.robots_index,
        robots_follow: settings.robots_follow,
        robots_txt: normalizedRobotsTxt,
        schema_name: settings.schema_name,
        schema_type: settings.schema_type,
        google_analytics_id: settings.google_analytics_id,
        google_search_console_id: settings.google_search_console_id,
      });
      setSettings((current) => ({
        ...current,
        site_url: normalizedSiteUrl,
        og_image: normalizedOgImage,
        robots_txt: normalizedRobotsTxt,
      }));
      setSuccess('Configurações de SEO salvas com sucesso.');
      window.setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      setError('Erro ao salvar configurações de SEO');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Meta Tags', icon: FileText },
    { id: 'social', label: 'Redes Sociais', icon: Globe },
    { id: 'robots', label: 'Robots', icon: Search },
    { id: 'schema', label: 'Schema.org', icon: Code },
    { id: 'analytics', label: 'Analytics', icon: BarChart }
  ];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando configurações de SEO...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar SEO</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Configurações de SEO</h1>
          <p className="text-gray-400">Otimize seu site para motores de busca</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
        >
          <Save className="w-5 h-5" />Salvar
        </button>
      </div>

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                activeTab === t.id ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        {/* Meta Tags Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Meta Tags Gerais
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título do Site * <span className="text-gray-500">(50-60 caracteres)</span>
                </label>
                <input
                  type="text"
                  value={settings.site_title}
                  onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  maxLength={60}
                />
                <p className="text-gray-500 text-xs mt-1">{settings.site_title.length}/60 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição do Site * <span className="text-gray-500">(150-160 caracteres)</span>
                </label>
                <textarea
                  value={settings.site_description}
                  onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600 h-24"
                  maxLength={160}
                />
                <p className="text-gray-500 text-xs mt-1">{settings.site_description.length}/160 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Palavras-chave <span className="text-gray-500">(separadas por vírgula)</span>
                </label>
                <input
                  type="text"
                  value={settings.site_keywords}
                  onChange={(e) => setSettings({ ...settings, site_keywords: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  placeholder="hinos, cânticos, ccb"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL do Site
                </label>
                <input
                  type="url"
                  value={settings.site_url}
                  onChange={(e) => setSettings({ ...settings, site_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  placeholder={DEFAULT_SITE_URL}
                />
              </div>
            </div>
          </div>
        )}

        {/* Social Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Open Graph (Facebook, LinkedIn)
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    OG: Título
                  </label>
                  <input
                    type="text"
                    value={settings.og_title}
                    onChange={(e) => setSettings({ ...settings, og_title: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    OG: Descrição
                  </label>
                  <textarea
                    value={settings.og_description}
                    onChange={(e) => setSettings({ ...settings, og_description: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600 h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    OG: Imagem <span className="text-gray-500">(1200x630px recomendado)</span>
                  </label>
                  <input
                    type="url"
                    value={settings.og_image}
                    onChange={(e) => setSettings({ ...settings, og_image: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder={`${DEFAULT_SITE_URL}/og-image.jpg`}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-800">
              <h3 className="text-white font-semibold text-lg mb-4">
                Twitter Card
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tipo de Card
                    </label>
                    <select
                      value={settings.twitter_card}
                      onChange={(e) => setSettings({ ...settings, twitter_card: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    >
                      <option value="summary">Summary</option>
                      <option value="summary_large_image">Summary Large Image</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Twitter Site
                    </label>
                    <input
                      type="text"
                      value={settings.twitter_site}
                      onChange={(e) => setSettings({ ...settings, twitter_site: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                      placeholder="@canticosccb"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Robots Tab */}
        {activeTab === 'robots' && (
          <div className="space-y-6">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Configurações de Indexação
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
                <input
                  type="checkbox"
                  id="robots_index"
                  checked={settings.robots_index}
                  onChange={(e) => setSettings({ ...settings, robots_index: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="robots_index" className="text-white cursor-pointer flex-1">
                  <div className="font-medium">Permitir Indexação (Index)</div>
                  <div className="text-gray-400 text-sm">Permite que motores de busca indexem o site</div>
                </label>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
                <input
                  type="checkbox"
                  id="robots_follow"
                  checked={settings.robots_follow}
                  onChange={(e) => setSettings({ ...settings, robots_follow: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="robots_follow" className="text-white cursor-pointer flex-1">
                  <div className="font-medium">Seguir Links (Follow)</div>
                  <div className="text-gray-400 text-sm">Permite que motores de busca sigam os links do site</div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Robots.txt
                </label>
                <textarea
                  value={settings.robots_txt}
                  onChange={(e) => setSettings({ ...settings, robots_txt: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600 font-mono text-sm h-32"
                  placeholder="User-agent: *&#10;Disallow: /admin/"
                />
                <p className="text-gray-500 text-xs mt-1">Este conteúdo será usado no arquivo /robots.txt</p>
              </div>
            </div>
          </div>
        )}

        {/* Schema Tab */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Schema.org (Dados Estruturados)
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome da Organização
                </label>
                <input
                  type="text"
                  value={settings.schema_name}
                  onChange={(e) => setSettings({ ...settings, schema_name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Organização
                </label>
                <select
                  value={settings.schema_type}
                  onChange={(e) => setSettings({ ...settings, schema_type: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                >
                  <option value="Organization">Organization</option>
                  <option value="MusicGroup">Music Group</option>
                  <option value="WebSite">Website</option>
                </select>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Preview do Schema JSON-LD:</h4>
                <pre className="text-gray-300 text-xs bg-gray-900 p-3 rounded overflow-x-auto">
{`{
  "@context": "https://schema.org",
  "@type": "${settings.schema_type}",
  "name": "${settings.schema_name}",
  "url": "${settings.site_url}",
  "description": "${settings.site_description}"
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Analytics e Tracking
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Google Analytics ID
                </label>
                <input
                  type="text"
                  value={settings.google_analytics_id}
                  onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Google Search Console ID
                </label>
                <input
                  type="text"
                  value={settings.google_search_console_id}
                  onChange={(e) => setSettings({ ...settings, google_search_console_id: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  placeholder="google-site-verification=..."
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  <strong>Dica:</strong> Após configurar, adicione os códigos de tracking no head do seu site para começar a coletar dados.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSEO;
