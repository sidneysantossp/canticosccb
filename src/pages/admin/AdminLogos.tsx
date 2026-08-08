import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, X, Eye } from 'lucide-react';
import {
  getAllLogos,
  updateLogo,
  uploadLogoImage,
  getImageDimensions,
  Logo,
  LogoType
} from '@/lib/admin/logosAdminApi';
import { debugStorageTest } from '@/lib/admin/debugStorageTest';

const AdminLogos: React.FC = () => {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadLogos();
    
    // Expor função de debug no console
    if (typeof window !== 'undefined') {
      (window as any).debugStorage = debugStorageTest;
      console.log('🔧 Debug disponível: digite debugStorage() no console para testar o storage');
    }
  }, []);

  // Sempre que as logos forem carregadas/alteradas, persistir a principal em sessionStorage
  useEffect(() => {
    try {
      const primary = logos.find(l => l.type === 'primary');
      if (primary?.url) {
        sessionStorage.setItem('primaryLogoUrl', primary.url);
        localStorage.setItem('primaryLogoUrl', primary.url);
      }
      const favicon = logos.find(l => l.type === 'favicon');
      if (favicon?.url) {
        sessionStorage.setItem('faviconLogoUrl', favicon.url);
        localStorage.setItem('faviconLogoUrl', favicon.url);
      }
    } catch {}
  }, [logos]);

  const loadLogos = async () => {
    try {
      setIsLoading(true);
      
      const data = await Promise.race([
        getAllLogos(),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      
      if (data && data.length > 0) {
        setLogos(data);
      } else {
        setLogos([]);
      }
    } catch (error) {
      console.warn('Erro ao carregar logos:', error);
      setLogos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, logoType: LogoType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    try {
      setIsUploading(true);
      
      // Obter dimensões da imagem
      const dimensions = await getImageDimensions(file);
      
      // Preview local imediato
      const localUrl = URL.createObjectURL(file);
      setLogos(prev => prev.map(logo => 
        logo.type === logoType
          ? { ...logo, url: localUrl, width: dimensions.width, height: dimensions.height, updated_at: new Date().toISOString() }
          : logo
      ));
      
      // Tentar upload real
      try {
        console.log('🔄 Tentando upload para storage...');
        
        const imageUrl = await uploadLogoImage(file, logoType);
        console.log('✅ Upload concluído:', imageUrl);
        
        // Atualizar logo no banco
        await updateLogo(logoType, {
          url: imageUrl,
          width: dimensions.width,
          height: dimensions.height
        });
        
        console.log('✅ Banco de dados atualizado');
        
        // Recarregar para pegar a URL real
        await loadLogos();
      } catch (uploadError: any) {
        console.error('❌ Erro no upload:', uploadError);

      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      primary: 'Principal',
      secondary: 'Secundário',
      favicon: 'Favicon',
      social: 'Redes Sociais'
    };
    return labels[type] || type;
  };

  const getTypeDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      primary: 'Logo principal usado no header e páginas claras',
      secondary: 'Logo alternativo para fundos escuros',
      favicon: 'Ícone exibido na aba do navegador',
      social: 'Imagem para compartilhamento em redes sociais (Open Graph)'
    };
    return descriptions[type] || '';
  };

  const getRecommendedSize = (type: string) => {
    const sizes: Record<string, string> = {
      primary: '300x80px',
      secondary: '300x80px',
      favicon: '64x64px ou 32x32px',
      social: '1200x630px'
    };
    return sizes[type] || '';
  };

  // Removed page-level loading to render instantly

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Logos</h1>
        <p className="text-gray-400">Configure as logos e ícones do site</p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <ImageIcon className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-blue-400 font-medium mb-1">Dicas para logos:</p>
            <ul className="text-blue-300 text-sm space-y-1">
              <li>• Use PNG com fundo transparente para melhor qualidade</li>
              <li>• Mantenha proporções adequadas para cada tipo</li>
              <li>• Tamanho máximo: 2MB por arquivo</li>
              <li>• O favicon deve ser quadrado (64x64px ou 32x32px)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Logos Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {logos.map((logo) => (
          <div
            key={logo.id}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">{logo.name}</h3>
                <span className="inline-block px-3 py-1 mt-2 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-400 border border-primary-500/30">
                  {getTypeLabel(logo.type)}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-sm mb-4">
              {getTypeDescription(logo.type)}
            </p>

            {/* Preview */}
            <div className="bg-gray-800/50 rounded-lg p-6 mb-4 flex items-center justify-center min-h-[200px]">
              <div className="relative">
                <img
                  src={logo.url}
                  alt={logo.name}
                  className="max-w-full max-h-[180px] object-contain"
                  style={{ 
                    maxWidth: logo.type === 'favicon' ? '64px' : '300px'
                  }}
                />
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tamanho recomendado:</span>
                <span className="text-gray-300 font-medium">{getRecommendedSize(logo.type)}</span>
              </div>
              {logo.width && logo.height && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tamanho atual:</span>
                  <span className="text-gray-300 font-medium">{logo.width}x{logo.height}px</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Última atualização:</span>
                <span className="text-gray-300 font-medium">
                  {new Date(logo.updated_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, logo.type)}
                  disabled={isUploading}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white cursor-pointer transition-colors disabled:opacity-50">
                  <Upload className="w-4 h-4" />
                  <span>Alterar Logo</span>
                </div>
              </label>

              <button
                onClick={() => handlePreview(logo.url)}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                title="Visualizar em tamanho real"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-12 right-0 p-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-white font-semibold text-lg mb-4">Formatos Suportados</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-800/50 rounded-lg">
            <p className="text-gray-300 font-medium">PNG</p>
            <p className="text-gray-500 text-sm">Recomendado</p>
          </div>
          <div className="text-center p-4 bg-gray-800/50 rounded-lg">
            <p className="text-gray-300 font-medium">SVG</p>
            <p className="text-gray-500 text-sm">Vetorial</p>
          </div>
          <div className="text-center p-4 bg-gray-800/50 rounded-lg">
            <p className="text-gray-300 font-medium">JPG</p>
            <p className="text-gray-500 text-sm">Aceito</p>
          </div>
          <div className="text-center p-4 bg-gray-800/50 rounded-lg">
            <p className="text-gray-300 font-medium">ICO</p>
            <p className="text-gray-500 text-sm">Favicon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogos;
