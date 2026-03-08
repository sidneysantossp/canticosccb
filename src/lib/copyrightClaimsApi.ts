import { supabase } from './supabase-auth';
import { getSupabaseStorageUrl, supabaseUploadFile } from './supabaseRest';

export type ClaimAttachmentType = 'image' | 'video' | 'pdf' | 'audio';
export type ClaimSenderRole = 'admin' | 'composer';
export type ClaimType = 'composer' | 'author' | 'both';
export type ClaimStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'resolved';
export type ClaimPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ClaimAttachment {
  id: string;
  type: ClaimAttachmentType;
  url: string;
  name: string;
  size: number;
  mimeType?: string;
}

export interface ChatMessage {
  id: string;
  claimId: string;
  senderId: string;
  senderName: string;
  senderRole: ClaimSenderRole;
  message: string;
  attachments?: ClaimAttachment[];
  timestamp: string;
  read: boolean;
}

export interface CopyrightClaim {
  id: string;
  songId: number;
  songTitle: string;
  songArtist: string;
  songCoverUrl: string;
  contentUrl?: string;
  composerId: string;
  composerName: string;
  composerEmail: string;
  claimType: ClaimType;
  description: string;
  proofDocuments?: ClaimAttachment[];
  status: ClaimStatus;
  priority: ClaimPriority;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  resolvedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
  chatMessages: ChatMessage[];
  hasUnreadForAdmin: boolean;
  hasUnreadForComposer: boolean;
  hasUnreadMessages: boolean;
  lastMessageAt?: string;
  createdByUserId?: string;
}

export interface CreateCopyrightClaimInput {
  songId?: number | null;
  songTitle: string;
  songArtist?: string;
  songCoverUrl?: string;
  contentUrl?: string;
  composerId?: string | null;
  composerName: string;
  composerEmail: string;
  claimType: ClaimType;
  description: string;
  proofDocuments?: File[];
  priority?: ClaimPriority;
}

export interface SendCopyrightClaimMessageInput {
  senderId: string;
  senderName: string;
  senderRole: ClaimSenderRole;
  message: string;
  attachments?: ClaimAttachment[];
}

export interface UpdateClaimStatusInput {
  status: ClaimStatus;
  reviewerNotes?: string;
  reviewerId?: string;
  reviewerName?: string;
}

export interface LoadCopyrightClaimsOptions {
  composerId?: string | null;
}

const CLAIMS_TABLE = 'copyright_claims';
const MESSAGES_TABLE = 'copyright_claim_messages';
const ATTACHMENTS_TABLE = 'copyright_claim_attachments';
const STORAGE_BUCKET = 'documents';
const SYSTEM_SENDER_NAME = 'Equipe Cânticos CCB';

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_');
}

function getAttachmentType(mimeType: string): ClaimAttachmentType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'pdf';
}

function toClaimAttachment(raw: any): ClaimAttachment {
  return {
    id: String(raw.id || raw.file_id || `attachment_${Date.now()}`),
    type: raw.type || raw.file_type || getAttachmentType(raw.mimeType || raw.mime_type || ''),
    url: raw.url || raw.file_url || '',
    name: raw.name || raw.file_name || 'Arquivo',
    size: Number(raw.size || raw.size_bytes || 0),
    mimeType: raw.mimeType || raw.mime_type || undefined,
  };
}

function mapClaimMessage(row: any, attachmentsByMessageId: Map<string, ClaimAttachment[]>): ChatMessage {
  const id = String(row.id);
  return {
    id,
    claimId: String(row.claim_id),
    senderId: String(row.sender_user_id || 'system'),
    senderName: row.sender_name || SYSTEM_SENDER_NAME,
    senderRole: row.sender_role === 'admin' ? 'admin' : 'composer',
    message: row.message || '',
    attachments: attachmentsByMessageId.get(id) || [],
    timestamp: row.created_at,
    read: Boolean(row.is_read),
  };
}

