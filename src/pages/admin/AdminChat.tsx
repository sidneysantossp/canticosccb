import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, Filter, MessageSquare, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SupportThreadConversation from '@/components/support/SupportThreadConversation';
import {
  listSupportThreads,
  markSupportThreadAsRead,
  sendSupportMessage,
  subscribeToSupportInbox,
  updateSupportThreadStatus,
  type SupportThread,
  type SupportThreadStatus,
} from '@/lib/supportChatApi';

function getStatusMeta(status: SupportThread['status']) {
  switch (status) {
    case 'pending':
      return {
        label: 'Aguardando',
        className: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
      };
    case 'in_review':
      return {
        label: 'Em atendimento',
        className: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      };
    case 'resolved':
      return {
        label: 'Resolvido',
        className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      };
    case 'archived':
      return {
        label: 'Arquivado',
        className: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
      };
  }
}

function formatDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const AdminChat: React.FC = () => {
  const { user, profile } = useAuth();
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SupportThreadStatus>('all');
  const actor = useMemo(
    () => ({
      userId: user?.id,
      isAdmin: profile?.is_admin === true || user?.tipo === 'admin',
    }),
    [profile?.is_admin, user?.id, user?.tipo]
  );

  const upsertThread = useCallback((thread: SupportThread) => {
    setThreads((current) => {
      const next = current.filter((item) => item.id !== thread.id);
      next.unshift(thread);
      return next.sort((left, right) => String(right.lastMessageAt || right.updatedAt).localeCompare(String(left.lastMessageAt || left.updatedAt)));
    });
  }, []);

  const loadThreads = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listSupportThreads({ includeResolved: true });
      setThreads(data);
      setSelectedId((current) => {
        if (current && data.some((thread) => thread.id === current)) return current;
        return data[0]?.id || null;
      });
    } catch (loadError: any) {
      setError(loadError?.message || 'Não foi possível carregar os chamados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    const subscription = subscribeToSupportInbox({
      onChange: () => {
        void loadThreads();
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadThreads]);

  const filteredThreads = useMemo(
    () =>
      threads.filter((thread) => {
        const matchesStatus = statusFilter === 'all' || thread.status === statusFilter;
        const haystack = `${thread.subjectLabel} ${thread.requesterName} ${thread.requesterEmail} ${thread.lastMessagePreview}`.toLowerCase();
        const matchesSearch = !searchQuery.trim() || haystack.includes(searchQuery.trim().toLowerCase());
        return matchesStatus && matchesSearch;
      }),
    [searchQuery, statusFilter, threads]
  );

  useEffect(() => {
    if (!selectedId) return;
    if (!filteredThreads.some((thread) => thread.id === selectedId)) {
      setSelectedId(filteredThreads[0]?.id || null);
    }
  }, [filteredThreads, selectedId]);

  const activeThread = useMemo(
    () => filteredThreads.find((thread) => thread.id === selectedId) || threads.find((thread) => thread.id === selectedId) || null,
    [filteredThreads, selectedId, threads]
  );

  useEffect(() => {
    if (!activeThread?.hasUnreadForAdmin) return;
    void markSupportThreadAsRead(activeThread.id, 'admin', actor)
      .then((thread) => {
        upsertThread(thread);
      })
      .catch((markError) => {
        console.error('Erro ao marcar chamado como lido:', markError);
      });
  }, [activeThread?.id, activeThread?.hasUnreadForAdmin, actor, upsertThread]);

  const unreadCount = threads.filter((thread) => thread.hasUnreadForAdmin).length;
  const pendingCount = threads.filter((thread) => thread.status === 'pending').length;
  const inReviewCount = threads.filter((thread) => thread.status === 'in_review').length;

  const handleSendMessage = async (threadId: string, message: string) => {
    try {
      setSending(true);
      setError('');
      const thread = await sendSupportMessage(
        threadId,
        {
          senderRole: 'admin',
          senderName: profile?.nome || user?.nome || 'Equipe Cânticos CCB',
          message,
        },
        actor
      );
      upsertThread(thread);
    } catch (sendError: any) {
      setError(sendError?.message || 'Não foi possível enviar a resposta.');
      throw sendError;
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (threadId: string, status: SupportThreadStatus) => {
    try {
      setUpdatingStatus(true);
      setError('');
      const thread = await updateSupportThreadStatus(threadId, status, actor);
      upsertThread(thread);
    } catch (statusError: any) {
      setError(statusError?.message || 'Não foi possível atualizar o status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleArchive = async (threadId: string) => {
    try {
      setArchivingId(threadId);
      setError('');
      await updateSupportThreadStatus(threadId, 'archived', actor);
      setThreads((current) => current.filter((thread) => thread.id !== threadId));
      setSelectedId((current) => (current === threadId ? null : current));
    } catch (archiveError: any) {
      setError(archiveError?.message || 'Não foi possível arquivar o chamado.');
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary p-6 space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary-500" />
            Chat
          </h1>
          <p className="text-gray-400 mt-2">
            Responda chamados dos usuários em tempo real e acompanhe a fila de atendimento.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-gray-800 bg-background-secondary px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Novas mensagens</p>
            <p className="text-2xl font-semibold text-white">{unreadCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-background-secondary px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Pendentes</p>
            <p className="text-2xl font-semibold text-white">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-background-secondary px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Em atendimento</p>
            <p className="text-2xl font-semibold text-white">{inReviewCount}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-900/40 bg-red-900/20 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-800 bg-background-secondary p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Fila de atendimento</p>
                <p className="text-xs text-gray-500 mt-1">{threads.length} chamado(s)</p>
              </div>
              <button
                type="button"
                onClick={() => void loadThreads()}
                className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por usuário, email ou assunto"
                className="w-full rounded-2xl border border-gray-800 bg-black/30 pl-10 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="relative">
              <Filter className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | SupportThreadStatus)}
                className="w-full rounded-2xl border border-gray-800 bg-black/30 pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
              >
                <option value="all">Todos os status</option>
                <option value="pending">Aguardando atendimento</option>
                <option value="in_review">Em atendimento</option>
                <option value="resolved">Resolvido</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-background-secondary overflow-hidden">
            <div className="max-h-[640px] overflow-y-auto">
              {loading ? (
                <div className="px-4 py-10 text-center text-gray-400 text-sm">Carregando chamados...</div>
              ) : filteredThreads.length === 0 ? (
                <div className="px-4 py-10 text-center text-gray-400 text-sm">
                  Nenhum chamado encontrado com os filtros atuais.
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const statusMeta = getStatusMeta(thread.status);
                  const active = thread.id === selectedId;

                  return (
                    <div
                      key={thread.id}
                      className={`relative border-b border-gray-800 transition-colors ${
                        active ? 'bg-primary-500/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(thread.id)}
                        className="w-full text-left px-4 py-4"
                      >
                        <div className={`flex items-start justify-between gap-3 ${thread.status === 'resolved' ? 'pr-9' : ''}`}>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-white truncate">{thread.subjectLabel}</p>
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusMeta.className}`}>
                                {statusMeta.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 mt-2 truncate">{thread.requesterName}</p>
                            <p className="text-xs text-gray-500 truncate">{thread.requesterEmail}</p>
                            <p className="text-sm text-gray-400 line-clamp-2 mt-2">
                              {thread.lastMessagePreview || thread.initialMessage}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">{formatDate(thread.lastMessageAt || thread.updatedAt)}</p>
                          </div>

                          {thread.hasUnreadForAdmin && (
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>

                      {thread.status === 'resolved' && (
                        <button
                          type="button"
                          onClick={() => void handleArchive(thread.id)}
                          disabled={archivingId === thread.id}
                          aria-label="Arquivar chamado resolvido"
                          title="Arquivar chamado"
                          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-wait disabled:opacity-50"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <SupportThreadConversation
          thread={activeThread}
          currentUserId={user?.id || ''}
          currentUserName={profile?.nome || user?.nome || 'Equipe Cânticos CCB'}
          role="admin"
          sending={sending}
          updatingStatus={updatingStatus}
          onSendMessage={handleSendMessage}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </div>
  );
};

export default AdminChat;
