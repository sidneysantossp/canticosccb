import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Download,
  FileText,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  deleteExport,
  getExports,
  getExportStats,
  incrementExportDownload,
  type ExportRecord,
} from '@/lib/admin/exportAdminApi';

const EXPORT_TYPES = [
  { value: 'hymns', label: 'Hinos' },
  { value: 'albums', label: 'Álbuns' },
  { value: 'playlists', label: 'Playlists' },
  { value: 'composers', label: 'Compositores' },
  { value: 'users', label: 'Usuários' },
  { value: 'lyrics', label: 'Letras' },
  { value: 'media', label: 'Mídias' },
  { value: 'reports', label: 'Relatórios' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'complete', label: 'Completa' },
] as const;

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'sql', label: 'SQL' },
] as const;

const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'failed':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'processing':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'expired':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
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

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
};

const getTimeRemaining = (expiresAt?: string) => {
  if (!expiresAt) return '-';

  const now = Date.now();
  const expires = new Date(expiresAt).getTime();
  const diff = expires - now;

  if (diff <= 0) return 'Expirado';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};

const AdminExport: React.FC = () => {
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    totalDownloads: 0,
  });

  const exportTypeLabel = useMemo(
    () => Object.fromEntries(EXPORT_TYPES.map((item) => [item.value, item.label])),
    []
  );
  const formatLabel = useMemo(
    () => Object.fromEntries(EXPORT_FORMATS.map((item) => [item.value, item.label])),
    []
  );

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [exportsData, statsData] = await Promise.all([getExports(), getExportStats()]);
      setExports(exportsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Erro ao carregar exportações:', err);
      setError(err?.message || 'Erro ao carregar exportações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (exportItem: ExportRecord) => {
    try {
      if (!exportItem.file_url) return;

      window.open(exportItem.file_url, '_blank', 'noopener,noreferrer');
      await incrementExportDownload(exportItem.id, exportItem.download_count);

      setExports((current) =>
        current.map((item) =>
          item.id === exportItem.id
            ? { ...item, download_count: item.download_count + 1 }
            : item
        )
      );
      setStats((current) => ({ ...current, totalDownloads: current.totalDownloads + 1 }));
    } catch (err) {
      console.error('Erro ao baixar exportação:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!window.confirm('Deseja realmente excluir este registro de exportação?')) return;
      await deleteExport(id);
      await loadData();
    } catch (err) {
      console.error('Erro ao excluir exportação:', err);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Exportação de Dados</h1>
          <p className="text-gray-400">Gere e acompanhe exportações reais do conteúdo da plataforma</p>
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

      <div className="space-y-4">
        {exports.map((exportItem) => (
          <div
            key={exportItem.id}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 rounded-lg bg-primary-500/10">
                  {getStatusIcon(exportItem.status)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-white font-semibold text-lg">{exportItem.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusClass(exportItem.status)}`}>
                      {exportItem.status}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold border border-gray-700 text-gray-300">
                      {exportTypeLabel[exportItem.export_type] || exportItem.export_type}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold border border-gray-700 text-gray-300 uppercase">
                      {formatLabel[exportItem.format] || exportItem.format}
                    </span>
                  </div>

                  {exportItem.description ? (
                    <p className="text-gray-400 mb-4">{exportItem.description}</p>
                  ) : null}

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 text-sm text-gray-400">
                    <span>Registros: {exportItem.total_records.toLocaleString('pt-BR')}</span>
                    <span>Processados: {exportItem.processed_records.toLocaleString('pt-BR')}</span>
                    <span>Tamanho: {formatFileSize(exportItem.file_size)}</span>
                    <span>Downloads: {exportItem.download_count.toLocaleString('pt-BR')}</span>
                    <span>Expira em: {getTimeRemaining(exportItem.expires_at)}</span>
                  </div>

                  <div className="mt-3 text-sm text-gray-500">
                    Criado em {formatDate(exportItem.created_at)}
                    {exportItem.completed_at ? ` • Concluído em ${formatDate(exportItem.completed_at)}` : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {exportItem.file_url ? (
                  <button
                    onClick={() => handleDownload(exportItem)}
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    title="Baixar arquivo"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="p-2 bg-gray-800 text-gray-500 rounded-lg cursor-not-allowed"
                    title="Arquivo indisponível"
                  >
                    <Database className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(exportItem.id)}
                  className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors"
                  title="Excluir registro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {exports.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-xl">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-xl font-semibold mb-2">Nenhuma exportação encontrada</h3>
          <p className="text-gray-400 mb-6">As exportações geradas aparecerão aqui assim que forem criadas.</p>
          <Link
            to="/admin/export/criar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Download className="w-5 h-5" />
            Nova Exportação
          </Link>
        </div>
      )}
    </div>
  );
};

export default AdminExport;
