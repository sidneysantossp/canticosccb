import { getCurrentUser, publicSupabase } from './supabase-auth';

const SUPPORT_TABLE = 'notifications';
const DEFAULT_SUPPORT_COVER = 'https://canticosccb.com.br/logo-canticos-ccb.png';
const SUPPORT_NOTIFICATION_TYPE = 'support_chat';
const SUPPORT_LINK = '/chat';
const SUPPORT_THREAD_MARKER = 'support';
const supportClient = publicSupabase;

export const SUPPORT_SUBJECT_OPTIONS = [
  { key: 'conta-acesso', label: 'Conta e acesso' },
  { key: 'assinatura-pagamento', label: 'Assinatura e pagamento' },
  { key: 'hinos-albuns-playlists', label: 'Hinos, álbuns e playlists' },
  { key: 'problema-tecnico', label: 'Problema técnico' },
  { key: 'sugestao-melhoria', label: 'Sugestão e melhoria' },
  { key: 'outros', label: 'Outros assuntos' },
] as const;

export type SupportSubjectKey = (typeof SUPPORT_SUBJECT_OPTIONS)[number]['key'];
export type SupportThreadStatus = 'pending' | 'in_review' | 'resolved';
export type SupportSenderRole = 'admin' | 'user';

export interface SupportMessage {
  id: string;
  threadId: string;
  senderId: string | null;
  senderName: string;
  senderRole: SupportSenderRole;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface SupportThread {
  id: string;
  subjectKey: SupportSubjectKey;
  subjectLabel: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  initialMessage: string;
  status: SupportThreadStatus;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  hasUnreadForAdmin: boolean;
  hasUnreadForUser: boolean;
  coverUrl: string;
  messages: SupportMessage[];
  lastMessagePreview: string;
  waitingForAdmin: boolean;
  waitingForUser: boolean;
}

export interface CreateSupportThreadInput {
  subjectKey: SupportSubjectKey;
  requesterName: string;
  requesterEmail: string;
  message: string;
}

export interface SendSupportMessageInput {
  senderRole: SupportSenderRole;
  senderName: string;
  message: string;
}

export interface ListSupportThreadsOptions {
  userId?: string;
  userEmail?: string;
  includeResolved?: boolean;
}

export interface SupportInboxStats {
  total: number;
  unread: number;
  pending: number;
  inReview: number;
}

export interface SupportActorContext {
  userId?: string;
  isAdmin?: boolean;
}

interface SupportMeta {
  chat_kind: typeof SUPPORT_THREAD_MARKER;
  thread_id: string;
  subject_key: SupportSubjectKey;
  subject_label: string;
  sender_role: SupportSenderRole;
  sender_id: string | null;
  sender_name: string;
  requester_id: string;
  requester_name: string;
  requester_email: string;
  thread_status: SupportThreadStatus;
}

async function withTimeout<T>(promise: Promise<T>, message: string, timeoutMs = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

const SUPPORT_SUBJECT_MAP = new Map<string, string>(
  SUPPORT_SUBJECT_OPTIONS.map((option) => [option.key, option.label])
);

function getSupportSubjectLabel(subjectKey: string, fallback?: string) {
  return SUPPORT_SUBJECT_MAP.get(subjectKey) || fallback || 'Outros assuntos';
}

function normalizeSubjectKey(value: string | null | undefined): SupportSubjectKey {
  const normalized = String(value || '').trim().toLowerCase();
  if (SUPPORT_SUBJECT_MAP.has(normalized)) {
    return normalized as SupportSubjectKey;
  }
  return 'outros';
}

function normalizeStatus(value: unknown): SupportThreadStatus {
  if (value === 'in_review' || value === 'resolved') {
    return value;
  }
  return 'pending';
}

function buildSupportMeta(input: {
  threadId: string;
  subjectKey: SupportSubjectKey;
  senderRole: SupportSenderRole;
  senderId: string | null;
  senderName: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  status: SupportThreadStatus;
}): SupportMeta {
  return {
    chat_kind: SUPPORT_THREAD_MARKER,
    thread_id: input.threadId,
    subject_key: input.subjectKey,
    subject_label: getSupportSubjectLabel(input.subjectKey),
    sender_role: input.senderRole,
    sender_id: input.senderId,
    sender_name: input.senderName,
    requester_id: input.requesterId,
    requester_name: input.requesterName,
    requester_email: input.requesterEmail,
    thread_status: input.status,
  };
}

function extractSupportMeta(row: any): SupportMeta | null {
  const metadata = row?.metadata;
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  if (metadata.chat_kind !== SUPPORT_THREAD_MARKER || typeof metadata.thread_id !== 'string') {
    return null;
  }

  return {
    chat_kind: SUPPORT_THREAD_MARKER,
    thread_id: String(metadata.thread_id),
    subject_key: normalizeSubjectKey(metadata.subject_key),
    subject_label: getSupportSubjectLabel(metadata.subject_key, metadata.subject_label),
    sender_role: metadata.sender_role === 'admin' ? 'admin' : 'user',
    sender_id: metadata.sender_id ? String(metadata.sender_id) : null,
    sender_name: metadata.sender_name || 'Usuário',
    requester_id: String(metadata.requester_id || row.user_id || ''),
    requester_name: metadata.requester_name || 'Usuário',
    requester_email: metadata.requester_email || '',
    thread_status: normalizeStatus(metadata.thread_status),
  };
}

function isSupportRow(row: any) {
  return row?.type === SUPPORT_NOTIFICATION_TYPE && Boolean(extractSupportMeta(row));
}

function mapSupportMessage(row: any): SupportMessage {
  const meta = extractSupportMeta(row);
  if (!meta) {
    throw new Error('Mensagem de suporte inválida.');
  }

  return {
    id: String(row.id),
    threadId: meta.thread_id,
    senderId: meta.sender_id,
    senderName: meta.sender_name || (meta.sender_role === 'admin' ? 'Equipe Cânticos CCB' : 'Usuário'),
    senderRole: meta.sender_role,
    message: row.message || '',
    isRead: meta.sender_role === 'admin' ? Boolean(row.is_read) : Boolean(row.read),
    readAt: null,
    createdAt: row.created_at,
  };
}

function sortSupportRows(rows: any[]) {
  return [...rows].sort((left, right) => String(left.created_at).localeCompare(String(right.created_at)));
}

function mapSupportThread(rows: any[]): SupportThread {
  const orderedRows = sortSupportRows(rows);
  const firstRow = orderedRows[0];
  const lastRow = orderedRows[orderedRows.length - 1];
  const firstMeta = extractSupportMeta(firstRow);
  const lastMeta = extractSupportMeta(lastRow);

  if (!firstMeta || !lastMeta) {
    throw new Error('Thread de suporte inválida.');
  }

  const messages = orderedRows.map(mapSupportMessage);
  const lastMessage = messages[messages.length - 1];
  const status = lastMeta.thread_status;

  return {
    id: lastMeta.thread_id,
    subjectKey: lastMeta.subject_key,
    subjectLabel: lastMeta.subject_label,
    requesterId: lastMeta.requester_id,
    requesterName: lastMeta.requester_name,
    requesterEmail: lastMeta.requester_email,
    initialMessage: firstRow.message || '',
    status,
    createdAt: firstRow.created_at,
    updatedAt: lastRow.updated_at || lastRow.created_at,
    lastMessageAt: lastRow.created_at,
    hasUnreadForAdmin: orderedRows.some((row) => {
      const meta = extractSupportMeta(row);
      return meta?.sender_role === 'user' && !row.read;
    }),
    hasUnreadForUser: orderedRows.some((row) => {
      const meta = extractSupportMeta(row);
      return meta?.sender_role === 'admin' && !row.is_read;
    }),
    coverUrl: DEFAULT_SUPPORT_COVER,
    messages,
    lastMessagePreview: lastMessage?.message || firstRow.message || '',
    waitingForAdmin: status !== 'resolved' && Boolean(lastMessage) && lastMessage.senderRole === 'user',
    waitingForUser: status !== 'resolved' && Boolean(lastMessage) && lastMessage.senderRole === 'admin',
  };
}

function requireAuthenticatedUserId(actor?: SupportActorContext) {
  if (actor?.userId) {
    return String(actor.userId);
  }

  const cachedUser = getCurrentUser();
  if (cachedUser?.id) {
    return String(cachedUser.id);
  }

  throw new Error('Você precisa estar autenticado para usar o chat.');
}

function getCurrentActorContext(actor?: SupportActorContext) {
  const userId = requireAuthenticatedUserId(actor);

  if (typeof actor?.isAdmin === 'boolean') {
    return { userId, isAdmin: actor.isAdmin };
  }

  const cachedUser = getCurrentUser();
  if (cachedUser) {
    const isAdmin = cachedUser.is_admin === true || cachedUser.tipo === 'admin';
    return { userId, isAdmin };
  }

  return { userId, isAdmin: false };
}

async function fetchSupportRows(options: { userId?: string } = {}) {
  let query = supportClient
    .from(SUPPORT_TABLE)
    .select('*')
    .eq('type', SUPPORT_NOTIFICATION_TYPE)
    .order('created_at', { ascending: true });

  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }

  const { data, error } = await withTimeout(
    query,
    'Tempo limite ao carregar as conversas do chat.'
  );

  if (error) {
    throw error;
  }

  return (data || []).filter(isSupportRow);
}

async function getThreadRows(threadId: string, options: { userId?: string } = {}) {
  const rows = await fetchSupportRows(options);
  return rows.filter((row) => extractSupportMeta(row)?.thread_id === threadId);
}

function hydrateSupportThreads(rows: any[]): SupportThread[] {
  const grouped = new Map<string, any[]>();

  for (const row of rows) {
    const threadId = extractSupportMeta(row)?.thread_id;
    if (!threadId) continue;

    const list = grouped.get(threadId) || [];
    list.push(row);
    grouped.set(threadId, list);
  }

  return [...grouped.values()]
    .map((threadRows) => mapSupportThread(threadRows))
    .sort((left, right) => String(right.lastMessageAt || right.updatedAt).localeCompare(String(left.lastMessageAt || left.updatedAt)));
}

function buildStatusSystemMessage(status: SupportThreadStatus) {
  switch (status) {
    case 'in_review':
      return 'Seu chamado está em atendimento pela equipe.';
    case 'resolved':
      return 'Seu chamado foi marcado como resolvido.';
    case 'pending':
    default:
      return 'Seu chamado voltou para a fila de atendimento.';
  }
}

export async function listSupportThreads(options: ListSupportThreadsOptions = {}): Promise<SupportThread[]> {
  const rows = await fetchSupportRows(options.userId ? { userId: options.userId } : {});

  let threads = hydrateSupportThreads(rows);

  if (options.userEmail) {
    const email = options.userEmail.trim().toLowerCase();
    threads = threads.filter((thread) => thread.requesterEmail.trim().toLowerCase() === email);
  }

  if (!options.includeResolved) {
    threads = threads.filter((thread) => thread.status !== 'resolved');
  }

  return threads;
}

export async function getSupportThreadById(threadId: string, actorInput?: SupportActorContext): Promise<SupportThread | null> {
  const actor = getCurrentActorContext(actorInput);
  const rows = await getThreadRows(threadId, actor.isAdmin ? {} : { userId: actor.userId });

  if (rows.length === 0) {
    return null;
  }

  return mapSupportThread(rows);
}

export async function createSupportThread(input: CreateSupportThreadInput, actor?: SupportActorContext): Promise<SupportThread> {
  const userId = requireAuthenticatedUserId(actor);
  const now = new Date().toISOString();
  const subjectKey = normalizeSubjectKey(input.subjectKey);
  const threadId = crypto.randomUUID();
  const metadata = buildSupportMeta({
    threadId,
    subjectKey,
    senderRole: 'user',
    senderId: userId,
    senderName: input.requesterName,
    requesterId: userId,
    requesterName: input.requesterName,
    requesterEmail: input.requesterEmail,
    status: 'pending',
  });

  const { error } = await withTimeout(
    supportClient
      .from(SUPPORT_TABLE)
      .insert({
        user_id: userId,
        type: SUPPORT_NOTIFICATION_TYPE,
        title: metadata.subject_label,
        message: input.message.trim(),
        link: SUPPORT_LINK,
        icon: 'message-square',
        read: false,
        is_read: true,
        metadata,
        created_at: now,
        updated_at: now,
      }),
    'Tempo limite ao abrir o chamado.'
  );

  if (error) {
    throw error;
  }

  const thread = await getSupportThreadById(threadId, actor);

  if (!thread) {
    throw new Error('O chamado foi criado, mas não foi possível carregar a conversa.');
  }

  return thread;
}

export async function sendSupportMessage(
  threadId: string,
  input: SendSupportMessageInput,
  actor?: SupportActorContext
): Promise<SupportThread> {
  const userId = requireAuthenticatedUserId(actor);
  const now = new Date().toISOString();
  const currentThread = await getSupportThreadById(threadId, actor);

  if (!currentThread) {
    throw new Error('Chamado não encontrado.');
  }

  const nextStatus =
    input.senderRole === 'admin' && currentThread.status === 'pending'
      ? 'in_review'
      : currentThread.status;

  const metadata = buildSupportMeta({
    threadId,
    subjectKey: currentThread.subjectKey,
    senderRole: input.senderRole,
    senderId: userId,
    senderName: input.senderName,
    requesterId: currentThread.requesterId,
    requesterName: currentThread.requesterName,
    requesterEmail: currentThread.requesterEmail,
    status: nextStatus,
  });

  const { error } = await withTimeout(
    supportClient
      .from(SUPPORT_TABLE)
      .insert({
        user_id: currentThread.requesterId,
        type: SUPPORT_NOTIFICATION_TYPE,
        title: metadata.subject_label,
        message: input.message.trim(),
        link: SUPPORT_LINK,
        icon: 'message-square',
        read: input.senderRole === 'admin',
        is_read: input.senderRole === 'user',
        metadata,
        created_at: now,
        updated_at: now,
      }),
    'Tempo limite ao enviar a mensagem do chat.'
  );

  if (error) {
    throw error;
  }

  const thread = await getSupportThreadById(threadId, actor);

  if (!thread) {
    throw new Error('Não foi possível atualizar a conversa do chamado.');
  }

  return thread;
}

export async function markSupportThreadAsRead(
  threadId: string,
  role: SupportSenderRole,
  actorInput?: SupportActorContext
): Promise<SupportThread> {
  const actor = getCurrentActorContext(actorInput);
  const now = new Date().toISOString();
  const rows = await getThreadRows(threadId, actor.isAdmin ? {} : { userId: actor.userId });

  if (rows.length === 0) {
    throw new Error('Chamado não encontrado.');
  }

  const unreadIds = rows
    .filter((row) => {
      const meta = extractSupportMeta(row);
      if (!meta) return false;

      if (role === 'admin') {
        return meta.sender_role === 'user' && !row.read;
      }

      return meta.sender_role === 'admin' && !row.is_read;
    })
    .map((row) => String(row.id));

  if (unreadIds.length > 0) {
    const { error } = await withTimeout(
      supportClient
        .from(SUPPORT_TABLE)
        .update(role === 'admin' ? { read: true, updated_at: now } : { is_read: true, updated_at: now })
        .in('id', unreadIds),
      'Tempo limite ao atualizar a leitura do chat.'
    );

    if (error) {
      throw error;
    }
  }

  const thread = await getSupportThreadById(threadId, actorInput);

  if (!thread) {
    throw new Error('Não foi possível atualizar a leitura do chamado.');
  }

  return thread;
}

export async function updateSupportThreadStatus(
  threadId: string,
  status: SupportThreadStatus,
  actorInput?: SupportActorContext
): Promise<SupportThread> {
  const actor = getCurrentActorContext(actorInput);
  const currentThread = await getSupportThreadById(threadId, actorInput);

  if (!currentThread) {
    throw new Error('Chamado não encontrado.');
  }

  const now = new Date().toISOString();
  const metadata = buildSupportMeta({
    threadId,
    subjectKey: currentThread.subjectKey,
    senderRole: 'admin',
    senderId: actor.userId,
    senderName: 'Equipe Cânticos CCB',
    requesterId: currentThread.requesterId,
    requesterName: currentThread.requesterName,
    requesterEmail: currentThread.requesterEmail,
    status,
  });

  const { error } = await withTimeout(
    supportClient
      .from(SUPPORT_TABLE)
      .insert({
        user_id: currentThread.requesterId,
        type: SUPPORT_NOTIFICATION_TYPE,
        title: metadata.subject_label,
        message: buildStatusSystemMessage(status),
        link: SUPPORT_LINK,
        icon: 'message-square',
        read: true,
        is_read: false,
        metadata,
        created_at: now,
        updated_at: now,
      }),
    'Tempo limite ao atualizar o status do chat.'
  );

  if (error) {
    throw error;
  }

  const thread = await getSupportThreadById(threadId, actorInput);

  if (!thread) {
    throw new Error('Não foi possível atualizar o status do chamado.');
  }

  return thread;
}

export async function getSupportInboxStats(options: { userId?: string; role: SupportSenderRole }): Promise<SupportInboxStats> {
  const threads = await listSupportThreads({
    userId: options.role === 'user' ? options.userId : undefined,
    includeResolved: true,
  });

  return {
    total: threads.length,
    unread: threads.filter((thread) => (options.role === 'admin' ? thread.hasUnreadForAdmin : thread.hasUnreadForUser)).length,
    pending: threads.filter((thread) => thread.status === 'pending').length,
    inReview: threads.filter((thread) => thread.status === 'in_review').length,
  };
}

export function subscribeToSupportInbox(options: {
  userId?: string;
  onChange: () => void;
}) {
  const channelName = `support-chat-${options.userId || 'admin'}-${Date.now()}`;
  const channel = supportClient
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: SUPPORT_TABLE,
        ...(options.userId ? { filter: `user_id=eq.${options.userId}` } : {}),
      },
      (payload) => {
        const row = payload.new || payload.old;
        if (isSupportRow(row)) {
          options.onChange();
        }
      }
    )
    .subscribe();

    return {
      unsubscribe: () => {
      supportClient.removeChannel(channel);
    },
  };
}
