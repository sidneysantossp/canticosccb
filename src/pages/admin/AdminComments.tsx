import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Eye, CheckCircle, XCircle, Trash2, Filter, AlertCircle } from 'lucide-react';

interface Comment {
  id: string;
  user: string;
  userEmail: string;
  song: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const AdminComments: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dados mockados
  const mockComments: Comment[] = [
    {
      id: '1',
      user: 'João Silva',
      userEmail: 'joao@email.com',
      song: 'Hino 1 - Oh! Que Glória',
      content: 'Lindo hino! Muito edificante e toca o coração.',
      status: 'approved',
      created_at: '2025-10-05T10:30:00'
    },
    {
      id: '2',
      user: 'Maria Santos',
      userEmail: 'maria@email.com',
      song: 'Hino 5 - Vem, Ó Pródigo',
      content: 'Este hino sempre me faz refletir sobre o amor de Deus.',
      status: 'pending',
      created_at: '2025-10-06T08:15:00'
    },
    {
      id: '3',
      user: 'Pedro Costa',
      userEmail: 'pedro@email.com',
      song: 'Hino 10 - Lindo País',
      content: 'Mensagem muito clara e objetiva. Glória a Deus!',
      status: 'pending',
      created_at: '2025-10-06T14:20:00'
    },
    {
      id: '4',
      user: 'Ana Lima',
      userEmail: 'ana@email.com',
      song: 'Hino 15 - Ó Cristãos, Vinde Todos',
      content: 'Comentário inapropriado aqui...',
      status: 'rejected',
      created_at: '2025-10-04T16:45:00'
    }
  ];

  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      try {
        setComments(mockComments);
        setIsLoading(false);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar comentários');
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = (id: string) => {
    setComments(comments.map(c => c.id === id ? { ...c, status: 'approved' as const } : c));
  };

  const handleReject = (id: string) => {
    setComments(comments.map(c => c.id === id ? { ...c, status: 'rejected' as const } : c));
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este comentário?')) return;
    setComments(comments.filter(c => c.id !== id));
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    const labels = {
      approved: 'Aprovado',
      pending: 'Pendente',
      rejected: 'Rejeitado'
    };

    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const filteredComments = comments
    .filter(c => filterStatus === 'all' || c.status === filterStatus)
    .filter(c =>
      c.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.song.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const stats = {
    total: comments.length,
    pending: comments.filter(c => c.status === 'pending').length,
    approved: comments.filter(c => c.status === 'approved').length,
    rejected: comments.filter(c => c.status === 'rejected').length
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
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
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
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Comentários</h1>
        <p className="text-gray-400">Gerencie comentários dos usuários</p>
      </div>

      {/* Stats Cards */}
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

      {/* Filters */}
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

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.map((comment) => (
          <div
            key={comment.id}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-white font-semibold">{comment.user}</p>
                  <p className="text-gray-500 text-sm">{comment.userEmail}</p>
                  {getStatusBadge(comment.status)}
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  Comentário em: <span className="text-blue-400">{comment.song}</span>
                </p>
                <p className="text-gray-300">{comment.content}</p>
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

      {/* Empty State */}
      {filteredComments.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-lg">Nenhum comentário encontrado</p>
        </div>
      )}
    </div>
  );
};

export default AdminComments;
