import React, { useState, useEffect } from 'react';
import { FileText, AlertTriangle, Info, CheckCircle, XCircle, Calendar, Filter, Download, User, Clock } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  category: string;
  message: string;
  user?: string;
  ip?: string;
}

const AdminReportLogs: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('7days');

  // Mock logs data
  const mockLogs: LogEntry[] = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      level: 'success',
      category: 'auth',
      message: 'Usuário realizou login com sucesso',
      user: 'João Silva',
      ip: '192.168.1.100'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      level: 'info',
      category: 'upload',
      message: 'Novo hino adicionado: Hino 450',
      user: 'Admin',
      ip: '192.168.1.1'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      level: 'warning',
      category: 'api',
      message: 'Taxa de requisições próxima do limite',
      ip: '192.168.1.50'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      level: 'error',
      category: 'database',
      message: 'Falha ao conectar com banco de dados',
      ip: '192.168.1.1'
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      level: 'success',
      category: 'user',
      message: 'Novo usuário registrado',
      user: 'Maria Santos',
      ip: '192.168.1.105'
    },
    {
      id: '6',
      timestamp: new Date(Date.now() - 18000000).toISOString(),
      level: 'info',
      category: 'admin',
      message: 'Configurações do sistema atualizadas',
      user: 'Admin',
      ip: '192.168.1.1'
    }
  ];

  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Simulate loading logs from API
    const timer = setTimeout(() => {
      try {
        setLogs(mockLogs);
        setIsLoading(false);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar relatório de logs');
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    return matchesLevel && matchesCategory;
  });

  const stats = {
    total: logs.length,
    info: logs.filter(l => l.level === 'info').length,
    success: logs.filter(l => l.level === 'success').length,
    warning: logs.filter(l => l.level === 'warning').length,
    error: logs.filter(l => l.level === 'error').length
  };

  const handleExport = () => {
    const csvContent = [
      'Timestamp,Level,Category,Message,User,IP',
      ...filteredLogs.map(log => 
        `${log.timestamp},${log.level},${log.category},"${log.message}",${log.user || 'N/A'},${log.ip || 'N/A'}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando relatório de logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar relatório</h2>
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
          <h1 className="text-3xl font-bold text-white mb-2">Relatório de Logs</h1>
          <p className="text-gray-400">Histórico detalhado de eventos e atividades</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-600"
          >
            <option value="today">Hoje</option>
            <option value="7days">Últimos 7 dias</option>
            <option value="30days">Últimos 30 dias</option>
            <option value="90days">Últimos 90 dias</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
          <p className="text-gray-400 text-sm mb-1">Total</p>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 hover:border-blue-500/50 transition-colors">
          <p className="text-blue-400 text-sm mb-1">Info</p>
          <p className="text-3xl font-bold text-blue-300">{stats.info}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 hover:border-green-500/50 transition-colors">
          <p className="text-green-400 text-sm mb-1">Sucesso</p>
          <p className="text-3xl font-bold text-green-300">{stats.success}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 hover:border-yellow-500/50 transition-colors">
          <p className="text-yellow-400 text-sm mb-1">Avisos</p>
          <p className="text-3xl font-bold text-yellow-300">{stats.warning}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 hover:border-red-500/50 transition-colors">
          <p className="text-red-400 text-sm mb-1">Erros</p>
          <p className="text-3xl font-bold text-red-300">{stats.error}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-600"
          >
            <option value="all">Todos os níveis</option>
            <option value="info">Info</option>
            <option value="success">Sucesso</option>
            <option value="warning">Aviso</option>
            <option value="error">Erro</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-600"
          >
            <option value="all">Todas as categorias</option>
            <option value="auth">Autenticação</option>
            <option value="api">API</option>
            <option value="database">Banco de Dados</option>
            <option value="upload">Upload</option>
            <option value="admin">Admin</option>
            <option value="user">Usuário</option>
          </select>
          {(selectedLevel !== 'all' || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSelectedLevel('all');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Logs ({filteredLogs.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Nível</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Timestamp</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Categoria</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Mensagem</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Usuário</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
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
                    {log.user ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300 text-sm">{log.user}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Sistema</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-400 text-sm font-mono">
                      {log.ip || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum log encontrado</p>
              <p className="text-gray-500 text-sm">Tente ajustar os filtros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReportLogs;
