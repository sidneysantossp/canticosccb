import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Database, HardDrive, Cloud } from 'lucide-react';

const BACKUP_TYPES = [
  { value: 'full', label: 'Backup Completo', icon: '💾', description: 'Banco de dados + arquivos de mídia' },
  { value: 'database', label: 'Apenas Banco de Dados', icon: '🗄️', description: 'Somente estrutura e dados SQL' },
  { value: 'media', label: 'Apenas Mídias', icon: '🎬', description: 'Somente arquivos de áudio/vídeo/imagens' },
  { value: 'config', label: 'Configurações', icon: '⚙️', description: 'Arquivos de configuração do sistema' }
];

const STORAGE_LOCATIONS = [
  { value: 'local', label: 'Local', icon: <HardDrive className="w-5 h-5" />, description: 'Salvar no servidor' },
  { value: 'cloud', label: 'Cloud Storage', icon: <Cloud className="w-5 h-5" />, description: 'Enviar para cloud' },
  { value: 'download', label: 'Download', icon: <Database className="w-5 h-5" />, description: 'Baixar agora' }
];

const AdminBackupForm: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    backup_type: 'full',
    storage_location: 'local',
    compress: true,
    encrypt: false,
    include_logs: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateBackupName = () => {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
    const type = BACKUP_TYPES.find(t => t.value === formData.backup_type)?.label || 'backup';
    return `backup_${type.toLowerCase().replace(/\s+/g, '_')}_${dateStr}_${timeStr}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const backupData = {
        name: formData.name.trim() || generateBackupName(),
        backup_type: formData.backup_type,
        storage_location: formData.storage_location,
        compress: formData.compress,
        encrypt: formData.encrypt,
        include_logs: formData.include_logs
      };

      // TODO: Implementar criação de backup quando backend estiver pronto
      // await createBackup(backupData);

      navigate('/admin/backup');
    } catch (error: any) {
      console.error('Erro ao criar backup:', error);
      setError(error?.message || 'Erro ao criar backup');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin/backup"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Criar Backup</h1>
            <p className="text-gray-400 mt-1">Configure e gere backup do sistema</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome do Backup */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Nome do Backup</h2>
            
            <div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Deixe vazio para gerar automaticamente"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
              />
              <p className="text-gray-500 text-xs mt-2">
                Sugestão: {generateBackupName()}
              </p>
            </div>
          </div>

          {/* Tipo de Backup */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Tipo de Backup
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BACKUP_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.backup_type === type.value
                      ? 'border-green-600 bg-green-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="backup_type"
                    value={type.value}
                    checked={formData.backup_type === type.value}
                    onChange={(e) => setFormData({ ...formData, backup_type: e.target.value })}
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

          {/* Local de Armazenamento */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Local de Armazenamento</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {STORAGE_LOCATIONS.map((location) => (
                <label
                  key={location.value}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.storage_location === location.value
                      ? 'border-green-600 bg-green-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="storage_location"
                    value={location.value}
                    checked={formData.storage_location === location.value}
                    onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="flex justify-center mb-2 text-gray-400">
                      {location.icon}
                    </div>
                    <p className="text-white font-semibold">{location.label}</p>
                    <p className="text-gray-400 text-xs mt-1">{location.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Opções Avançadas */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Opções Avançadas</h2>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-white font-medium">Comprimir backup</p>
                  <p className="text-gray-400 text-sm">Gerar arquivo .zip comprimido</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.compress}
                  onChange={(e) => setFormData({ ...formData, compress: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-white font-medium">Criptografar backup</p>
                  <p className="text-gray-400 text-sm">Proteger com senha (AES-256)</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.encrypt}
                  onChange={(e) => setFormData({ ...formData, encrypt: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-white font-medium">Incluir logs</p>
                  <p className="text-gray-400 text-sm">Incluir arquivos de log do sistema</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.include_logs}
                  onChange={(e) => setFormData({ ...formData, include_logs: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 sticky bottom-6 bg-gray-950/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <Link
              to="/admin/backup"
              className="flex-1 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Criar Backup</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminBackupForm;
