import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Eye, Filter, MessageSquare, Search, Trash2, XCircle } from 'lucide-react';
import {
  approveComment,
  deleteComment,
  getComments,
  rejectComment,
  type AdminCommentRecord,
} from '@/lib/admin/commentsAdminApi';

const getStatusBadge = (status: string) => {
  const styles = {
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const labels = {
    approved: 'Aprovado',
    pending: 'Pendente',
    rejected: 'Rejeitado',
  };

  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
};

const AdminComments: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<AdminCommentRecord[]>([]);
  const [selectedComment, setSelectedComment] = useState<AdminCommentRecord | null>(null);

  useEffect(() => {
    void loadComments();
  }, []);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setComments(await getComments());
    } catch (err: any) {
      console.error('Erro ao carregar comentários:', err);
      setError(err?.message || 'Erro ao carregar comentários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveComment(id);
      setComments((current) =>
        current.map((comment) => (comment.id === id ? { ...comment, status: 'approved' } : comment))
      );
    } catch (err) {
      console.error('Erro ao aprovar comentário:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectComment(id);
      setComments((current) =>
        current.map((comment) => (comment.id === id ? { ...comment, status: 'rejected' } : comment))
      );
    } catch (err) {
      console.error('Erro ao rejeitar comentário:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este comentário?')) return;

    try {
      await deleteComment(id);
      setComments((current) => current.filter((comment) => comment.id !== id));
      if (selectedComment?.id === id) {
        setSelectedComment(null);
      }
    } catch (err) {
      console.error('Erro ao excluir comentário:', err);
    }
  };

  const filteredComments = comments
    .filter((comment) => filterStatus === 'all' || comment.status === filterStatus)
    .filter((comment) => {
      const term = searchQuery.toLowerCase();
      return (
        comment.user.toLowerCase().includes(term) ||
        comment.song.toLowerCase().includes(term) ||
        comment.content.toLowerCase().includes(term)
      );
    });

  const stats = {
    total: comments.length,
    pending: comments.filter((comment) => comment.status === 'pending').length,
    approved: comments.filter((comment) => comment.status === 'approved').length,
    rejected: comments.filter((comment) => comment.status === 'rejected').length,
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando comentários...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar comentários</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button onClick={() => loadComments()} className="btn-primary">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Comentários</h1>
        <p className="text-gray-400">Gerencie comentários enviados pelos usuários</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-gray-400 text-sm">Aprovados</p>
              <p className="text-2xl font-bold text-white">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-yellow-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-gray-400 text-sm">Pendentes</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-gray-400 text-sm">Rejeitados</p>
              <p className="text-2xl font-bold text-white">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar comentário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-600"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendentes</option>
              <option value="approved">Aprovados</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredComments.map((comment) => (
          <div
            key={comment.id}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <p className="text-white font-semibold">{comment.user}</p>
                  <p className="text-gray-500 text-sm">{comment.userEmail || 'Sem email'}</p>
                  {getStatusBadge(comment.status)}
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  Comentário em: <span className="text-blue-400">{comment.song}</span>
                </p>
                <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <p className="text-gray-500 text-sm">
                {new Date(comment.created_at).toLocaleString('pt-BR')}
              </p>

              <div className="flex gap-2">
                {comment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(comment.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleReject(comment.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeitar
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedComment(comment)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Ver detalhes"
                >
                  <Eye className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Deletar"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredComments.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-lg">Nenhum comentário encontrado</p>
        </div>
      )}

      {selectedComment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Detalhes do comentário</h2>
                <p className="text-gray-400 mt-1">
                  {selectedComment.user} • {selectedComment.userEmail || 'Sem email'}
                </p>
              </div>
              <button
                onClick={() => setSelectedComment(null)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Conteúdo relacionado</p>
                <p className="text-white">{selectedComment.song}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Comentário</p>
                <p className="text-white whitespace-pre-wrap">{selectedComment.content}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Criado em</p>
                <p className="text-white">
                  {new Date(selectedComment.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComments;
