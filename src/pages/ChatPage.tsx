import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Plus, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SupportThreadConversation from '@/components/support/SupportThreadConversation';
import {
  SUPPORT_SUBJECT_OPTIONS,
  createSupportThread,
  listSupportThreads,
  markSupportThreadAsRead,
  sendSupportMessage,
  subscribeToSupportInbox,
  type SupportSubjectKey,
  type SupportThread,
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

const NEW_THREAD_VIEW = '__new-thread__';

const ChatPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedView, setSelectedView] = useState<string>(NEW_THREAD_VIEW);
  const [subjectKey, setSubjectKey] = useState<SupportSubjectKey>(SUPPORT_SUBJECT_OPTIONS[0].key);
  const [draftMessage, setDraftMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const actor = useMemo(
    () => ({
      userId: user?.id,
      isAdmin: false,
    }),
    [user?.id]
  );

  const upsertThread = useCallback((thread: SupportThread) => {
    setThreads((current) => {
      const next = current.filter((item) => item.id !== thread.id);
      next.unshift(thread);
      return next.sort((left, right) => String(right.lastMessageAt || right.updatedAt).localeCompare(String(left.lastMessageAt || left.updatedAt)));
    });
  }, []);

  const loadThreads = useCallback(async () => {
    if (!user?.id) {
      setThreads([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await listSupportThreads({ userId: user.id, includeResolved: true });
      setThreads(data);
      setSelectedView((current) => {
        if (current === NEW_THREAD_VIEW) return current;
        if (data.some((thread) => thread.id === current)) return current;
        return data[0]?.id || NEW_THREAD_VIEW;
      });
    } catch (loadError: any) {
      setError(loadError?.message || 'Não foi possível carregar o chat.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!user?.id) return;
    const subscription = subscribeToSupportInbox({
      userId: user.id,
      onChange: () => {
        void loadThreads();
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadThreads, user?.id]);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === selectedView) || null,
    [selectedView, threads]
  );

  useEffect(() => {
    if (!activeThread?.hasUnreadForUser) return;
    void markSupportThreadAsRead(activeThread.id, 'user', actor)
      .then((thread) => {
        upsertThread(thread);
      })
      .catch((markError) => {
        console.error('Erro ao marcar chat como lido:', markError);
      });
  }, [activeThread?.id, activeThread?.hasUnreadForUser, actor, upsertThread]);

  const unreadCount = threads.filter((thread) => thread.hasUnreadForUser).length;
  const openCount = threads.filter((thread) => thread.status !== 'resolved').length;

  const handleCreateThread = async (event: React.FormEvent) => {
    event.preventDefault();
    const requesterName = profile?.nome || user?.nome || 'Usuário';
    if (!user?.id || !requesterName || !user.email || !draftMessage.trim()) return;

    try {
      setCreating(true);
      setError('');
      const thread = await createSupportThread(
        {
          subjectKey,
          requesterName,
          requesterEmail: user.email,
          message: draftMessage.trim(),
        },
        actor
      );
      upsertThread(thread);
      setDraftMessage('');
      setSelectedView(thread.id);
    } catch (createError: any) {
      setError(createError?.message || 'Não foi possível abrir o chamado.');
    } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = async (threadId: string, message: string) => {
    const senderName = profile?.nome || user?.nome || 'Usuário';
    if (!senderName) return;

    try {
      setSending(true);
      setError('');
      const thread = await sendSupportMessage(
        threadId,
        {
          senderRole: 'user',
          senderName,
          message,
        },
        actor
      );
      upsertThread(thread);
    } catch (sendError: any) {
      setError(sendError?.message || 'Não foi possível enviar a mensagem.');
      throw sendError;
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-24 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary-500" />
              Chat
            </h1>
            <p className="text-gray-400 mt-2">
              Abra um chamado, aguarde nossa resposta e acompanhe tudo em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-gray-800 bg-background-secondary px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Em aberto</p>
              <p className="text-2xl font-semibold text-white">{openCount}</p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-background-secondary px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Novas respostas</p>
              <p className="text-2xl font-semibold text-white">{unreadCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-primary-500/20 bg-primary-500/5 px-5 py-4 text-sm text-gray-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white">Canal direto com a equipe</p>
              <p className="mt-1 text-gray-300">
                Este espaço é para dúvidas de conta, problemas técnicos, hinos, álbuns e playlists.
                Para questões de direitos autorais, use a página{' '}
                <Link to="/content-claim" className="text-primary-400 hover:text-primary-300 underline underline-offset-2">
                  Reivindicação de Conteúdo
                </Link>.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-900/40 bg-red-900/20 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px,minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-gray-800 bg-background-secondary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Seus chamados</p>
                  <p className="text-xs text-gray-500 mt-1">{threads.length} conversa(s)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedView(NEW_THREAD_VIEW)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-background-secondary overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
                <p className="text-sm font-semibold text-white">Inbox</p>
                <button
                  type="button"
                  onClick={() => void loadThreads()}
                  className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Atualizar
                </button>
              </div>

              <div className="max-h-[580px] overflow-y-auto">
                {loading ? (
                  <div className="px-4 py-10 text-center text-gray-400 text-sm">Carregando conversas...</div>
                ) : threads.length === 0 ? (
                  <div className="px-4 py-10 text-center text-gray-400 text-sm">
                    Você ainda não abriu nenhum chamado.
                  </div>
                ) : (
                  threads.map((thread) => {
                    const statusMeta = getStatusMeta(thread.status);
                    const active = thread.id === selectedView;

                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => setSelectedView(thread.id)}
                        className={`w-full text-left border-b border-gray-800 px-4 py-4 transition-colors ${
                          active ? 'bg-primary-500/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-white truncate">{thread.subjectLabel}</p>
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusMeta.className}`}>
                                {statusMeta.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-2 mt-2">
                              {thread.lastMessagePreview || thread.initialMessage}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">{formatDate(thread.lastMessageAt || thread.updatedAt)}</p>
                          </div>

                          {thread.hasUnreadForUser && (
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>

          <section>
            {selectedView === NEW_THREAD_VIEW ? (
              <div className="rounded-2xl border border-gray-800 bg-background-secondary p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-white">Novo chamado</h2>
                  <p className="text-gray-400 mt-2">
                    Escolha o assunto e descreva sua necessidade. Depois do envio, o chamado entra na fila e você acompanha a resposta neste chat.
                  </p>
                </div>

                <form onSubmit={handleCreateThread} className="space-y-5">
                  <div>
                    <label htmlFor="chat-subject" className="block text-sm font-medium text-gray-200 mb-2">
                      Assunto
                    </label>
                    <select
                      id="chat-subject"
                      value={subjectKey}
                      onChange={(event) => setSubjectKey(event.target.value as SupportSubjectKey)}
                      className="w-full rounded-2xl border border-gray-800 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {SUPPORT_SUBJECT_OPTIONS.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="chat-message" className="block text-sm font-medium text-gray-200 mb-2">
                      Sua mensagem
                    </label>
                    <textarea
                      id="chat-message"
                      rows={7}
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      placeholder="Explique com o máximo de contexto possível para acelerarmos o atendimento."
                      className="w-full rounded-2xl border border-gray-800 bg-black/30 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={creating || !draftMessage.trim()}
                      className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      {creating ? 'Abrindo chamado...' : 'Enviar e abrir chat'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <SupportThreadConversation
                thread={activeThread}
                currentUserId={user?.id || ''}
                currentUserName={profile?.nome || 'Usuário'}
                role="user"
                sending={sending}
                onSendMessage={handleSendMessage}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
