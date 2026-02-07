import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Check, X, Mail, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase-auth';
import SuccessModal from '@/components/ui/SuccessModal';
import ErrorModal from '@/components/ui/ErrorModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface Manager {
  id: number;
  gerente_usuario_id: number;
  nome: string;
  email: string;
  status: 'pendente' | 'ativo' | 'recusado' | 'removido';
  convidado_em: string;
  aceito_em?: string;
}

interface PendingInvite {
  id: number;
  compositor_id: number;
  status: 'pendente' | 'ativo' | 'recusado' | 'removido';
  notas?: string;
  convidado_em: string;
  compositor?: {
    id: number;
    nome?: string;
    nome_artistico?: string;
  } | null;
}

const ComposerManagers: React.FC = () => {
  const { user } = useAuth();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteNotes, setInviteNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [compositorId, setCompositorId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [managerToRemove, setManagerToRemove] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadCompositorId();
    }
  }, [user?.id]);

  useEffect(() => {
    if (compositorId) {
      loadManagers();
    }
  }, [compositorId]);

  useEffect(() => {
    if (user?.id) {
      const timer = setTimeout(() => {
        loadPendingInvites();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  const loadCompositorId = async () => {
    if (!user?.id) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('compositores')
        .select('id')
        .eq('usuario_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar compositor:', error);
        setCompositorId(null);
        return;
      }

      setCompositorId(data?.id ?? null);
    } catch (error) {
      console.error('Erro inesperado ao buscar compositor:', error);
      setCompositorId(null);
    }
  };

  const loadPendingInvites = async () => {
    if (!user?.id) {
      setPendingInvites([]);
      return;
    }

    try {
      setLoadingInvites(true);
      const { data: invites, error } = await supabase
        .from('compositor_gerentes')
        .select('id, compositor_id, status, notas, convidado_em')
        .eq('gerente_usuario_id', user.id)
        .eq('status', 'pendente')
        .order('convidado_em', { ascending: false });

      if (error) {
        throw error;
      }

      const composerIds = Array.from(new Set((invites || []).map((invite) => invite.compositor_id).filter(Boolean)));
      let composerMap: Record<number, PendingInvite['compositor']> = {};

      if (composerIds.length > 0) {
        const { data: composers } = await supabase
          .from('compositores')
          .select('id,nome,nome_artistico')
          .in('id', composerIds);

        composerMap = (composers || []).reduce((acc, composer) => {
          if (composer && composer.id) {
            acc[composer.id] = {
              id: composer.id,
              nome: composer.nome ?? undefined,
              nome_artistico: composer.nome_artistico ?? undefined,
            };
          }
          return acc;
        }, {} as Record<number, PendingInvite['compositor']>);
      }

      setPendingInvites(
        (invites || []).map((invite) => ({
          ...invite,
          compositor: composerMap[invite.compositor_id] ?? null,
        }))
      );
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
      setPendingInvites([]);
    } finally {
      setLoadingInvites(false);
    }
  };

  const loadManagers = async () => {
    if (!compositorId) return;

    try {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from('compositor_gerentes')
        .select('id,status,convidado_em,aceito_em,gerente_usuario_id')
        .eq('compositor_id', compositorId)
        .order('convidado_em', { ascending: false });

      if (error) throw error;

      const managerIds = Array.from(new Set((rows || []).map((row) => row.gerente_usuario_id)));
      let users: { id: number; nome?: string; email?: string }[] = [];

      if (managerIds.length > 0) {
        const res = await supabase
          .from('usuarios')
          .select('id,nome,email')
          .in('id', managerIds);
        users = res.data || [];
      }

      const normalized = (rows || []).map((row) => {
        const userInfo = users.find((u) => u.id === row.gerente_usuario_id);
        return {
          id: row.id,
          gerente_usuario_id: row.gerente_usuario_id,
          nome: userInfo?.nome || 'Gerente',
          email: userInfo?.email || '',
          status: row.status,
          convidado_em: row.convidado_em,
          aceito_em: row.aceito_em ?? undefined,
        };
      });

      setManagers(normalized);
    } catch (error) {
      console.error('Erro ao carregar gerentes:', error);
      setManagers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (inviteId: number) => {
    try {
      const { error } = await supabase
        .from('compositor_gerentes')
        .update({ status: 'ativo', aceito_em: new Date().toISOString() })
        .eq('id', inviteId);

      if (error) throw error;

      setModalTitle('Convite Aceito!');
      setModalMessage('Voce agora e gerente desta conta de compositor.');
      setShowSuccessModal(true);
      loadPendingInvites();
      if (compositorId) {
        loadManagers();
      }
    } catch (error: any) {
      setModalTitle('Erro');
      setModalMessage(error.message || 'Erro ao aceitar convite');
      setShowErrorModal(true);
    }
  };

  const handleRejectInvite = async (inviteId: number) => {
    try {
      const { error } = await supabase
        .from('compositor_gerentes')
        .update({ status: 'recusado' })
        .eq('id', inviteId);

      if (error) throw error;

      setModalTitle('Convite Recusado');
      setModalMessage('O convite foi recusado.');
      setShowSuccessModal(true);
      loadPendingInvites();
    } catch (error: any) {
      setModalTitle('Erro');
      setModalMessage(error.message || 'Erro ao recusar convite');
      setShowErrorModal(true);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!compositorId) {
      setModalTitle('Erro');
      setModalMessage('Compositor nao identificado. Recarregue a pagina.');
      setShowErrorModal(true);
      return;
    }

    if (!inviteEmail) {
      return;
    }

    try {
      setSending(true);
      const { data: managerUser, error: userError } = await supabase
        .from('usuarios')
        .select('id,nome,email')
        .eq('email', inviteEmail)
        .single();

      if (userError || !managerUser) {
        throw userError ?? new Error('Usuario nao encontrado');
      }

      const { error: insertError } = await supabase.from('compositor_gerentes').insert({
        compositor_id: compositorId,
        gerente_usuario_id: managerUser.id,
        status: 'pendente',
        notas: inviteNotes || null,
        convidado_em: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      setModalTitle('Convite Enviado');
      setModalMessage('O convite foi enviado com sucesso! O gestor recebera uma notificacao.');
      setShowSuccessModal(true);
      setInviteEmail('');
      setInviteNotes('');
      loadPendingInvites();
      loadManagers();
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      setModalTitle('Erro ao Enviar Convite');
      setModalMessage(error.message || 'Nao foi possivel enviar o convite. Tente novamente.');
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
      const { error } = await supabase
        .from('compositor_gerentes')
        .delete()
        .eq('id', managerToRemove);

      if (error) throw error;

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
      setModalMessage('Nao foi possivel remover o gerente. Tente novamente.');
      setShowErrorModal(true);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pendente', icon: Clock },
      ativo: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Ativo', icon: Check },
      recusado: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Recusado', icon: X },
      removido: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Removido', icon: Trash2 },
    };

    const badge = (badges as Record<string, typeof badges.pendente>)[status] ?? badges.pendente;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

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
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-white">Gerenciar Gestores de Conta</h1>
          </div>
          <p className="text-gray-400">Convide pessoas para gerenciar sua conta de compositor</p>
        </div>

        {pendingInvites.length > 0 && (
          <div className="bg-gradient-to-r from-blue-900/20 to-primary-900/20 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Convites para Gerenciar Contas</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Voce recebeu {pendingInvites.length} {pendingInvites.length === 1 ? 'convite' : 'convites'} para gerenciar{' '}
              {pendingInvites.length === 1 ? 'uma conta de compositor' : 'contas de compositores'}
            </p>

            <div className="space-y-3">
              {pendingInvites.map((invite) => {
                const composerLabel =
                  invite.compositor?.nome_artistico || invite.compositor?.nome || 'Compositor';
                return (
                  <div
                    key={invite.id}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1">{composerLabel}</h3>
                        <p className="text-sm text-gray-400">
                          Convidado em:{' '}
                          {new Date(invite.convidado_em).toLocaleDateString('pt-BR')}
                        </p>
                        {invite.notas && (
                          <p className="text-sm text-gray-300 mt-2 italic">"{invite.notas}"</p>
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
                );
              })}
            </div>
          </div>
        )}

        {compositorId && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserPlus className="w-6 h-6 text-primary-500" />
              <h2 className="text-xl font-semibold text-white">Enviar Convite</h2>
            </div>
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email do Gerente</label>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Notas (opcional)</label>
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
        message="Tem certeza que deseja remover este gerente? Ele perdera acesso a gestao da sua conta."
        confirmText="Remover"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default ComposerManagers;
