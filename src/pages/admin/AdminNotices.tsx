import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Megaphone, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { noticesApi, PlatformNotice } from '@/lib/noticesApi';

const ITEMS_PER_PAGE = 20;

const AdminNotices: React.FC = () => {
  const [notices, setNotices] = useState<PlatformNotice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const navigate = useNavigate();

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  useEffect(() => {
    loadNotices();
  }, [page]);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const result = await noticesApi.listAll(page, ITEMS_PER_PAGE);
      setNotices(result.notices);
      setTotal(result.total);
    } catch (error) {
      console.error('Erro ao carregar avisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir o aviso "${title}"?`)) return;
    setDeleting(id);
    try {
      const success = await noticesApi.delete(id);
      if (success) {
        setNotices((prev) => prev.filter((n) => n.id !== id));
        setTotal((prev) => prev - 1);
      } else {
        alert('Erro ao excluir aviso.');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir aviso.');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 rounded-xl">
            <Megaphone className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Avisos da Plataforma</h1>
            <p className="text-text-muted text-sm">{total} aviso{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Link
          to="/admin/notices/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Aviso
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-background-secondary rounded-lg p-4 animate-pulse flex items-center gap-4">
              <div className="h-5 bg-gray-700 rounded flex-1" />
              <div className="h-5 bg-gray-700 rounded w-32" />
              <div className="h-5 bg-gray-700 rounded w-24" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && notices.length === 0 && (
        <div className="text-center py-16 bg-background-secondary rounded-xl border border-gray-800">
          <Megaphone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Nenhum aviso cadastrado</h2>
          <p className="text-text-muted mb-6">Crie o primeiro aviso para os usuários da plataforma.</p>
          <Link
            to="/admin/notices/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Aviso
          </Link>
        </div>
      )}

      {/* Notices Table */}
      {!loading && notices.length > 0 && (
        <div className="bg-background-secondary rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Título</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400 hidden md:table-cell">Data de Publicação</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-400 hidden sm:table-cell">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((notice) => (
                <tr key={notice.id} className="border-b border-gray-800/50 hover:bg-background-hover/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium truncate max-w-[300px]">{notice.title}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(notice.published_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center hidden sm:table-cell">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      notice.is_active
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {notice.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => window.open(`/avisos/${notice.id}`, '_blank')}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/notices/edit/${notice.id}`)}
                        className="p-2 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notice.id, notice.title)}
                        disabled={deleting === notice.id}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title="Excluir"
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
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-background-secondary text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-background-hover transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-text-muted px-3">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-background-secondary text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-background-hover transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminNotices;
