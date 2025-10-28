import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, User, Mail, Phone, FileText, Shield } from 'lucide-react';
import { compositoresApi, documentReviewsApi } from '@/lib/api-client';

interface PendingComposer {
  id: number;
  nome: string;
  nome_artistico: string;
  email: string;
  biografia: string;
  created_at: string;
  documents?: any[];
}

const AdminComposersPending: React.FC = () => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingComposers, setPendingComposers] = useState<PendingComposer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingComposers();
  }, []);

  const loadPendingComposers = async () => {
    try {
      setLoading(true);
      console.log('📋 [Pending] Carregando compositores pendentes...');
      
      // Carregar todos os compositores
      const response = await compositoresApi.list({ limit: 100 });
      console.log('📋 [Pending] Resposta API:', response);
      
      if (response.data) {
        const apiData = response.data as any;
        const allComposers = apiData.compositores || [];
        
        // Filtrar apenas não verificados
        const pending = allComposers.filter((c: any) => !c.verificado);
        console.log('📋 [Pending] Compositores não verificados:', pending);
        
        // Carregar documentos para cada compositor
        const composersWithDocs = await Promise.all(
          pending.map(async (composer: any) => {
            try {
              const docsResponse = await documentReviewsApi.getByCompositor(composer.id);
              return {
                ...composer,
                documents: docsResponse.data?.documents || []
              };
            } catch (error) {
              console.error(`Erro ao carregar documentos do compositor ${composer.id}:`, error);
              return { ...composer, documents: [] };
            }
          })
        );
        
        console.log('📋 [Pending] Compositores com documentos:', composersWithDocs);
        setPendingComposers(composersWithDocs);
      }
    } catch (error) {
      console.error('❌ [Pending] Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando compositores pendentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Aprovação de Compositores</h1>
        <p className="text-gray-400">{pendingComposers.length} solicitações pendentes</p>
      </div>

      {pendingComposers.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Tudo em dia!</h3>
          <p className="text-gray-400">Não há compositores aguardando aprovação</p>
        </div>
      ) : (
        <div className="space-y-6">
        {pendingComposers.map((composer) => (
          <div key={composer.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{composer.nome_artistico || composer.nome}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-400">
                      <User className="w-4 h-4" />
                      <span>{composer.nome}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{composer.email}</span>
                    </div>
                  </div>
                </div>

                {composer.biografia && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Biografia</h4>
                    <p className="text-gray-300 text-sm">{composer.biografia}</p>
                  </div>
                )}

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Documentos Enviados ({composer.documents?.length || 0})</h4>
                  {composer.documents && composer.documents.length > 0 ? (
                    <div className="space-y-4">
                      {composer.documents.map((doc: any) => (
                        <div key={doc.id} className="border border-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-400" />
                              <span className="text-white text-sm font-medium">{doc.document_type?.toUpperCase()}</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              doc.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                              doc.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {doc.status === 'pending' ? 'Pendente' : doc.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                            </span>
                          </div>
                          {doc.image_path && (
                            <img
                              src={`/api/stream.php?type=documents&file=${doc.image_path.split('/').pop()}`}
                              alt={doc.document_type}
                              className="w-full rounded border border-gray-700 mt-2"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="%23374151"/><text x="50%" y="50%" text-anchor="middle" fill="%239CA3AF" font-size="14">Imagem não disponível</text></svg>';
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">Nenhum documento enviado</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">Informações</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cadastrado em:</span>
                      <span className="text-white">
                        {new Date(composer.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Documentos:</span>
                      <span className="text-white">{composer.documents?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-yellow-400">Pendente</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Aprovar Compositor
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Rejeitar
                  </button>
                  <button className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
                    <Eye className="w-5 h-5" />
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Rejeitar Compositor</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo da rejeição..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg"
              >
                Cancelar
              </button>
              <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComposersPending;
