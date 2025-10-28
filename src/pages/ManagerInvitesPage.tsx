import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Clock, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextMock';
import { useNavigate } from 'react-router-dom';
import { compositorGerentesApi } from '@/lib/api-client';
import SuccessModal from '@/components/ui/SuccessModal';
import ErrorModal from '@/components/ui/ErrorModal';

interface Invite {
  id: number;
  compositor_id: number;
  compositor_nome: string;
  compositor_nome_artistico: string;
  status: string;
  convidado_em: string;
  notas?: string;
}

const ManagerInvitesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  
  // Estados dos modais
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  useEffect(() => {
    loadInvites();
  }, [user]);

  const loadInvites = async () => {
    if (!user?.email) {
      console.log('📧 [Convites] Usuário sem email');
      return;
    }

    try {
      setLoading(true);
      console.log('📧 [Convites] Buscando usuário:', user.email);
      
      const response: any = await compositorGerentesApi.buscarUsuario(user.email);
      console.log('📧 [Convites] Resposta buscarUsuario:', response);
      
      // A API retorna response.data.id (não user_id)
      if (response.data?.id) {
        // Buscar convites para este usuário
        console.log('📧 [Convites] Buscando convites para user_id:', response.data.id);
        
        const invitesResponse: any = await compositorGerentesApi.listarCompositores(response.data.id);
        console.log('📧 [Convites] Resposta listarCompositores:', invitesResponse);
        
        const dataArray = Array.isArray(invitesResponse.data) ? invitesResponse.data : invitesResponse.data?.compositores || [];
        console.log('📧 [Convites] Array de convites:', dataArray);
        
        // Filtrar apenas pendentes
        const pendingInvites = dataArray.filter((inv: any) => inv.status === 'pendente');
        console.log('📧 [Convites] Convites pendentes:', pendingInvites);
        
        setInvites(pendingInvites);
      } else {
        console.log('❌ [Convites] user_id não encontrado');
      }
    } catch (error) {
      console.error('❌ [Convites] Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (inviteId: number) => {
    try {
      setProcessing(inviteId);
      await compositorGerentesApi.aceitar(inviteId);
      setModalTitle('Convite Aceito');
      setModalMessage('Agora você pode gerenciar esta conta de compositor!');
      setShowSuccessModal(true);
      loadInvites();
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      setModalTitle('Erro ao Aceitar Convite');
      setModalMessage('Não foi possível aceitar o convite. Tente novamente.');
      setShowErrorModal(true);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (inviteId: number) => {
    try {
      setProcessing(inviteId);
      await compositorGerentesApi.recusar(inviteId);
      setModalTitle('Convite Recusado');
      setModalMessage('Você recusou o convite para gerenciar esta conta.');
      setShowSuccessModal(true);
      loadInvites();
    } catch (error) {
      console.error('Erro ao recusar convite:', error);
      setModalTitle('Erro ao Recusar Convite');
      setModalMessage('Não foi possível recusar o convite. Tente novamente.');
      setShowErrorModal(true);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando convites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Botão Voltar */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-white">Convites para Gerenciar Contas</h1>
          </div>
          <p className="text-gray-400">
            Você recebeu convites para gerenciar contas de compositores
          </p>
        </div>

        {/* Lista de Convites */}
        {invites.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhum convite pendente
            </h3>
            <p className="text-gray-400">
              Você não possui convites pendentes no momento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-primary-500/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {invite.compositor_nome_artistico || invite.compositor_nome}
                        </h3>
                        {invite.compositor_nome_artistico && (
                          <p className="text-sm text-gray-400">{invite.compositor_nome}</p>
                        )}
                      </div>
                    </div>

                    {invite.notas && (
                      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-300">{invite.notas}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-4 h-4" />
                      Convidado em: {new Date(invite.convidado_em).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleAccept(invite.id)}
                      disabled={processing === invite.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-all"
                    >
                      <Check className="w-4 h-4" />
                      Aceitar
                    </button>
                    <button
                      onClick={() => handleReject(invite.id)}
                      disabled={processing === invite.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-all"
                    >
                      <X className="w-4 h-4" />
                      Recusar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modais */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={modalTitle}
        message={modalMessage}
      />

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={modalTitle}
        message={modalMessage}
      />
    </div>
  );
};

export default ManagerInvitesPage;
