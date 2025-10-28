import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Database } from 'lucide-react';

const EXPORT_TYPES = [
  { value: 'hymns', label: 'Hinos', icon: '🎵', description: 'Exportar todos os hinos' },
  { value: 'albums', label: 'Álbuns', icon: '💿', description: 'Exportar álbuns e faixas' },
  { value: 'playlists', label: 'Playlists', icon: '📋', description: 'Exportar playlists criadas' },
  { value: 'composers', label: 'Compositores', icon: '👤', description: 'Exportar compositores' },
  { value: 'users', label: 'Usuários', icon: '👥', description: 'Exportar base de usuários' },
  { value: 'complete', label: 'Backup Completo', icon: '💾', description: 'Exportar todos os dados' }
];

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', description: 'Arquivo separado por vírgulas' },
  { value: 'xlsx', label: 'Excel', description: 'Planilha Excel (.xlsx)' },
  { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
  { value: 'sql', label: 'SQL', description: 'Script SQL com INSERT' }
];

const AdminExportForm: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    export_type: 'hymns',
    format: 'csv',
    include_relations: true,
    include_media_links: true,
    compress_file: false
  });

  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setError(null);

    try {
      // TODO: Implementar exportação quando backend estiver pronto
      // const result = await createExport(formData);
      // window.location.href = result.download_url;

      setTimeout(() => {
        navigate('/admin/export');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      setError(error?.message || 'Erro ao gerar exportação');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedType = EXPORT_TYPES.find(t => t.value === formData.export_type);
  const selectedFormat = EXPORT_FORMATS.find(f => f.value === formData.format);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin/export"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Nova Exportação</h1>
            <p className="text-gray-400 mt-1">Exporte dados em diversos formatos</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Exportação */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Tipo de Exportação
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXPORT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.export_type === type.value
                      ? 'border-green-600 bg-green-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="export_type"
                    value={type.value}
                    checked={formData.export_type === type.value}
                    onChange={(e) => setFormData({ ...formData, export_type: e.target.value })}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{type.label}</p>
                      <p className="text-gray-400 text-sm">{type.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Formato de Exportação */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Formato do Arquivo
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXPORT_FORMATS.map((format) => (
                <label
                  key={format.value}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.format === format.value
                      ? 'border-green-600 bg-green-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={formData.format === format.value}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="sr-only"
                  />
                  <div>
                    <p className="text-white font-semibold">{format.label}</p>
                    <p className="text-gray-400 text-sm">{format.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Opções de Exportação */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Opções</h2>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-white font-medium">Incluir relações</p>
                  <p className="text-gray-400 text-sm">Incluir dados relacionados (ex: álbuns de hinos)</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.include_relations}
                  onChange={(e) => setFormData({ ...formData, include_relations: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-white font-medium">Incluir links de mídia</p>
                  <p className="text-gray-400 text-sm">Incluir URLs de áudios, imagens e vídeos</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.include_media_links}
                  onChange={(e) => setFormData({ ...formData, include_media_links: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-white font-medium">Comprimir arquivo</p>
                  <p className="text-gray-400 text-sm">Gerar arquivo .zip comprimido</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.compress_file}
                  onChange={(e) => setFormData({ ...formData, compress_file: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-blue-400 text-sm">
              <strong>📦 Arquivo:</strong> {selectedType?.label || ''} - {selectedFormat?.label || ''}
              {formData.compress_file && ' (comprimido)'}
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 sticky bottom-6 bg-gray-950/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <Link
              to="/admin/export"
              className="flex-1 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isExporting}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Gerar Exportação</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminExportForm;
