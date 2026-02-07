import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Search, CheckCircle, Eye, AlertTriangle, Music, User, MessageSquare, XCircle } from 'lucide-react';
import { getReports, updateReportStatus, type Report } from '@/lib/admin/reportsApi';

const AdminReports: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await getReports({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        type: filterType !== 'all' ? filterType : undefined
      });
      setReports(data);
      setError(null);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Falha ao carregar denúncias.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterStatus, filterType]);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await updateReportStatus(id, newStatus);
      // Refresh local state or re-fetch
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as any } : r));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Erro ao atualizar status');
    }
  };

  const filteredReports = reports.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.reporter && r.reporter.toLowerCase().includes(searchQuery.toLowerCase())) ||
    r.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'song': return <Music className="w-5 h-5" />;
      case 'user': return <User className="w-5 h-5" />;
      case 'comment': return <MessageSquare className="w-5 h-5" />;
      default: return <Flag className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-red-500/20 text-red-400 border-red-500/30',
      in_review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };

    const labels = {
      open: 'Aberta',
      in_review: 'Em Análise',
      resolved: 'Resolvida',
      rejected: 'Rejeitada'
    };

    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${styles[status as keyof typeof styles] || styles.open}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-blue-500/20 text-blue-400',
      medium: 'bg-yellow-500/20 text-yellow-400',
      high: 'bg-red-500/20 text-red-400'
    };

    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[priority as keyof typeof styles] || styles.medium}`}>
        {labels[priority as keyof typeof labels] || priority}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando denúncias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar denúncias</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => fetchReports()}
            className="btn-primary"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const openCount = reports.filter(r => r.status === 'open').length;
  const inReviewCount = reports.filter(r => r.status === 'in_review').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;
  const highPriorityCount = reports.filter(r => r.priority === 'high' && r.status === 'open').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Denúncias e Relatórios</h1>
        <p className="text-gray-400">Gerencie denúncias de conteúdo e usuários</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-500/20 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-gray-400 text-sm">Abertas</p>
          </div>
          <p className="text-2xl font-bold text-white">{openCount}</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-500/20 p-2 rounded-lg">
              <Eye className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-gray-400 text-sm">Em Análise</p>
          </div>
          <p className="text-2xl font-bold text-white">{inReviewCount}</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-500/20 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm">Resolvidas</p>
          </div>
          <p className="text-2xl font-bold text-white">{resolvedCount}</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <Flag className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-gray-400 text-sm">Alta Prioridade</p>
          </div>
          <p className="text-2xl font-bold text-white">{highPriorityCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, denunciante ou motivo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-600"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-600"
          >
            <option value="all">Todos os Status</option>
            <option value="open">Abertas</option>
            <option value="in_review">Em Análise</option>
            <option value="resolved">Resolvidas</option>
            <option value="rejected">Rejeitadas</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-600"
          >
            <option value="all">Todos os Tipos</option>
            <option value="song">Hinos</option>
            <option value="user">Usuários</option>
            <option value="comment">Comentários</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div key={report.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${report.type === 'song' ? 'bg-yellow-500/20 text-yellow-400' :
                      report.type === 'user' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-purple-500/20 text-purple-400'
                    }`}>
                    {getTypeIcon(report.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-bold text-lg">{report.title}</h3>
                      {getPriorityBadge(report.priority)}
                      {getStatusBadge(report.status)}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">
                      <span className="font-semibold">Motivo:</span> {report.reason}
                    </p>
                    {report.description && (
                      <p className="text-gray-500 text-sm mb-3">{report.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>👤 Denunciado por: <span className="text-gray-400">{report.reporter || 'Anônimo'}</span></span>
                      <span>📅 {new Date(report.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/admin/reports/${report.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver Detalhes
                </Link>
                {report.status === 'open' && (
                  <button
                    onClick={() => handleStatusUpdate(report.id, 'resolved')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolver
                  </button>
                )}
                {(report.status === 'open' || report.status === 'in_review') && (
                  <button
                    onClick={() => handleStatusUpdate(report.id, 'rejected')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeitar
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
            <Flag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">Nenhuma denúncia encontrada</p>
            <p className="text-gray-500 text-sm">Tente ajustar os filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
