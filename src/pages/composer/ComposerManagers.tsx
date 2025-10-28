import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Check, X, Mail, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextMock';
import { compositorGerentesApi } from '@/lib/api-client';
import SuccessModal from '@/components/ui/SuccessModal';
import ErrorModal from '@/components/ui/ErrorModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface Manager {
  id: number;
  gerente_usuario_id: number;
  nome: string;  // Nome vem direto da query SQL
  email: string; // Email vem direto da query SQL
  status: 'pendente' | 'ativo' | 'recusado' | 'removido';
  convidado_em: string;
  aceito_em?: string;
}

const ComposerManagers: React.FC = () => {
  const { user } = useAuth();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteNotes, setInviteNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [compositorId, setCompositorId] = useState<number | null>(null);
  
  // Estados dos modais
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [managerToRemove, setManagerToRemove] = useState<number | null>(null);

  useEffect(() => {
    loadCompositorId();
  }, [user]);

  useEffect(() => {
    if (compositorId) {
      loadManagers();
    }
  }, [compositorId]);

  useEffect(() => {
    console.log('🔄 useEffect [user] disparado - user:', user);
    
    if (user?.id && user?.email) {
      console.log('✅ User válido, buscando convites...');
      // Delay para garantir que user está completamente carregado
      const timer = setTimeout(() => {
        loadPendingInvites();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      console.log('⏳ User ainda não carregado completamente', {
        hasUser: !!user,
        hasId: !!user?.id,
        hasEmail: !!user?.email
      });
    }
  }, [user]);

  const loadCompositorId = async () => {
    if (!user?.id) {
      console.log('❌ Usuário não identificado');
      return;
    }

    try {
      console.log('🔍 Buscando compositor para usuario_id:', user.id);
      
      // Buscar ID do compositor pelo usuario_id
      const response: any = await fetch(`/api/compositores/index.php?limit=100`);
      const data = await response.json();
      
      console.log('📦 Compositores retornados:', data.compositores);
      
      const compositor = data.compositores?.find((c: any) => c.usuario_id === user.id);
      
      if (compositor) {
        console.log('✅ Compositor encontrado:', compositor);
        setCompositorId(compositor.id);
      } else {
        console.log('❌ Compositor não encontrado para usuario_id:', user.id);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar compositor:', error);
    }
  };

  const loadPendingInvites = async () => {
    if (!user?.id) {
      console.log('❌ loadPendingInvites: user.id não encontrado');
      return;
    }

    try {
      setLoadingInvites(true);
      const url = `/api/compositor-gerentes/?action=compositores-gerenciados&usuario_id=${user.id}`;
      console.log('🔍 Buscando convites para user_id:', user.id);
      console.log('📡 URL COMPLETA:', url);
      
      const response = await fetch(url);
      console.log('📬 Response status:', response.status);
      console.log('📬 Response ok:', response.ok);
      
      const responseText = await response.text();
      console.log('📄 Response TEXT (primeiros 500 chars):', responseText.substring(0, 500));
      
      const data = JSON.parse(responseText);
      console.log('✅ Data PARSEADO:', data);
      
      console.log('📥 Resposta buscaConvites:', data);
      console.log('📊 Data.success:', data.success);
      console.log('📊 Data.data:', data.data);
      console.log('📊 Array.isArray(data.data):', Array.isArray(data.data));
      
      if (data.success && data.data) {
        console.log('✅ Convites encontrados:', data.data.length);
        console.log('📋 Convites completos:', JSON.stringify(data.data, null, 2));
        
        data.data.forEach((invite: any, index: number) => {
          console.log(`Convite ${index}:`, {
            id: invite.id,
            status: invite.status,
            statusType: typeof invite.status,
            isPending: invite.status === 'pendente',
            compositor: invite.nome || invite.compositor_nome
          });
        });
        
        const pending = data.data.filter((invite: any) => {
          console.log(`Filtrando invite ${invite.id}: status="${invite.status}" === "pendente"?`, invite.status === 'pendente');
          return invite.status === 'pendente';
        });
        
        console.log('⏳ Convites pendentes APÓS filtro:', pending.length, pending);
        setPendingInvites(pending);
      } else {
        console.log('⚠️ Nenhum convite encontrado ou success=false');
        setPendingInvites([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar convites:', error);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleAcceptInvite = async (inviteId: number) => {
    try {
      const response = await fetch(`/api/compositor-gerentes/${inviteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'aceitar' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setModalTitle('Convite Aceito!');
        setModalMessage('Você agora é gerente desta conta de compositor.');
        setShowSuccessModal(true);
        loadPendingInvites();
        // Recarregar gerentes também
        if (compositorId) {
          loadManagers();
        }
      } else {
        throw new Error(data.error || 'Erro ao aceitar convite');
      }
    } catch (error: any) {
      setModalTitle('Erro');
      setModalMessage(error.message || 'Erro ao aceitar convite');
      setShowErrorModal(true);
    }
  };

  const handleRejectInvite = async (inviteId: number) => {
    try {
      const response = await fetch(`/api/compositor-gerentes/${inviteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'recusar' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setModalTitle('Convite Recusado');
        setModalMessage('O convite foi recusado.');
        setShowSuccessModal(true);
        loadPendingInvites();
      } else {
        throw new Error(data.error || 'Erro ao recusar convite');
      }
    } catch (error: any) {
      setModalTitle('Erro');
      setModalMessage(error.message || 'Erro ao recusar convite');
      setShowErrorModal(true);
    }
  };

  const loadManagers = async () => {
    if (!compositorId) return;

    try {
      setLoading(true);
      const response: any = await compositorGerentesApi.listarGerentes(compositorId);

      console.log('📋 Resposta da API (listarGerentes):', response);

      // O cliente api-client.ts retorna { data: payload }
      // payload pode ser:
      // 1) Array direto de gerentes
      // 2) Objeto { success: boolean, data: [...] }
      const payload = response?.data;
      const list = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.data) ? payload.data : []);

      console.log('👥 Gerentes normalizados:', list.length);
      setManagers(list);
    } catch (error) {
      console.error('❌ Erro ao carregar gerentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!compositorId) {
      console.log('❌ compositor_id não definido');
      setModalTitle('Erro');
      setModalMessage('Compositor não identificado. Recarregue a página.');
      setShowErrorModal(true);
      return;
    }
    
    if (!inviteEmail) {
      console.log('❌ Email não informado');
      return;
    }

    try {
      console.log('📤 Enviando convite:', { compositor_id: compositorId, email_gerente: inviteEmail });
      
      setSending(true);
      const result: any = await compositorGerentesApi.convidar({
        compositor_id: compositorId,
        email_gerente: inviteEmail,
        notas: inviteNotes || undefined
      });

      console.log('📦 Resposta do convite:', result);

      // Verificar se houve erro
      if (result.error) {
        console.error('❌ Erro ao enviar convite:', result.error);
        setModalTitle('Erro ao Enviar Convite');
        setModalMessage(result.error);
        setShowErrorModal(true);
        setSending(false);
        return;
      }

      console.log('✅ Convite enviado com sucesso:', result);

      setModalTitle('Convite Enviado');
      setModalMessage('O convite foi enviado com sucesso! O gestor receberá uma notificação.');
      setShowSuccessModal(true);
      setInviteEmail('');
      setInviteNotes('');
      loadManagers();
    } catch (error: any) {
      console.error('❌ Exceção ao enviar convite:', error);
      setModalTitle('Erro ao Enviar Convite');
      setModalMessage(error.message || 'Não foi possível enviar o convite. Tente novamente.');
      setShowErrorModal(true);
    } finally {
      setSending(false);
    }
  };

  const handleRemoveManagerClick = (managerId: number) => {
    setManagerToRemove(managerId);
    setShowConfirmModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!managerToRemove) return;

    try {
      await compositorGerentesApi.remover(managerToRemove);
      setShowConfirmModal(false);
      setModalTitle('Gerente Removido');
      setModalMessage('O gerente foi removido com sucesso da sua conta.');
      setShowSuccessModal(true);
      setManagerToRemove(null);
      loadManagers();
    } catch (error) {
      console.error('Erro ao remover gerente:', error);
      setShowConfirmModal(false);
      setModalTitle('Erro ao Remover Gerente');
      setModalMessage('Não foi possível remover o gerente. Tente novamente.');
      setShowErrorModal(true);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pendente', icon: Clock },
      ativo: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Ativo', icon: Check },
      recusado: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Recusado', icon: X },
      removido: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Removido', icon: Trash2 }
    };

    const badge = badges[status as keyof typeof badges] || badges.pendente;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  console.log('🎨 RENDER - pendingInvites.length:', pendingInvites.length);
  console.log('🎨 RENDER - pendingInvites:', pendingInvites);
  console.log('🎨 RENDER - loading:', loading);
  console.log('🎨 RENDER - loadingInvites:', loadingInvites);
  console.log('🎨 RENDER - compositorId:', compositorId);

  // Se está carregando E não tem convites, mostra loading
  // Mas se tem convites pendentes, mostra eles independente do loading
  if (loading && !compositorId && loadingInvites && pendingInvites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-white">Gerenciar Gestores de Conta</h1>
          </div>
          <p className="text-gray-400">
            Convide pessoas para gerenciar sua conta de compositor
          </p>
        </div>

        {/* Convites Pendentes Recebidos */}
        {pendingInvites.length > 0 && (
          <div className="bg-gradient-to-r from-blue-900/20 to-primary-900/20 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Convites para Gerenciar Contas</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Você recebeu {pendingInvites.length} {pendingInvites.length === 1 ? 'convite' : 'convites'} para gerenciar {pendingInvites.length === 1 ? 'uma conta de compositor' : 'contas de compositores'}
            </p>

            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-1">
                        {invite.nome_artistico || invite.compositor_nome || invite.nome}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Convidado em: {new Date(invite.convidado_em).toLocaleDateString('pt-BR')}
                      </p>
                      {invite.notas && (
                        <p className="text-sm text-gray-300 mt-2 italic">
                          "{invite.notas}"
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptInvite(invite.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Aceitar</span>
                      </button>
                      <button
                        onClick={() => handleRejectInvite(invite.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Recusar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulário de Convite */}
        {compositorId && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <UserPlus className="w-6 h-6 text-primary-500" />
            <h2 className="text-xl font-semibold text-white">Enviar Convite</h2>
          </div>

          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email do Gerente
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="gerente@exemplo.com"
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={inviteNotes}
                onChange={(e) => setInviteNotes(e.target.value)}
                placeholder="Adicione uma mensagem ao convite..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={sending || !inviteEmail}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              {sending ? 'Enviando...' : 'Enviar Convite'}
            </button>
          </form>
        </div>
        )}
        {/* Lista de Gerentes */}
        {compositorId && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Gerentes da Conta</h2>

          {managers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum gerente convidado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {managers.map((manager) => (
                <div
                  key={manager.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">{manager.nome}</h3>
                      {getStatusBadge(manager.status)}
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{manager.email}</p>
                    <p className="text-xs text-gray-500">
                      Convidado em: {new Date(manager.convidado_em).toLocaleDateString('pt-BR')}
                      {manager.aceito_em && ` • Aceito em: ${new Date(manager.aceito_em).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>

                  {manager.status === 'ativo' && (
                    <button
                      onClick={() => handleRemoveManagerClick(manager.id)}
                      className="ml-4 p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      title="Remover gerente"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
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

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setManagerToRemove(null);
        }}
        onConfirm={handleConfirmRemove}
        title="Remover Gerente"
        message="Tem certeza que deseja remover este gerente? Ele perderá acesso à gestão da sua conta."
        confirmText="Remover"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default ComposerManagers;
