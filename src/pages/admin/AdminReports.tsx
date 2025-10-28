import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Eye, Trash2, Clock } from 'lucide-react';
import {
  getAllReports,
  updateReportStatus,
  deleteReport,
  getReportStats,
  Report,
  ReportsFilters
} from '@/lib/admin/reportsAdminApi';

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, reviewed: 0, resolved: 0 });
  
  const [filters, setFilters] = useState<ReportsFilters>({
    status: 'all',
    type: 'all'
  });

  useEffect(() => {
    loadReports();
    loadStats();
  }, [currentPage, filters]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const result = await getAllReports(currentPage, 20, filters);
      setReports(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.count);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    const stats = await getReportStats();
    setStats(stats);
  };

  const handleUpdateStatus = async (id: string, status: 'reviewed' | 'resolved' | 'rejected') => {
    try {
      // TODO: Get current admin user ID
      const adminId = 'temp-admin-id';
      await updateReportStatus(id, status, adminId);
      loadReports();
      loadStats();
      
      const messages = {
        reviewed: 'Denúncia marcada como revisada',
        resolved: 'Denúncia resolvida',
        rejected: 'Denúncia rejeitada'
      };
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta denúncia?')) return;

    try {
      await deleteReport(id);
      loadReports();
      loadStats();
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      reviewed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    const labels = {
      pending: 'Pendente',
      reviewed: 'Revisada',
      resolved: 'Resolvida',
      rejected: 'Rejeitada'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      song: 'bg-purple-500/20 text-purple-400',
      composer: 'bg-blue-500/20 text-blue-400',
      comment: 'bg-gray-500/20 text-gray-400'
    };

    const labels = {
      song: 'Música',
      composer: 'Compositor',
      comment: 'Comentário'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[type as keyof typeof styles]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  // Removed page-level loading to render instantly

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Denúncias</h1>
        <p className="text-gray-400">Total: {totalCount} denúncias</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-gray-500/20 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-white text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pendentes</p>
              <p className="text-white text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Eye className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Revisadas</p>
              <p className="text-white text-2xl font-bold">{stats.reviewed}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Resolvidas</p>
              <p className="text-white text-2xl font-bold">{stats.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="reviewed">Revisadas</option>
            <option value="resolved">Resolvidas</option>
            <option value="rejected">Rejeitadas</option>
          </select>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">Todos os tipos</option>
            <option value="song">Músicas</option>
            <option value="composer">Compositores</option>
            <option value="comment">Comentários</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Denunciante
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Motivo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-800/30 transition-colors">
                  {/* Reporter */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-semibold">@{report.users?.username}</p>
                      <p className="text-gray-400 text-sm">{report.users?.email}</p>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4">
                    {getTypeBadge(report.reported_item_type)}
                  </td>

                  {/* Reason */}
                  <td className="px-6 py-4">
                    <p className="text-white font-semibold">{report.reason}</p>
                    {report.description && (
                      <p className="text-gray-400 text-sm line-clamp-2">{report.description}</p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {getStatusBadge(report.status)}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(report.id, 'reviewed')}
                            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                            title="Marcar como revisada"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(report.id, 'resolved')}
                            className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                            title="Resolver"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(report.id, 'rejected')}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            title="Rejeitar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {reports.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">Nenhuma denúncia encontrada</p>
            <p className="text-gray-500 text-sm">Tente ajustar os filtros</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
