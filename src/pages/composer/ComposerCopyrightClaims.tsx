import { useState, useEffect } from 'react';
import { Copyright, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import useCopyrightClaimsStore, { CopyrightClaim } from '@/stores/copyrightClaimsStore';
import CopyrightClaimChat from '@/components/CopyrightClaimChat';

const ComposerCopyrightClaims = () => {
  const { claims, getClaimsByComposer } = useCopyrightClaimsStore();
  const [selectedClaim, setSelectedClaim] = useState<CopyrightClaim | null>(null);
  const [showChat, setShowChat] = useState(false);
  
  // TODO: Pegar ID do compositor logado
  const composerId = 'composer_1';
  const composerName = 'João Silva';
  
  const myClaims = getClaimsByComposer(composerId);

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
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Copyright className="w-8 h-8 text-amber-500" />
              Minhas Reivindicações de Direitos Autorais
            </h1>
            <p className="text-gray-400 mt-1">
              Acompanhe suas reivindicações e converse com nossa equipe
            </p>
          </div>
        </div>

        {/* Alert */}
        <div className="bg-amber-900/20 border border-amber-900/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-amber-500 mt-0.5">⚠️</div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-400 mb-1">Canal Exclusivo para Direitos Autorais</h4>
              <p className="text-xs text-amber-200/80">
                Este espaço é exclusivo para assuntos relacionados a direitos autorais de suas composições. 
                Para outras dúvidas ou suporte técnico, acesse o menu <strong>Suporte</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-background-secondary rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{myClaims.length}</p>
              </div>
              <Copyright className="w-8 h-8 text-gray-600" />
            </div>
          </div>

          <div className="bg-background-secondary rounded-lg p-4 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-400">Pendentes</p>
                <p className="text-2xl font-bold text-white">
                  {myClaims.filter(c => c.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-background-secondary rounded-lg p-4 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-400">Em Análise</p>
                <p className="text-2xl font-bold text-white">
                  {myClaims.filter(c => c.status === 'in_review').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-background-secondary rounded-lg p-4 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-400">Aprovadas</p>
                <p className="text-2xl font-bold text-white">
                  {myClaims.filter(c => c.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Claims List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Suas Reivindicações</h2>
          
          {myClaims.length === 0 ? (
            <div className="bg-background-secondary rounded-lg p-12 text-center">
              <Copyright className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Nenhuma reivindicação ainda
              </h3>
              <p className="text-gray-500 mb-6">
                Você ainda não fez nenhuma reivindicação de direitos autorais.
              </p>
              <button className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Nova Reivindicação
              </button>
            </div>
          ) : (
            myClaims.map((claim) => (
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
                        {claim.hasUnreadMessages && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full animate-pulse">
                            NOVA MENSAGEM
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{claim.songArtist}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Tipo: <strong className="text-white capitalize">{claim.claimType}</strong></span>
                        <span>•</span>
                        <span>{new Date(claim.createdAt).toLocaleDateString('pt-BR')}</span>
                        {claim.lastMessageAt && (
                          <>
                            <span>•</span>
                            <span>Última msg: {new Date(claim.lastMessageAt).toLocaleDateString('pt-BR')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${getStatusColor(claim.status)}`}>
                      {getStatusIcon(claim.status)}
                      <span className="text-sm font-medium">{getStatusText(claim.status)}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedClaim(claim);
                        setShowChat(true);
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {claim.hasUnreadMessages ? 'Ver Mensagens' : 'Abrir Chat'}
                    </button>
                  </div>
                </div>

                {/* Description Preview */}
                {claim.description && (
                  <div className="mt-4 p-3 bg-background-tertiary rounded-lg border border-gray-600">
                    <p className="text-sm text-gray-300 line-clamp-2">{claim.description}</p>
                  </div>
                )}

                {/* Admin Notes */}
                {claim.reviewerNotes && (
                  <div className="mt-4 p-3 bg-blue-900/20 border border-blue-900/30 rounded-lg">
                    <p className="text-xs text-blue-400 font-semibold mb-1">Notas do Administrador:</p>
                    <p className="text-sm text-blue-200">{claim.reviewerNotes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {selectedClaim && showChat && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800">
              <div>
                <h2 className="text-xl font-bold text-white">Chat - Direitos Autorais</h2>
                <p className="text-sm text-gray-400">{selectedClaim.songTitle}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedClaim(null);
                  setShowChat(false);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <CopyrightClaimChat
                claim={selectedClaim}
                userRole="composer"
                userId={composerId}
                userName={composerName}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComposerCopyrightClaims;
