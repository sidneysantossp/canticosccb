import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HardDrive, Plus, Download, RotateCcw, Trash2, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { createBackup, deleteBackup, getBackupStats, getBackups, updateBackupStatus } from '@/lib/admin/backupAdminApi';

interface Backup {
  id: string;
  name: string;
  description?: string;
  backup_type: string;
  scope: string;
  file_name?: string;
  file_size?: number;
  file_url?: string;
  storage_location?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'restoring';
  total_items: number;
  processed_items: number;
  compress: boolean;
  encrypt: boolean;
  is_scheduled: boolean;
  retention_days: number;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  created_at: string;
}

const AdminBackup: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    backup_type: 'full',
    scope: 'all',
    compress: true,
    encrypt: false,
    retention_days: 30
  });

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    running: 0,
    totalSize: 0
  });

  const backupTypes = [
    { value: 'full', label: 'Completo', description: 'Backup completo do sistema' },
    { value: 'incremental', label: 'Incremental', description: 'Apenas alterações desde último backup' },
    { value: 'differential', label: 'Diferencial', description: 'Alterações desde último backup completo' },
    { value: 'tables', label: 'Tabelas', description: 'Backup de tabelas específicas' },
    { value: 'data-only', label: 'Apenas Dados', description: 'Somente dados, sem estrutura' },
    { value: 'schema-only', label: 'Apenas Estrutura', description: 'Somente esquema, sem dados' }
  ];

  const scopes = [
    { value: 'all', label: 'Tudo', icon: '🔄' },
    { value: 'database', label: 'Banco de Dados', icon: '🗄️' },
    { value: 'tables', label: 'Tabelas', icon: '📊' },
    { value: 'media', label: 'Mídias', icon: '🎬' },
    { value: 'config', label: 'Configurações', icon: '⚙️' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [backupsList, statsData] = await Promise.all([getBackups(), getBackupStats()]);
      setBackups(backupsList as Backup[]);
      setStats(statsData);

    } catch (err: any) {
      console.error('Erro ao carregar backups:', err);
      setError(err?.message || 'Erro ao carregar backups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      if (!formData.name) {
        return;
      }

      await createBackup({
        name: formData.name,
        description: formData.description,
        backup_type: formData.backup_type,
        scope: formData.scope,
        compress: formData.compress,
        encrypt: formData.encrypt,
        retention_days: formData.retention_days,
      });
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        backup_type: 'full',
        scope: 'all',
        compress: true,
        encrypt: false,
        retention_days: 30
      });
      loadData();
    } catch (error) {
      console.error('Erro ao iniciar backup:', error);
    }
  };

  const handleDownload = async (backup: Backup) => {
    try {
      if (!backup.file_url) {
        return;
      }
      window.open(backup.file_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Erro ao fazer download:', error);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      if (!confirm('Deseja realmente restaurar este backup? Esta ação substituirá os dados atuais.')) return;
      await updateBackupStatus(id, 'restoring');
      await loadData();
    } catch (error) {
      console.error('Erro ao restaurar:', error);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      if (!confirm('Deseja realmente cancelar este backup?')) return;
      await updateBackupStatus(id, 'cancelled');
      await loadData();
    } catch (error) {
      console.error('Erro ao cancelar:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!confirm('Deseja realmente excluir este backup?')) return;
      await deleteBackup(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'gray',
      running: 'yellow',
      completed: 'green',
      failed: 'red',
      cancelled: 'orange',
      restoring: 'blue'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      case 'running':
      case 'restoring':
        return <RefreshCw className="w-5 h-5 animate-spin" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    const gb = mb / 1024;
    return gb >= 1 ? `${gb.toFixed(2)} GB` : `${mb.toFixed(2)} MB`;
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
          <p className="text-gray-400">Carregando backups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar backups</h2>
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
          <h1 className="text-3xl font-bold text-white mb-2">Backup e Restauração</h1>
          <p className="text-gray-400">Gerencie backups do sistema e restaure dados</p>
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
            to="/admin/backup/criar"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Criar Backup
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <HardDrive className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Backups</p>
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
              <p className="text-gray-400 text-sm">Concluídos</p>
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
              <p className="text-gray-400 text-sm">Em Andamento</p>
              <p className="text-white text-2xl font-bold">{stats.running}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <HardDrive className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Espaço Usado</p>
              <p className="text-white text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="space-y-4">
        {backups.map((backup) => (
          <div key={backup.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-white font-semibold text-lg">{backup.name}</h3>
                  <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full border bg-${getStatusColor(backup.status)}-500/20 text-${getStatusColor(backup.status)}-400 border-${getStatusColor(backup.status)}-500/30`}>
                    {getStatusIcon(backup.status)}
                    {backup.status.charAt(0).toUpperCase() + backup.status.slice(1)}
                  </span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                    {backupTypes.find(t => t.value === backup.backup_type)?.label}
                  </span>
                  {backup.is_scheduled && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                      ⏰ Agendado
                    </span>
                  )}
                  {backup.encrypt && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                      🔒 Criptografado
                    </span>
                  )}
                </div>
                {backup.description && (
                  <p className="text-gray-400 text-sm mb-3">{backup.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                {backup.status === 'completed' && backup.file_url && (
                  <>
                    <button
                      onClick={() => handleDownload(backup)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleRestore(backup.id)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Restaurar"
                    >
                      <RotateCcw className="w-4 h-4 text-green-400" />
                    </button>
                  </>
                )}
                {backup.status === 'running' && (
                  <button
                    onClick={() => handleCancel(backup.id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Cancelar"
                  >
                    <XCircle className="w-4 h-4 text-orange-400" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(backup.id)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {(backup.status === 'running' || backup.status === 'restoring') && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-400">
                    Progresso: {backup.processed_items.toLocaleString()} / {backup.total_items.toLocaleString()}
                  </span>
                  <span className="text-white">
                    {backup.total_items > 0 ? ((backup.processed_items / backup.total_items) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-yellow-500 transition-all"
                    style={{ width: `${backup.total_items > 0 ? (backup.processed_items / backup.total_items) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Escopo: </span>
                <span className="text-white">
                  {scopes.find(s => s.value === backup.scope)?.icon} {scopes.find(s => s.value === backup.scope)?.label}
                </span>
              </div>
              {backup.file_name && (
                <div>
                  <span className="text-gray-400">Arquivo: </span>
                  <span className="text-white">{backup.file_name}</span>
                </div>
              )}
              {backup.file_size && (
                <div>
                  <span className="text-gray-400">Tamanho: </span>
                  <span className="text-white">{formatFileSize(backup.file_size)}</span>
                </div>
              )}
              {backup.duration_seconds && (
                <div>
                  <span className="text-gray-400">Duração: </span>
                  <span className="text-white">{formatDuration(backup.duration_seconds)}</span>
                </div>
              )}
              <div>
                <span className="text-gray-400">Retenção: </span>
                <span className="text-white">{backup.retention_days} dias</span>
              </div>
              {backup.storage_location && (
                <div>
                  <span className="text-gray-400">Armazenamento: </span>
                  <span className="text-white uppercase">{backup.storage_location}</span>
                </div>
              )}
            </div>

            {/* Timestamps */}
            {(backup.started_at || backup.completed_at) && (
              <div className="flex items-center gap-6 pt-4 mt-4 border-t border-gray-700 text-sm">
                {backup.started_at && (
                  <div>
                    <span className="text-gray-400">Iniciado em: </span>
                    <span className="text-white">{formatDate(backup.started_at)}</span>
                  </div>
                )}
                {backup.completed_at && (
                  <div>
                    <span className="text-gray-400">Concluído em: </span>
                    <span className="text-white">{formatDate(backup.completed_at)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {backups.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-xl">
          <HardDrive className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum backup encontrado</p>
          <p className="text-gray-500 text-sm">Crie seu primeiro backup</p>
        </div>
      )}

      {/* Modal de Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">Novo Backup</h3>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Backup *
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
                    Tipo de Backup *
                  </label>
                  <select
                    value={formData.backup_type}
                    onChange={(e) => setFormData({ ...formData, backup_type: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  >
                    {backupTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-gray-500 text-xs mt-1">
                    {backupTypes.find(t => t.value === formData.backup_type)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Escopo *
                  </label>
                  <select
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  >
                    {scopes.map(scope => (
                      <option key={scope.value} value={scope.value}>
                        {scope.icon} {scope.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Retenção (dias)
                </label>
                <input
                  type="number"
                  value={formData.retention_days}
                  onChange={(e) => setFormData({ ...formData, retention_days: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  min="1"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Backup será excluído automaticamente após este período
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.compress}
                    onChange={(e) => setFormData({ ...formData, compress: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-gray-300">Comprimir arquivo (reduz tamanho)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.encrypt}
                    onChange={(e) => setFormData({ ...formData, encrypt: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-gray-300">Criptografar backup (mais seguro)</span>
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
                onClick={handleCreateBackup}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Criar Backup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBackup;