function mapClaim(row: any, messagesByClaimId: Map<string, ChatMessage[]>): CopyrightClaim {
  const proofDocuments = Array.isArray(row.proof_documents)
    ? row.proof_documents.map(toClaimAttachment)
    : [];
  const chatMessages = messagesByClaimId.get(String(row.id)) || [];

  return {
    id: String(row.id),
    songId: Number(row.song_id || 0),
    songTitle: row.song_title || 'Conteúdo sem título',
    songArtist: row.song_artist || '',
    songCoverUrl: row.song_cover_url || 'https://canticosccb.com.br/logo-canticos-ccb.png',
    contentUrl: row.content_url || undefined,
    composerId: row.composer_id ? String(row.composer_id) : '',
    composerName: row.composer_name || 'Solicitante',
    composerEmail: row.composer_email || '',
    claimType: row.claim_type || 'composer',
    description: row.description || '',
    proofDocuments,
    status: row.status || 'pending',
    priority: row.priority || 'medium',
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    reviewedAt: row.reviewed_at || undefined,
    resolvedAt: row.resolved_at || undefined,
    reviewedBy: row.reviewed_by_user_id || undefined,
    reviewerNotes: row.reviewer_notes || undefined,
    chatMessages,
    hasUnreadForAdmin: Boolean(row.has_unread_for_admin),
    hasUnreadForComposer: Boolean(row.has_unread_for_composer),
    hasUnreadMessages: Boolean(row.has_unread_for_admin || row.has_unread_for_composer),
    lastMessageAt: row.last_message_at || undefined,
    createdByUserId: row.created_by_user_id || undefined,
  };
}

async function requireAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('Você precisa estar autenticado para continuar.');
  }
  return data.user.id;
}

async function hydrateClaims(rows: any[]): Promise<CopyrightClaim[]> {
  if (rows.length === 0) return [];

  const claimIds = rows.map((row) => String(row.id));

  const [{ data: messageRows, error: messagesError }, { data: attachmentRows, error: attachmentsError }] = await Promise.all([
    supabase
      .from(MESSAGES_TABLE)
      .select('*')
      .in('claim_id', claimIds)
      .order('created_at', { ascending: true }),
    supabase
      .from(ATTACHMENTS_TABLE)
      .select('*')
      .in('claim_id', claimIds)
      .order('created_at', { ascending: true }),
  ]);

  if (messagesError) {
    throw messagesError;
  }

  if (attachmentsError) {
    throw attachmentsError;
  }

  const attachmentsByMessageId = new Map<string, ClaimAttachment[]>();
  for (const row of attachmentRows || []) {
    const messageId = row.message_id ? String(row.message_id) : '';
    const list = attachmentsByMessageId.get(messageId) || [];
    list.push(toClaimAttachment(row));
    attachmentsByMessageId.set(messageId, list);
  }

  const messagesByClaimId = new Map<string, ChatMessage[]>();
  for (const row of messageRows || []) {
    const claimId = String(row.claim_id);
    const list = messagesByClaimId.get(claimId) || [];
    list.push(mapClaimMessage(row, attachmentsByMessageId));
    messagesByClaimId.set(claimId, list);
  }

  return rows.map((row) => mapClaim(row, messagesByClaimId));
}

