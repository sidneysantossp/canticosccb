import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Clock3, MessageSquare, Send } from 'lucide-react';
import type { SupportMessage, SupportSenderRole, SupportThread, SupportThreadStatus } from '@/lib/supportChatApi';

interface SupportThreadConversationProps {
  thread: SupportThread | null;
  currentUserId: string;
  currentUserName: string;
  role: SupportSenderRole;
  sending: boolean;
  updatingStatus?: boolean;
  onSendMessage: (threadId: string, message: string) => Promise<void>;
  onUpdateStatus?: (threadId: string, status: SupportThreadStatus) => Promise<void>;
}

function getStatusMeta(status: SupportThreadStatus) {
  switch (status) {
    case 'pending':
      return {
        label: 'Aguardando atendimento',
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

function formatRelativeTimestamp(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const sameDay = now.toDateString() === date.toDateString();
  return sameDay
    ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function isOwnMessage(message: SupportMessage, role: SupportSenderRole, currentUserId: string) {
  if (role === 'admin') {
    return message.senderRole === 'admin';
  }
  return message.senderRole === 'user' && (message.senderId === currentUserId || !message.senderId);
}

const SupportThreadConversation: React.FC<SupportThreadConversationProps> = ({
  thread,
  currentUserId,
  currentUserName,
  role,
  sending,
  updatingStatus = false,
  onSendMessage,
  onUpdateStatus,
}) => {
  const [draft, setDraft] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const previousThreadIdRef = useRef<string | null>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !thread) return;

    const behavior: ScrollBehavior = previousThreadIdRef.current === thread.id ? 'smooth' : 'auto';
    const frame = window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    });

    previousThreadIdRef.current = thread.id;
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [thread?.id, thread?.messages.length]);

  useEffect(() => {
    setDraft('');
  }, [thread?.id]);

  const statusMeta = useMemo(
    () => (thread ? getStatusMeta(thread.status) : null),
    [thread?.status]
  );

  const waitingMessage = useMemo(() => {
    if (!thread) return '';
    if (thread.status === 'resolved') {
      return 'Este chamado foi marcado como resolvido. Se necessário, abra um novo chamado.';
    }
    if (thread.status === 'archived') {
      return 'Este chamado foi arquivado pela equipe.';
    }
    if (role === 'user' && thread.waitingForAdmin) {
      return 'Sua mensagem foi enviada. Aguarde a resposta da equipe para continuar.';
    }
    return '';
  }, [thread, role]);

  const canSendMessage = Boolean(
    thread &&
    thread.status !== 'resolved' &&
    thread.status !== 'archived' &&
    (role === 'admin' || !thread.waitingForAdmin)
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!thread || !draft.trim() || !canSendMessage || sending) return;

    await onSendMessage(thread.id, draft.trim());
    setDraft('');
  };

  if (!thread) {
    return (
      <div className="bg-background-secondary border border-gray-800 rounded-2xl p-8 text-center min-h-[540px] flex items-center justify-center">
        <div>
          <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Selecione um chamado</h2>
          <p className="text-gray-400">Abra uma conversa para visualizar as mensagens em tempo real.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-secondary border border-gray-800 rounded-2xl overflow-hidden min-h-[540px] flex flex-col">
      <div className="border-b border-gray-800 px-5 py-4 bg-background-tertiary/70">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold text-white">{thread.subjectLabel}</h2>
              {statusMeta && (
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.className}`}>
                  {statusMeta.label}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {role === 'admin'
                ? `${thread.requesterName} • ${thread.requesterEmail || 'sem e-mail'}`
                : 'Canal direto com a equipe do Cânticos CCB'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Última atualização: {formatRelativeTimestamp(thread.lastMessageAt || thread.updatedAt)}
            </p>
          </div>

          {role === 'admin' && onUpdateStatus && (
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <span>Status</span>
              <select
                value={thread.status}
                onChange={(event) => void onUpdateStatus(thread.id, event.target.value as SupportThreadStatus)}
                disabled={updatingStatus}
                className="px-3 py-2 rounded-lg bg-black/30 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="pending">Aguardando atendimento</option>
                <option value="in_review">Em atendimento</option>
                <option value="resolved">Resolvido</option>
              </select>
            </label>
          )}
        </div>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {thread.messages.length === 0 ? (
          <div className="h-full min-h-[280px] flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Nenhuma mensagem nesta conversa.</p>
            </div>
          </div>
        ) : (
          thread.messages.map((message) => {
            const own = isOwnMessage(message, role, currentUserId);

            return (
              <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${own ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!own && (
                    <span className="text-xs text-gray-500 mb-1 px-1">
                      {message.senderRole === 'admin' ? 'Equipe Cânticos CCB' : message.senderName}
                    </span>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      own ? 'bg-primary-600 text-white' : 'bg-black/25 text-gray-100 border border-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                  </div>

                  <div className="flex items-center gap-1 mt-1 px-1 text-xs text-gray-500">
                    <span>{formatRelativeTimestamp(message.createdAt)}</span>
                    {own && message.isRead && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-gray-800 px-5 py-4 bg-background-tertiary/40">
        {waitingMessage && (
          <div className="mb-3 rounded-xl border border-gray-800 bg-black/25 px-4 py-3 text-sm text-gray-300 flex items-start gap-2">
            <Clock3 className="w-4 h-4 mt-0.5 text-primary-400 flex-shrink-0" />
            <span>{waitingMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              canSendMessage
                ? role === 'admin'
                  ? `Responder como ${currentUserName}...`
                  : 'Digite sua mensagem...'
                : 'Envio indisponível neste momento.'
            }
            rows={4}
            disabled={!canSendMessage || sending}
            className="w-full rounded-2xl border border-gray-800 bg-black/30 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!draft.trim() || !canSendMessage || sending}
              className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Enviando...' : 'Enviar mensagem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupportThreadConversation;
