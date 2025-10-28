import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, RefreshCw, Download, Trash2, Eye, AlertTriangle } from 'lucide-react';
import ImportStatsCards from '@/pages/admin/components/imports/ImportStatsCards';
import ImportUploadModal from '@/pages/admin/components/imports/ImportUploadModal';

interface Import {
  id: string;
  name: string;
  description?: string;
  import_type: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  created_at: string;
}

const AdminImport: React.FC = () => {
  const [imports, setImports] = useState<Import[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    import_type: 'hymns',
    has_header: true,
    skip_duplicates: true,
    update_existing: false,
    validate_only: false
  });

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    totalRows: 0,
    successRate: 0
  });

  const importTypes = [
    { value: 'hymns', label: 'Hinos', icon: '🎵' },
    { value: 'albums', label: 'Álbuns', icon: '💿' },
    { value: 'playlists', label: 'Playlists', icon: '📋' },
    { value: 'composers', label: 'Compositores', icon: '👤' },
    { value: 'users', label: 'Usuários', icon: '👥' },
    { value: 'lyrics', label: 'Letras', icon: '📝' },
    { value: 'media', label: 'Mídias', icon: '🎬' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mock data
      const mockImports: Import[] = [
        {
          id: '1',
          name: 'Importação de Hinos 2025',
          description: 'Importação em massa de novos hinos',
          import_type: 'hymns',
          file_name: 'hinos_2025.csv',
          file_size: 256000,
          file_type: 'csv',
          status: 'completed',
          total_rows: 500,
          processed_rows: 500,
          successful_rows: 487,
          failed_rows: 13,
          started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          duration_seconds: 900,
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'Importação de Compositores',
          description: 'Base de dados de compositores históricos',
          import_type: 'composers',
          file_name: 'compositores.xlsx',
          file_size: 128000,
          file_type: 'xlsx',
          status: 'completed',
          total_rows: 150,
          processed_rows: 150,
          successful_rows: 150,
          failed_rows: 0,
          started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
          duration_seconds: 900,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Importação de Letras',
          description: 'Letras de hinos faltantes',
          import_type: 'lyrics',
          file_name: 'letras_hinos.json',
          file_size: 512000,
          file_type: 'json',
          status: 'processing',
          total_rows: 300,
          processed_rows: 156,
          successful_rows: 145,
          failed_rows: 11,
          started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString()
        }
      ];

      setImports(mockImports);
      
      const totalRows = mockImports.reduce((sum, i) => sum + i.total_rows, 0);
      const successfulRows = mockImports.reduce((sum, i) => sum + i.successful_rows, 0);

      setStats({
        total: mockImports.length,
        completed: mockImports.filter(i => i.status === 'completed').length,
        processing: mockImports.filter(i => i.status === 'processing').length,
        totalRows,
        successRate: totalRows > 0 ? (successfulRows / totalRows) * 100 : 0
      });

    } catch (err: any) {
      console.error('Error loading imports:', err);
      setError(err?.message || 'Erro ao carregar importações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.name) {
        setFormData({ ...formData, name: file.name.split('.')[0] });
      }
    }
  };

  const handleUpload = async () => {
    try {
      if (!selectedFile) {
        return;
      }

      if (!formData.name) {
        return;
      }

      // Simular upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowModal(false);
      setSelectedFile(null);
      setFormData({
        name: '',
        description: '',
        import_type: 'hymns',
        has_header: true,
        skip_duplicates: true,
        update_existing: false,
        validate_only: false
      });
      loadData();
    } catch (error) {
      console.error('Error starting import:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!confirm('Deseja realmente excluir este registro de importação?')) return;
      await new Promise(resolve => setTimeout(resolve, 500));
      loadData();
    } catch (error) {
      console.error('Error deleting import:', error);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      if (!confirm('Deseja realmente cancelar esta importação?')) return;
      await new Promise(resolve => setTimeout(resolve, 500));
      loadData();
    } catch (error) {
      console.error('Error cancelling import:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'gray',
      processing: 'yellow',
      completed: 'green',
      failed: 'red',
      cancelled: 'orange'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando importações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar importações</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => loadData()}
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
          <h1 className="text-3xl font-bold text-white mb-2">Importação em Massa</h1>
          <p className="text-gray-400">Importe dados de arquivos CSV, Excel ou JSON</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Atualizar
          </button>
          <Link
            to="/admin/import/criar"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Upload className="w-5 h-5" />
            Nova Importação
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <ImportStatsCards stats={stats} />

      {/* Imports List */}
      <div className="space-y-4">
        {imports.map((importItem) => (
          <div key={importItem.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-white font-semibold text-lg">{importItem.name}</h3>
                  <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full border bg-${getStatusColor(importItem.status)}-500/20 text-${getStatusColor(importItem.status)}-400 border-${getStatusColor(importItem.status)}-500/30`}>
                    {getStatusIcon(importItem.status)}
                    {importItem.status.charAt(0).toUpperCase() + importItem.status.slice(1)}
                  </span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                    {importTypes.find(t => t.value === importItem.import_type)?.icon} {importTypes.find(t => t.value === importItem.import_type)?.label}
                  </span>
                </div>
                {importItem.description && (
                  <p className="text-gray-400 text-sm mb-3">{importItem.description}</p>
                )}
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-gray-400">Arquivo: </span>
                    <span className="text-white">{importItem.file_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tamanho: </span>
                    <span className="text-white">{formatFileSize(importItem.file_size)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tipo: </span>
                    <span className="text-white uppercase">{importItem.file_type}</span>
                  </div>
                  {importItem.duration_seconds && (
                    <div>
                      <span className="text-gray-400">Duração: </span>
                      <span className="text-white">{formatDuration(importItem.duration_seconds)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {importItem.status === 'processing' && (
                  <button
                    onClick={() => handleCancel(importItem.id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Cancelar"
                  >
                    <XCircle className="w-4 h-4 text-orange-400" />
                  </button>
                )}
                <button
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Ver detalhes"
                >
                  <Eye className="w-4 h-4 text-blue-400" />
                </button>
                <button
                  onClick={() => handleDelete(importItem.id)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">
                  Progresso: {importItem.processed_rows} / {importItem.total_rows} registros
                </span>
                <span className="text-white font-medium">
                  {importItem.total_rows > 0 ? ((importItem.processed_rows / importItem.total_rows) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    importItem.status === 'completed' ? 'bg-green-500' :
                    importItem.status === 'failed' ? 'bg-red-500' :
                    importItem.status === 'processing' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}
                  style={{ width: `${importItem.total_rows > 0 ? (importItem.processed_rows / importItem.total_rows) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Total</p>
                <p className="text-white font-semibold text-lg">{importItem.total_rows}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Sucesso</p>
                <p className="text-green-400 font-semibold text-lg">{importItem.successful_rows}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Falhas</p>
                <p className="text-red-400 font-semibold text-lg">{importItem.failed_rows}</p>
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex items-center gap-6 pt-4 border-t border-gray-700 text-sm mt-4">
              <div>
                <span className="text-gray-400">Criada em: </span>
                <span className="text-white">{formatDate(importItem.created_at)}</span>
              </div>
              {importItem.started_at && (
                <div>
                  <span className="text-gray-400">Iniciada em: </span>
                  <span className="text-white">{formatDate(importItem.started_at)}</span>
                </div>
              )}
              {importItem.completed_at && (
                <div>
                  <span className="text-gray-400">Concluída em: </span>
                  <span className="text-white">{formatDate(importItem.completed_at)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {imports.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-xl">
          <Upload className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma importação encontrada</p>
          <p className="text-gray-500 text-sm">Faça sua primeira importação de dados</p>
        </div>
      )}

      {/* Modal de Upload */}
      <ImportUploadModal
        show={showModal}
        formData={formData}
        setFormData={setFormData}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        onClose={() => setShowModal(false)}
        onUpload={handleUpload}
        importTypes={importTypes}
        onFileChange={handleFileChange}
      />
    </div>
  );
};

export default AdminImport;
