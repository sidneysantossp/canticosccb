import React, { useState, useEffect } from 'react';
import { Palette, Type, Save, RotateCcw, Eye, Moon, Sun, AlertTriangle } from 'lucide-react';
import { getSiteConfigMap, upsertSiteConfigEntries } from '@/lib/admin/adminTableUtils';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
}

interface ThemeSettings {
  colors: ThemeColors;
  fontFamily: string;
  fontSize: string;
  borderRadius: string;
  mode: 'light' | 'dark';
  applyPublicTheme: boolean;
}

const AdminTheme: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const defaultTheme: ThemeSettings = {
    colors: {
      primary: '#1db954',
      secondary: '#16a34a',
      accent: '#4ade80',
      background: '#121212',
      text: '#ffffff',
      border: '#374151'
    },
    fontFamily: 'Inter',
    fontSize: '16px',
    borderRadius: '8px',
    mode: 'dark',
    applyPublicTheme: false,
  };

  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const config = await getSiteConfigMap(['admin_theme_settings']);
        const rawTheme = config.admin_theme_settings;

        if (rawTheme) {
          const parsed = JSON.parse(rawTheme);
          setTheme({
            ...defaultTheme,
            ...parsed,
            applyPublicTheme: parsed?.applyPublicTheme === true,
            colors: {
              ...defaultTheme.colors,
              ...(parsed?.colors || {}),
            },
          });
        }
        setIsLoading(false);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar configura\u00e7\u00f5es do tema');
        setIsLoading(false);
      }
    };

    void loadTheme();
  }, []);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setTheme({
      ...theme,
      colors: {
        ...theme.colors,
        [key]: value
      }
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await upsertSiteConfigEntries({
        admin_theme_settings: JSON.stringify(theme),
      });
      setSuccess('Tema salvo com sucesso.');
      window.setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
      setError('Erro ao salvar configurações do tema.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm('Restaurar tema padrão? Isso irá desfazer todas as personalizações.')) return;
    setTheme(defaultTheme);
  };

  const fontOptions = [
    { value: 'Inter', label: 'Inter (Padrão)' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Montserrat', label: 'Montserrat' }
  ];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando configurações do tema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar tema</h2>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Personalizar Tema</h1>
          <p className="text-gray-400">Configure cores, fontes e aparência do site</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Eye className="w-5 h-5" />
            {previewMode ? 'Fechar Preview' : 'Preview'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Restaurar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>Salvar Tema</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-400">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações */}
        <div className="lg:col-span-2 space-y-6">
          {/* Modo de Tema */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              {theme.mode === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              Modo de Tema
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => setTheme({ ...theme, mode: 'light' })}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  theme.mode === 'light'
                    ? 'border-primary-600 bg-primary-600/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <Sun className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-white font-medium">Claro</p>
              </button>
              <button
                onClick={() => setTheme({ ...theme, mode: 'dark' })}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  theme.mode === 'dark'
                    ? 'border-primary-600 bg-primary-600/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <Moon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-white font-medium">Escuro</p>
              </button>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold text-lg mb-2 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Tema Público
            </h3>
            <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-4">
              <div className="text-white font-medium mb-1">Identidade visual oficial protegida</div>
              <div className="text-sm text-gray-400">
                O site público está travado no tema oficial verde/preto para evitar sobrescritas globais acidentais.
                As configurações abaixo continuam úteis como referência e preview administrativo.
              </div>
            </div>
          </div>

          {/* Cores */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Paleta de Cores
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cor Primária
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.colors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.colors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cor Secundária
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.colors.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.colors.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cor de Destaque
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.colors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.colors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fundo
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.colors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.colors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Texto
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.colors.text}
                    onChange={(e) => handleColorChange('text', e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.colors.text}
                    onChange={(e) => handleColorChange('text', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bordas
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.colors.border}
                    onChange={(e) => handleColorChange('border', e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.colors.border}
                    onChange={(e) => handleColorChange('border', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tipografia */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <Type className="w-5 h-5" />
              Tipografia
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Família da Fonte
                </label>
                <select
                  value={theme.fontFamily}
                  onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  {fontOptions.map(font => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tamanho Base
                </label>
                <select
                  value={theme.fontSize}
                  onChange={(e) => setTheme({ ...theme, fontSize: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="14px">Pequeno (14px)</option>
                  <option value="16px">Médio (16px)</option>
                  <option value="18px">Grande (18px)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Arredondamento
                </label>
                <select
                  value={theme.borderRadius}
                  onChange={(e) => setTheme({ ...theme, borderRadius: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="4px">Mínimo (4px)</option>
                  <option value="8px">Médio (8px)</option>
                  <option value="12px">Grande (12px)</option>
                  <option value="16px">Muito Grande (16px)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 sticky top-6">
            <h3 className="text-white font-semibold text-lg mb-4">Preview</h3>
            <div 
              className="space-y-4 p-4 rounded-lg"
              style={{
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius,
                fontFamily: theme.fontFamily,
                fontSize: theme.fontSize
              }}
            >
              <div>
                <button
                  className="w-full px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: '#ffffff',
                    borderRadius: theme.borderRadius
                  }}
                >
                  Botão Primário
                </button>
              </div>

              <div>
                <button
                  className="w-full px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    color: theme.colors.text,
                    borderRadius: theme.borderRadius
                  }}
                >
                  Botão Secundário
                </button>
              </div>

              <div
                className="p-4 rounded-lg"
                style={{
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius
                }}
              >
                <p style={{ color: theme.colors.text }}>
                  Texto de exemplo com a fonte {theme.fontFamily}
                </p>
              </div>

              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: theme.colors.accent,
                  color: '#ffffff',
                  borderRadius: theme.borderRadius
                }}
              >
                <p className="font-medium">Card de Destaque</p>
                <p className="text-sm opacity-90">Usando cor de destaque</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">
                As alterações são aplicadas em tempo real no preview acima
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTheme;
