import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Download, AlertTriangle, Info, CheckCircle, XCircle, Clock, User, Activity, Trash2 } from 'lucide-react';
import {
  getLogs,
  getLogStats,
  deleteLogs,
  deleteOldLogs,
  exportLogsAsCSV,
  LogEntry,
  LogFilters
} from '@/lib/admin/logsAdminApi';

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [logStats, setLogStats] = useState<Record<string, number>>({});

  const logLevels = [
    { value: 'all', label: 'Todos os Níveis', count: 0 },
    { value: 'info', label: 'Informação', count: 0, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { value: 'success', label: 'Sucesso', count: 0, color: 'text-green-400', bg: 'bg-green-500/20' },
    { value: 'warning', label: 'Aviso', count: 0, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    { value: 'error', label: 'Erro', count: 0, color: 'text-red-400', bg: 'bg-red-500/20' }
  ];

  const logCategories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'auth', label: 'Autenticação' },
    { value: 'api', label: 'API' },
    { value: 'database', label: 'Banco de Dados' },
    { value: 'upload', label: 'Upload de Arquivos' },
    { value: 'admin', label: 'Ações Admin' },
    { value: 'user', label: 'Ações do Usuário' },
    { value: 'system', label: 'Sistema' }
  ];

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [selectedLevel, selectedCategory, searchQuery]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters: LogFilters = {
        level: selectedLevel !== 'all' ? selectedLevel : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined,
        limit: 100
      };

      const { logs: fetchedLogs, total } = await getLogs(filters);
      setLogs(fetchedLogs);
      setTotalLogs(total);
    } catch (err: any) {
      console.error('Error loading logs:', err);
      setError(err?.message || 'Erro ao carregar logs');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await getLogStats();
      setLogStats(stats.byLevel);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (log.user_name && log.user_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'info': return <Info className="w-4 h-4 text-blue-400" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLogLevelStyle = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'success': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleExportLogs = async () => {
    try {
      const filters: LogFilters = {
        level: selectedLevel !== 'all' ? selectedLevel : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined
      };

      const csvContent = await exportLogsAsCSV(filters);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLogs.length === 0) return;

    if (!confirm(`Deletar ${selectedLogs.length} log(s) selecionado(s)?`)) {
      return;
    }

    try {
      await deleteLogs(selectedLogs);
      setSelectedLogs([]);
      loadLogs();
    } catch (error) {
      console.error('Error deleting logs:', error);
    }
  };

  const handleDeleteOldLogs = async () => {
    if (!confirm('Deletar todos os logs com mais de 90 dias?')) {
      return;
    }

    try {
      const deletedCount = await deleteOldLogs(90);
      loadLogs();
    } catch (error) {
      console.error('Error deleting old logs:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando logs do sistema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar logs</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => loadLogs()}
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
          <h1 className="text-3xl font-bold text-white mb-2">Logs do Sistema</h1>
          <p className="text-gray-400">Monitore atividades e eventos do sistema</p>
        </div>
        <div className="flex gap-2">
          {selectedLogs.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Deletar ({selectedLogs.length})
            </button>
          )}
          <button
            onClick={handleDeleteOldLogs}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Limpar Antigos
          </button>
          <button
            onClick={handleExportLogs}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {logLevels.map((level) => {
          const count = level.value === 'all' 
            ? totalLogs 
            : logStats[level.value] || 0;
          
          return (
            <div
              key={level.value}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedLevel === level.value
                  ? 'border-primary-600 bg-primary-600/10'
                  : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
              }`}
              onClick={() => setSelectedLevel(level.value)}
            >
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className={`text-sm ${level.color || 'text-gray-400'}`}>{level.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary-600"
                placeholder="Buscar logs por mensagem, categoria ou usuário..."
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
            >
              {logCategories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedLevel !== 'all' || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLevel('all');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left py-3 px-4 text-gray-300 font-medium w-12">
                  <input
                    type="checkbox"
                    checked={selectedLogs.length === logs.length && logs.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLogs(logs.map(log => log.id));
                      } else {
                        setSelectedLogs([]);
                      }
                    }}
                    className="w-4 h-4 rounded"
                  />
                </th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Nível</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Timestamp</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Categoria</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Mensagem</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Usuário</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">IP</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedLogs.includes(log.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLogs([...selectedLogs, log.id]);
                        } else {
                          setSelectedLogs(selectedLogs.filter(id => id !== log.id));
                        }
                      }}
                      className="w-4 h-4 rounded"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getLogIcon(log.level)}
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getLogLevelStyle(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs font-medium">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-white text-sm">{log.message}</p>
                  </td>
                  <td className="py-3 px-4">
                    {log.user_name ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300 text-sm">{log.user_name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Sistema</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-400 text-sm font-mono">
                      {log.ip_address || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => {
                        setSelectedLog(log);
                        setIsModalOpen(true);
                      }}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Ver detalhes"
                    >
                      <FileText className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum log encontrado</p>
              <p className="text-gray-500 text-sm">Tente ajustar os filtros de busca</p>
            </div>
          )}
        </div>
      </div>

      {/* Log Details Modal */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Detalhes do Log</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nível</label>
                  <div className="flex items-center gap-2">
                    {getLogIcon(selectedLog.level)}
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getLogLevelStyle(selectedLog.level)}`}>
                      {selectedLog.level.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Categoria</label>
                  <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm font-medium">
                    {selectedLog.category}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Timestamp</label>
                <p className="text-white">{new Date(selectedLog.timestamp).toLocaleString('pt-BR')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Mensagem</label>
                <p className="text-white">{selectedLog.message}</p>
              </div>

              {selectedLog.user_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Usuário</label>
                  <p className="text-white">{selectedLog.user_name}</p>
                </div>
              )}

              {selectedLog.ip_address && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Endereço IP</label>
                  <p className="text-white font-mono">{selectedLog.ip_address}</p>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">User Agent</label>
                  <p className="text-white text-sm break-all">{selectedLog.user_agent}</p>
                </div>
              )}

              {selectedLog.details && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Detalhes Técnicos</label>
                  <pre className="bg-gray-800 p-4 rounded-lg text-gray-300 text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