export async function listCopyrightClaims(options: LoadCopyrightClaimsOptions = {}): Promise<CopyrightClaim[]> {
  let query = supabase
    .from(CLAIMS_TABLE)
    .select('*')
    .order('updated_at', { ascending: false });

  if (options.composerId) {
    query = query.eq('composer_id', options.composerId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return hydrateClaims(data || []);
}

export async function getCopyrightClaimById(claimId: string): Promise<CopyrightClaim | null> {
  const { data, error } = await supabase
    .from(CLAIMS_TABLE)
    .select('*')
    .eq('id', claimId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;

  const [claim] = await hydrateClaims([data]);
  return claim || null;
}

async function uploadFilesForClaim(claimId: string, area: 'proofs' | 'messages', files: File[]): Promise<ClaimAttachment[]> {
  if (files.length === 0) return [];

  const uploaded = await Promise.all(
    files.map(async (file, index) => {
      const fileName = sanitizeFileName(file.name);
      const path = `copyright-claims/${claimId}/${area}/${Date.now()}_${index}_${fileName}`;
      const uploadedPath = await supabaseUploadFile(STORAGE_BUCKET, path, file);

      if (!uploadedPath) {
        throw new Error(`Falha ao enviar o arquivo "${file.name}".`);
      }

      return {
        id: `${claimId}_${area}_${index}_${Date.now()}`,
        type: getAttachmentType(file.type),
        url: getSupabaseStorageUrl(STORAGE_BUCKET, uploadedPath),
        name: file.name,
        size: file.size,
        mimeType: file.type,
      } satisfies ClaimAttachment;
    })
  );

  return uploaded;
}

export async function uploadClaimAttachment(claimId: string, file: File): Promise<ClaimAttachment> {
  const [attachment] = await uploadFilesForClaim(claimId, 'messages', [file]);
  return attachment;
}

export async function createCopyrightClaim(input: CreateCopyrightClaimInput): Promise<CopyrightClaim> {
  const userId = await requireAuthenticatedUserId();
  const now = new Date().toISOString();

  const { data: insertedClaim, error: insertError } = await supabase
    .from(CLAIMS_TABLE)
    .insert({
      song_id: input.songId || null,
      song_title: input.songTitle,
      song_artist: input.songArtist || '',
      song_cover_url: input.songCoverUrl || 'https://canticosccb.com.br/logo-canticos-ccb.png',
      content_url: input.contentUrl || null,
      composer_id: input.composerId || null,
      composer_name: input.composerName,
      composer_email: input.composerEmail,
      claim_type: input.claimType,
      description: input.description,
      priority: input.priority || 'medium',
      status: 'pending',
      created_by_user_id: userId,
      proof_documents: [],
      has_unread_for_admin: true,
      has_unread_for_composer: false,
      last_message_at: now,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (insertError) {
    throw insertError;
  }

  const proofDocuments = await uploadFilesForClaim(String(insertedClaim.id), 'proofs', input.proofDocuments || []);

  if (proofDocuments.length > 0) {
    const { error: proofError } = await supabase
      .from(CLAIMS_TABLE)
      .update({
        proof_documents: proofDocuments,
        updated_at: new Date().toISOString(),
      })
      .eq('id', insertedClaim.id);

    if (proofError) {
      throw proofError;
    }
  }

  const { error: autoMessageError } = await supabase
    .from(MESSAGES_TABLE)
    .insert({
      claim_id: insertedClaim.id,
      sender_user_id: null,
      sender_name: SYSTEM_SENDER_NAME,
      sender_role: 'admin',
      message: 'Recebemos sua solicitação. Em breve nossa equipe entrará em contato para os devidos esclarecimentos.',
      is_read: true,
      created_at: now,
      updated_at: now,
    });

  if (autoMessageError) {
    throw autoMessageError;
  }

  const claim = await getCopyrightClaimById(String(insertedClaim.id));

  if (!claim) {
    throw new Error('Não foi possível carregar a reivindicação recém-criada.');
  }

  return claim;
}

export async function sendCopyrightClaimMessage(claimId: string, input: SendCopyrightClaimMessageInput): Promise<CopyrightClaim> {
  const userId = await requireAuthenticatedUserId();
  const now = new Date().toISOString();

  const { data: insertedMessage, error: messageError } = await supabase
    .from(MESSAGES_TABLE)
    .insert({
      claim_id: claimId,
      sender_user_id: userId,
      sender_name: input.senderName,
      sender_role: input.senderRole,
      message: input.message,
      is_read: false,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (messageError) {
    throw messageError;
  }

  if (input.attachments && input.attachments.length > 0) {
    const rows = input.attachments.map((attachment) => ({
      claim_id: claimId,
      message_id: insertedMessage.id,
      file_name: attachment.name,
      file_url: attachment.url,
      file_type: attachment.type,
      mime_type: attachment.mimeType || null,
      size_bytes: attachment.size,
      created_by_user_id: userId,
      created_at: now,
      updated_at: now,
    }));

    const { error: attachmentsError } = await supabase
      .from(ATTACHMENTS_TABLE)
      .insert(rows);

    if (attachmentsError) {
      throw attachmentsError;
    }
  }

  const unreadFlags = input.senderRole === 'admin'
    ? { has_unread_for_composer: true }
    : { has_unread_for_admin: true };

  const { error: claimUpdateError } = await supabase
    .from(CLAIMS_TABLE)
    .update({
      ...unreadFlags,
      last_message_at: now,
      updated_at: now,
    })
    .eq('id', claimId);

  if (claimUpdateError) {
    throw claimUpdateError;
  }

  const claim = await getCopyrightClaimById(claimId);

  if (!claim) {
    throw new Error('Não foi possível atualizar a conversa da reivindicação.');
  }

  return claim;
}

export async function markCopyrightClaimMessagesAsRead(
  claimId: string,
  userId: string,
  userRole: ClaimSenderRole
): Promise<CopyrightClaim> {
  const now = new Date().toISOString();

  const { error: messagesError } = await supabase
    .from(MESSAGES_TABLE)
    .update({
      is_read: true,
      updated_at: now,
      read_at: now,
    })
    .eq('claim_id', claimId)
    .eq('is_read', false)
    .neq('sender_user_id', userId);

  if (messagesError) {
    throw messagesError;
  }

  const clearFlags = userRole === 'admin'
    ? { has_unread_for_admin: false }
    : { has_unread_for_composer: false };

  const { error: claimError } = await supabase
    .from(CLAIMS_TABLE)
    .update({
      ...clearFlags,
      updated_at: now,
    })
    .eq('id', claimId);

  if (claimError) {
    throw claimError;
  }

  const claim = await getCopyrightClaimById(claimId);

  if (!claim) {
    throw new Error('Não foi possível atualizar a leitura das mensagens.');
  }

  return claim;
}

function buildStatusMessage(status: ClaimStatus, reviewerNotes?: string) {
  const labelMap: Record<ClaimStatus, string> = {
    pending: 'Sua reivindicação voltou para o status pendente.',
    in_review: 'Sua reivindicação está em análise pela equipe.',
    approved: 'Sua reivindicação foi aprovada.',
    rejected: 'Sua reivindicação foi rejeitada.',
    resolved: 'Sua reivindicação foi resolvida.',
  };

  if (!reviewerNotes?.trim()) {
    return labelMap[status];
  }

  return `${labelMap[status]}\n\nObservações da equipe:\n${reviewerNotes.trim()}`;
}

export async function updateCopyrightClaimStatus(
  claimId: string,
  input: UpdateClaimStatusInput
): Promise<CopyrightClaim> {
  const reviewerId = input.reviewerId || await requireAuthenticatedUserId();
  const now = new Date().toISOString();

  const { error: claimError } = await supabase
    .from(CLAIMS_TABLE)
    .update({
      status: input.status,
      reviewer_notes: input.reviewerNotes || null,
      reviewed_at: now,
      reviewed_by_user_id: reviewerId,
      resolved_at: input.status === 'resolved' ? now : null,
      has_unread_for_composer: true,
      last_message_at: now,
      updated_at: now,
    })
    .eq('id', claimId);

  if (claimError) {
    throw claimError;
  }

  const { error: messageError } = await supabase
    .from(MESSAGES_TABLE)
    .insert({
      claim_id: claimId,
      sender_user_id: reviewerId,
      sender_name: input.reviewerName || SYSTEM_SENDER_NAME,
      sender_role: 'admin',
      message: buildStatusMessage(input.status, input.reviewerNotes),
      is_read: false,
      created_at: now,
      updated_at: now,
    });

  if (messageError) {
    throw messageError;
  }

  const claim = await getCopyrightClaimById(claimId);

  if (!claim) {
    throw new Error('Não foi possível carregar a reivindicação após a atualização.');
  }

  return claim;
}
