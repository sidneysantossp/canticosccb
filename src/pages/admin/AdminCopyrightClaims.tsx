import { useState, useEffect } from 'react';
import { Copyright, MessageSquare, AlertCircle, CheckCircle, XCircle, Clock, Search, Filter, X } from 'lucide-react';
import useCopyrightClaimsStore, { CopyrightClaim } from '@/stores/copyrightClaimsStore';
import CopyrightClaimChat from '@/components/CopyrightClaimChat';
import { useAuth } from '@/contexts/AuthContext';

const AdminCopyrightClaims = () => {
  const { user } = useAuth();
  const { claims, isLoading, error, getClaimById, getPendingClaimsCount, loadClaims, updateClaimStatus } = useCopyrightClaimsStore();
  const [selectedClaim, setSelectedClaim] = useState<CopyrightClaim | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | CopyrightClaim['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusDraft, setStatusDraft] = useState<CopyrightClaim['status']>('pending');
  const [reviewNotes, setReviewNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    void loadClaims();
  }, [loadClaims]);

  const activeSelectedClaim = selectedClaim ? getClaimById(selectedClaim.id) || selectedClaim : null;

  useEffect(() => {
    if (!activeSelectedClaim) return;
    setStatusDraft(activeSelectedClaim.status);
    setReviewNotes(activeSelectedClaim.reviewerNotes || '');
  }, [activeSelectedClaim?.id, activeSelectedClaim?.status, activeSelectedClaim?.reviewerNotes]);

  if (isLoading && claims.length === 0) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando reivindicações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar reivindicações</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => void loadClaims()}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const filteredClaims = claims.filter((claim) => {
    const matchesStatus = filterStatus === 'all' || claim.status === filterStatus;
    const matchesSearch = 
      claim.songTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.composerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: CopyrightClaim['status']) => {
    const colors = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      in_review: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      approved: 'bg-green-500/10 text-green-500 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
      resolved: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    };
    return colors[status];
  };

  const getStatusIcon = (status: CopyrightClaim['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_review': return <AlertCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: CopyrightClaim['status']) => {
    const texts = {
      pending: 'Pendente',
      in_review: 'Em Análise',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      resolved: 'Resolvido'
    };
    return texts[status];
  };

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Copyright className="w-8 h-8 text-amber-500" />
              Direitos Autorais
            </h1>
            <p className="text-gray-400 mt-1">
              Gerencie reivindicações de direitos autorais
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
              <span className="text-2xl font-bold text-amber-500">{getPendingClaimsCount()}</span>
              <span className="text-sm text-amber-300 ml-2">Pendentes</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-background-secondary rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por hino ou compositor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background-tertiary border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full pl-10 pr-4 py-2 bg-background-tertiary border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="all" className="bg-gray-900">Todos os Status</option>
                  <option value="pending" className="bg-gray-900">Pendente</option>
                  <option value="in_review" className="bg-gray-900">Em Análise</option>
                  <option value="approved" className="bg-gray-900">Aprovado</option>
                  <option value="rejected" className="bg-gray-900">Rejeitado</option>
                  <option value="resolved" className="bg-gray-900">Resolvido</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Claims List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredClaims.length === 0 ? (
            <div className="bg-background-secondary rounded-lg p-12 text-center">
              <Copyright className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Nenhuma reivindicação encontrada
              </h3>
              <p className="text-gray-500">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Tente ajustar os filtros' 
                  : 'Não há reivindicações de direitos autorais no momento'}
              </p>
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-background-secondary rounded-lg p-6 hover:bg-background-tertiary transition-colors border border-gray-700"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Song Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={claim.songCoverUrl}
                      alt={claim.songTitle}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                          {claim.songTitle}
                        </h3>
                        {claim.hasUnreadForAdmin && (
                          <span className="px-2 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">
                            NOVA
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{claim.songArtist}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Solicitante: <strong className="text-white">{claim.composerName}</strong></span>
                        <span>•</span>
                        <span>Tipo: <strong className="text-white capitalize">{claim.claimType}</strong></span>
                        <span>•</span>
                        <span>{new Date(claim.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${getStatusColor(claim.status)}`}>
                      {getStatusIcon(claim.status)}
                      <span className="text-sm font-medium">{getStatusText(claim.status)}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedClaim(claim);
                          setShowChat(false);
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors"
                      >
                        Ver Detalhes
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClaim(claim);
                          setShowChat(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Chat
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description Preview */}
                {claim.description && (
                  <div className="mt-4 p-3 bg-background-tertiary rounded-lg border border-gray-600">
                    <p className="text-sm text-gray-300 line-clamp-2">{claim.description}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail/Chat Modal */}
      {activeSelectedClaim && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {showChat ? 'Chat com Compositor' : 'Detalhes da Reivindicação'}
                </h2>
                <p className="text-sm text-gray-400">{activeSelectedClaim.songTitle} - {activeSelectedClaim.composerName}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedClaim(null);
                  setShowChat(false);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {showChat ? (
                <CopyrightClaimChat
                  claim={activeSelectedClaim}
                  userRole="admin"
                  userId={user?.id || ''}
                  userName={user?.nome || 'Administrador'}
                />
              ) : (
                <div className="p-6 overflow-y-auto h-full">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Informações da Reivindicação</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-400">Tipo</label>
                          <p className="text-white capitalize">{activeSelectedClaim.claimType}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Status</label>
                          <p className="text-white capitalize">{activeSelectedClaim.status}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Data</label>
                          <p className="text-white">{new Date(activeSelectedClaim.createdAt).toLocaleString('pt-BR')}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Prioridade</label>
                          <p className="text-white capitalize">{activeSelectedClaim.priority}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Solicitante</label>
                          <p className="text-white">{activeSelectedClaim.composerName}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Email</label>
                          <p className="text-white break-all">{activeSelectedClaim.composerEmail || '-'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Descrição</h3>
                      <p className="text-gray-300 bg-gray-800 p-4 rounded-lg">{activeSelectedClaim.description}</p>
                    </div>

                    {activeSelectedClaim.proofDocuments && activeSelectedClaim.proofDocuments.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Documentos Anexados</h3>
                        <div className="space-y-2">
                          {activeSelectedClaim.proofDocuments.map((document) => (
                            <a
                              key={document.id}
                              href={document.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 hover:bg-gray-700/60 transition-colors"
                            >
                              <div>
                                <p className="text-white text-sm font-medium">{document.name}</p>
                                <p className="text-xs text-gray-400">{document.type.toUpperCase()}</p>
                              </div>
                              <span className="text-sm text-amber-400">Abrir</span>
                            </a>
                          ))}
                        </div>
                    </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Análise do Admin</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Status</label>
                          <select
                            value={statusDraft}
                            onChange={(e) => setStatusDraft(e.target.value as CopyrightClaim['status'])}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                          >
                            <option value="pending">Pendente</option>
                            <option value="in_review">Em análise</option>
                            <option value="approved">Aprovado</option>
                            <option value="rejected">Rejeitado</option>
                            <option value="resolved">Resolvido</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Observações</label>
                          <textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            rows={5}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
                            placeholder="Explique a decisão ou peça documentação complementar."
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={async () => {
                              if (!activeSelectedClaim) return;
                              setSavingStatus(true);
                              try {
                                await updateClaimStatus(
                                  activeSelectedClaim.id,
                                  statusDraft,
                                  reviewNotes,
                                  { id: user?.id, name: user?.nome || 'Administrador' }
                                );
                              } finally {
                                setSavingStatus(false);
                              }
                            }}
                            disabled={savingStatus}
                            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-medium rounded-lg transition-colors"
                          >
                            {savingStatus ? 'Salvando...' : 'Salvar análise'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCopyrightClaims;
