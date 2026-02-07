import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, CheckCircle, XCircle, RefreshCw, Trash2, Clock, AlertTriangle } from 'lucide-react';

interface Export {
  id: string;
  name: string;
  description?: string;
  export_type: string;
  format: string;
  file_name?: string;
  file_size?: number;
  file_url?: string;
  download_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  total_records: number;
  processed_records: number;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
  created_at: string;
}

const AdminExport: React.FC = () => {
  const [exports, setExports] = useState<Export[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    export_type: 'hymns',
    format: 'xlsx',
    include_headers: true,
    compress: false
  });

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    totalDownloads: 0
  });

  const exportTypes = [
    { value: 'hymns', label: 'Hinos', icon: '🎵' },
    { value: 'albums', label: 'Álbuns', icon: '💿' },
    { value: 'playlists', label: 'Playlists', icon: '📋' },
    { value: 'composers', label: 'Compositores', icon: '👤' },
    { value: 'users', label: 'Usuários', icon: '👥' },
    { value: 'lyrics', label: 'Letras', icon: '📝' },
    { value: 'media', label: 'Mídias', icon: '🎬' },
    { value: 'reports', label: 'Relatórios', icon: '📊' },
    { value: 'analytics', label: 'Analytics', icon: '📈' }
  ];

  const formats = [
    { value: 'csv', label: 'CSV', icon: '📄' },
    { value: 'xlsx', label: 'Excel (XLSX)', icon: '📊' },
    { value: 'json', label: 'JSON', icon: '{ }' },
    { value: 'xml', label: 'XML', icon: '<>' },
    { value: 'pdf', label: 'PDF', icon: '📕' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Integrar com tabela 'exports' do Supabase quando disponível
      setExports([]);
      
      setStats({
        total: 0,
        completed: 0,
        processing: 0,
        totalDownloads: 0
      });

    } catch (err: any) {
      console.error('Erro ao carregar exportações:', err);
      setError(err?.message || 'Erro ao carregar exportações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExport = async () => {
    try {
      if (!formData.name) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        export_type: 'hymns',
        format: 'xlsx',
        include_headers: true,
        compress: false
      });
      loadData();
    } catch (error) {
      console.error('Erro ao iniciar exportação:', error);
    }
  };

  const handleDownload = async (exportItem: Export) => {
    try {
      if (!exportItem.file_url) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      loadData();
    } catch (error) {
      console.error('Erro ao fazer download:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!confirm('Deseja realmente excluir este registro de exportação?')) return;
      await new Promise(resolve => setTimeout(resolve, 500));
      loadData();
    } catch (error) {
      console.error('Erro ao excluir exportação:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'gray',
      processing: 'yellow',
      completed: 'green',
      failed: 'red',
      expired: 'orange'
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
      case 'expired':
        return <Clock className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return '-';
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    const diff = expires - now;
    
    if (diff <= 0) return 'Expirado';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando exportações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar exportações</h2>
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
          <h1 className="text-3xl font-bold text-white mb-2">Exportação de Dados</h1>
          <p className="text-gray-400">Exporte dados em diversos formatos</p>
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
            to="/admin/export/criar"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Download className="w-5 h-5" />
            Nova Exportação
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Exportações</p>
              <p className="text-white text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Concluídas</p>
              <p className="text-white text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <RefreshCw className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Em Processamento</p>
              <p className="text-white text-2xl font-bold">{stats.processing}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Download className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Downloads</p>
              <p className="text-white text-2xl font-bold">{stats.totalDownloads}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Exports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exports.map((exportItem) => (
          <div key={exportItem.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-1">{exportItem.name}</h3>
                {exportItem.description && (
                  <p className="text-gray-400 text-sm mb-2">{exportItem.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full border bg-${getStatusColor(exportItem.status)}-500/20 text-${getStatusColor(exportItem.status)}-400 border-${getStatusColor(exportItem.status)}-500/30`}>
                {getStatusIcon(exportItem.status)}
                {exportItem.status.charAt(0).toUpperCase() + exportItem.status.slice(1)}
              </span>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                {exportTypes.find(t => t.value === exportItem.export_type)?.icon} {exportTypes.find(t => t.value === exportItem.export_type)?.label}
              </span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30 uppercase">
                {exportItem.format}
              </span>
            </div>

            {exportItem.status === 'processing' && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-400">Progresso</span>
                  <span className="text-white">
                    {exportItem.total_records > 0 ? ((exportItem.processed_records / exportItem.total_records) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-yellow-500 transition-all"
                    style={{ width: `${exportItem.total_records > 0 ? (exportItem.processed_records / exportItem.total_records) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm mb-4">
              {exportItem.file_name && (
                <div>
                  <span className="text-gray-400">Arquivo: </span>
                  <span className="text-white">{exportItem.file_name}</span>
                </div>
              )}
              {exportItem.file_size && (
                <div>
                  <span className="text-gray-400">Tamanho: </span>
                  <span className="text-white">{formatFileSize(exportItem.file_size)}</span>
                </div>
              )}
              <div>
                <span className="text-gray-400">Registros: </span>
                <span className="text-white">{exportItem.total_records}</span>
              </div>
              {exportItem.download_count > 0 && (
                <div>
                  <span className="text-gray-400">Downloads: </span>
                  <span className="text-white">{exportItem.download_count}</span>
                </div>
              )}
              {exportItem.status === 'completed' && (
                <div>
                  <span className="text-gray-400">Expira em: </span>
                  <span className="text-yellow-400">{getTimeRemaining(exportItem.expires_at)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
              {exportItem.status === 'completed' && exportItem.file_url ? (
                <button
                  onClick={() => handleDownload(exportItem)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Baixar
                </button>
              ) : (
                <div className="text-gray-500 text-sm">
                  {exportItem.status === 'processing' && 'Processando...'}
                  {exportItem.status === 'pending' && 'Aguardando...'}
                  {exportItem.status === 'failed' && 'Falhou'}
                  {exportItem.status === 'expired' && 'Expirado'}
                </div>
              )}

              <button
                onClick={() => handleDelete(exportItem.id)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {exports.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-xl">
          <Download className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma exportação encontrada</p>
          <p className="text-gray-500 text-sm">Crie sua primeira exportação de dados</p>
        </div>
      )}

      {/* Modal de Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">Nova Exportação</h3>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome da Exportação *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  placeholder="Digite um nome"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  rows={2}
                  placeholder="Descrição opcional"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de Dados *
                  </label>
                  <select
                    value={formData.export_type}
                    onChange={(e) => setFormData({ ...formData, export_type: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  >
                    {exportTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Formato *
                  </label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  >
                    {formats.map(format => (
                      <option key={format.value} value={format.value}>
                        {format.icon} {format.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.include_headers}
                    onChange={(e) => setFormData({ ...formData, include_headers: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-gray-300">Incluir cabeçalho</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.compress}
                    onChange={(e) => setFormData({ ...formData, compress: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-gray-300">Comprimir arquivo (ZIP)</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateExport}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Criar Exportação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExport;
