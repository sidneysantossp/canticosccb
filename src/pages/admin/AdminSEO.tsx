import React, { useState, useEffect } from 'react';
import { Search, Save, Globe, FileText, Code, BarChart, AlertTriangle } from 'lucide-react';

const AdminSEO: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [settings, setSettings] = useState({
    // Meta Tags
    site_title: 'Cânticos CCB',
    site_description: 'Plataforma completa de hinos e cânticos da Congregação Cristã no Brasil',
    site_keywords: 'hinos ccb, cânticos ccb, hinário ccb, congregação cristã',
    site_url: 'https://canticosccb.com.br',
    
    // Open Graph
    og_title: 'Cânticos CCB',
    og_description: 'Plataforma completa de hinos e cânticos da Congregação Cristã no Brasil',
    og_image: 'https://canticosccb.com.br/og-image.jpg',
    
    // Twitter
    twitter_card: 'summary_large_image',
    twitter_site: '@canticosccb',
    
    // Robots
    robots_index: true,
    robots_follow: true,
    robots_txt: 'User-agent: *\nDisallow: /admin/\nAllow: /\n\nSitemap: https://canticosccb.com.br/sitemap.xml',
    
    // Schema
    schema_name: 'Cânticos CCB',
    schema_type: 'Organization',
    
    // Analytics
    google_analytics_id: '',
    google_search_console_id: ''
  });

  useEffect(() => {
    // Simulate loading SEO settings from API
    const timer = setTimeout(() => {
      try {
        // In production, load from API: const data = await getSEOSettings();
        setIsLoading(false);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar configura\u00e7\u00f5es de SEO');
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
    } catch (error) {
      console.error('Error saving SEO settings:', error);
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
                  placeholder="https://canticosccb.com.br"
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
                    placeholder="https://canticosccb.com.br/og-image.jpg"
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
