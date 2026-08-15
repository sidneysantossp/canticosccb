import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { documentReviewsApi, type DocumentReview } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { getDocumentSignedUrl } from '@/lib/documentStorage';

interface DocumentReviewSectionProps {
  compositorId: number | string;
  compositorEmail?: string;
  compositorName?: string;
  hasManager?: boolean;
  managerName?: string;
  managerEmail?: string;
  onApprovalChange?: () => void;
}

export const DocumentReviewSection: React.FC<DocumentReviewSectionProps> = ({
  compositorId,
  compositorEmail,
  compositorName,
  hasManager,
  managerName,
  managerEmail,
  onApprovalChange
}) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | number | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [modalType, setModalType] = useState<'approve' | 'reject'>('approve');
  const [currentDocId, setCurrentDocId] = useState<string | number | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [compositorId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      console.log('🔍 [Documentos] Carregando documentos para compositor:', compositorId);

      const response = await documentReviewsApi.getByCompositor(compositorId);
      console.log('🔍 [Documentos] Resposta da API:', response);

      if (response.error) {
        console.error('❌ [Documentos] Erro na resposta:', response.error);
        throw new Error(response.error);
      }

      if (response.data) {
        const docs = response.data.documents || [];
        console.log('✅ [Documentos] Documentos carregados:', docs.length, docs);
        setDocuments(docs);

        // Resolver URLs assinadas para documentos com image_path
        const urlMap: Record<string, string> = {};
        for (const doc of docs) {
          if (doc.image_path) {
            urlMap[doc.id] = await getDocumentSignedUrl(doc.image_path);
          }
        }
        setResolvedUrls(urlMap);
      } else {
        console.warn('⚠️ [Documentos] Nenhum dado retornado');
      }
    } catch (error) {
      console.error('❌ [Documentos] Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNotesModal = (docId: string | number, type: 'approve' | 'reject') => {
    setCurrentDocId(docId);
    setModalType(type);
    setNotes('');
    setShowNotesModal(true);
  };

  const closeNotesModal = () => {
    setShowNotesModal(false);
    setNotes('');
    setCurrentDocId(null);
  };

  const handleReview = async (documentId: string | number, status: 'approved' | 'rejected', notes?: string) => {
    if (!user?.id) return;

    try {
      setReviewingId(documentId);
      const response = await documentReviewsApi.review(documentId, {
        status,
        admin_notes: notes,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Recarregar documentos
      await loadDocuments();

      // Notificar mudança de aprovação
      if (onApprovalChange) {
        onApprovalChange();
      }

      closeNotesModal();
    } catch (error: any) {
      console.error('Erro ao revisar documento:', error);
      alert(error.message || 'Erro ao revisar documento');
    } finally {
      setReviewingId(null);
    }
  };

  const handleSubmitNotes = () => {
    if (!currentDocId) return;

    if (modalType === 'reject' && !notes.trim()) {
      alert('Você precisa informar o motivo da rejeição');
      return;
    }

    handleReview(currentDocId, modalType === 'approve' ? 'approved' : 'rejected', notes || undefined);
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          <FileText className="inline w-5 h-5 mr-2" />
          Documentos para Verificação
        </h3>
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          <FileText className="inline w-5 h-5 mr-2" />
          Documentos para Verificação
        </h3>
        <p className="text-gray-400">Nenhum documento enviado para verificação.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Documentos para Verificação
        </h3>
        {(compositorName || compositorEmail || hasManager) && (
          <div className="ml-7 space-y-1">
            {compositorName && (
              <p className="text-sm text-gray-300">
                <span className="font-medium">Compositor:</span> {compositorName}
              </p>
            )}
            {compositorEmail && (
              <p className="text-sm text-gray-300">
                <span className="font-medium">Email:</span> {compositorEmail}
              </p>
            )}
            {hasManager && managerName && managerEmail && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <p className="text-sm text-yellow-400 font-medium mb-1">
                  ⚠️ Conta Gerenciada
                </p>
                <p className="text-sm text-gray-300">
                  <span className="font-medium">Gerente:</span> {managerName}
                </p>
                <p className="text-sm text-gray-300">
                  <span className="font-medium">Email do Gerente:</span> {managerEmail}
                </p>
              </div>
            )}
            {!hasManager && (
              <p className="text-sm text-gray-400 mt-2">
                <span className="font-medium">Gerenciamento:</span> Conta própria (sem gerente)
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-white font-medium">
                  {doc.document_type.toUpperCase()}
                </h4>
                <p className="text-sm text-gray-400">
                  Nome esperado: {doc.expected_name}
                </p>
                {doc.extracted_name && (
                  <p className="text-sm text-gray-400">
                    Nome extraído: {doc.extracted_name}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Enviado em: {new Date(doc.created_at).toLocaleString('pt-BR')}
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {doc.status === 'approved' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Aprovado
                  </span>
                )}
                {doc.status === 'rejected' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Rejeitado
                  </span>
                )}
                {doc.status === 'pending' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Pendente
                  </span>
                )}
              </div>
            </div>

            {/* Imagem do documento: somente URL assinada de bucket privado. */}
            {doc.image_path && (
              <div className="mb-3">
                {resolvedUrls[doc.id] ? (
                  <img
                    src={resolvedUrls[doc.id]}
                    alt={`Documento ${doc.document_type}`}
                    className="max-w-full h-auto rounded border border-gray-700"
                    style={{ maxHeight: '300px' }}
                    onError={(e) => {
                      console.error('Erro ao carregar imagem assinada:', doc.image_path);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="rounded border border-gray-700 bg-gray-900/50 px-3 py-4 text-sm text-gray-400">
                    Documento privado indisponível. Confirme a permissão de revisão e o caminho no Storage.
                  </div>
                )}
              </div>
            )}

            {/* Notas do admin */}
            {doc.admin_notes && (
              <div className="mb-3 p-3 bg-gray-900 rounded border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Notas do revisor:</p>
                <p className="text-sm text-gray-300">{doc.admin_notes}</p>
              </div>
            )}

            {/* Botões de ação (apenas para documentos pendentes) */}
            {doc.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => openNotesModal(doc.id, 'approve')}
                  disabled={reviewingId === doc.id}
                  className="flex-1 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprovar
                </button>
                <button
                  onClick={() => openNotesModal(doc.id, 'reject')}
                  disabled={reviewingId === doc.id}
                  className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Rejeitar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de Notas */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {modalType === 'approve' ? 'Aprovar Documento' : 'Rejeitar Documento'}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {modalType === 'approve'
                  ? 'Adicionar notas (opcional):'
                  : 'Motivo da rejeição (obrigatório):'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={modalType === 'approve'
                  ? 'Ex: Documento aprovado, dados conferidos'
                  : 'Ex: Documento ilegível, favor reenviar'}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeNotesModal}
                disabled={reviewingId !== null}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitNotes}
                disabled={reviewingId !== null}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${modalType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
              >
                {reviewingId !== null ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
