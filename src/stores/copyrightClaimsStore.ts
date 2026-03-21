import { create } from 'zustand';
import {
  createCopyrightClaim,
  getCopyrightClaimById,
  listCopyrightClaims,
  markCopyrightClaimMessagesAsRead,
  sendCopyrightClaimMessage,
  updateCopyrightClaimStatus,
  uploadClaimAttachment,
  type ChatMessage,
  type ClaimAttachment,
  type ClaimSenderRole,
  type CopyrightClaim,
  type CreateCopyrightClaimInput,
  type LoadCopyrightClaimsOptions,
} from '@/lib/copyrightClaimsApi';

export type { ChatMessage, ClaimAttachment, CopyrightClaim } from '@/lib/copyrightClaimsApi';

interface CopyrightClaimsState {
  claims: CopyrightClaim[];
  isLoading: boolean;
  error: string | null;
  createClaim: (claim: CreateCopyrightClaimInput) => Promise<CopyrightClaim>;
  updateClaimStatus: (
    claimId: string,
    status: CopyrightClaim['status'],
    reviewerNotes?: string,
    reviewer?: { id?: string; name?: string }
  ) => Promise<CopyrightClaim>;
  sendMessage: (claimId: string, message: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>) => Promise<CopyrightClaim>;
  markMessagesAsRead: (claimId: string, userId: string, userRole?: ClaimSenderRole) => Promise<CopyrightClaim | undefined>;
  uploadAttachment: (claimId: string, messageId: string, file: File) => Promise<ClaimAttachment>;
  getClaimById: (claimId: string) => CopyrightClaim | undefined;
  getClaimsBySong: (songId: number) => CopyrightClaim[];
  getClaimsByComposer: (composerId: string) => CopyrightClaim[];
  getPendingClaimsCount: () => number;
  loadClaims: (options?: LoadCopyrightClaimsOptions) => Promise<void>;
}

function toFriendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro ao processar reivindicações';
  if (
    /copyright_claims|copyright_claim_messages|copyright_claim_attachments|copyright_chat_attachments/i.test(message) &&
    /(does not exist|Could not find the table|42P01)/i.test(message)
  ) {
    return 'O backend de direitos autorais ainda não foi criado no banco. Execute a migration CREATE_COPYRIGHT_CLAIMS_MODULE.sql no Supabase.';
  }
  return message;
}

function upsertClaim(stateClaims: CopyrightClaim[], claim: CopyrightClaim) {
  const nextClaims = stateClaims.filter((item) => item.id !== claim.id);
  nextClaims.unshift(claim);
  return nextClaims.sort((a, b) => {
    const left = a.updatedAt || a.createdAt;
    const right = b.updatedAt || b.createdAt;
    return right.localeCompare(left);
  });
}

const useCopyrightClaimsStore = create<CopyrightClaimsState>((set, get) => ({
  claims: [],
  isLoading: false,
  error: null,

  createClaim: async (claimData) => {
    set({ isLoading: true, error: null });
    try {
      const claim = await createCopyrightClaim(claimData);
      set((state) => ({
        claims: upsertClaim(state.claims, claim),
        isLoading: false,
        error: null,
      }));
      return claim;
    } catch (error) {
      const friendlyError = toFriendlyError(error);
      set({ isLoading: false, error: friendlyError });
      throw new Error(friendlyError);
    }
  },

  updateClaimStatus: async (claimId, status, reviewerNotes, reviewer) => {
    set({ isLoading: true, error: null });
    try {
      const claim = await updateCopyrightClaimStatus(claimId, {
        status,
        reviewerNotes,
        reviewerId: reviewer?.id,
        reviewerName: reviewer?.name,
      });
      set((state) => ({
        claims: upsertClaim(state.claims, claim),
        isLoading: false,
        error: null,
      }));
      return claim;
    } catch (error) {
      const friendlyError = toFriendlyError(error);
      set({ isLoading: false, error: friendlyError });
      throw new Error(friendlyError);
    }
  },

  sendMessage: async (claimId, messageData) => {
    try {
      const claim = await sendCopyrightClaimMessage(claimId, {
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        senderRole: messageData.senderRole,
        message: messageData.message,
        attachments: messageData.attachments,
      });
      set((state) => ({
        claims: upsertClaim(state.claims, claim),
        error: null,
      }));
      return claim;
    } catch (error) {
      const friendlyError = toFriendlyError(error);
      set({ error: friendlyError });
      throw new Error(friendlyError);
    }
  },

  markMessagesAsRead: async (claimId, userId, userRole) => {
    if (!userRole) return undefined;
    try {
      const claim = await markCopyrightClaimMessagesAsRead(claimId, userId, userRole);
      set((state) => ({
        claims: upsertClaim(state.claims, claim),
        error: null,
      }));
      return claim;
    } catch (error) {
      const friendlyError = toFriendlyError(error);
      set({ error: friendlyError });
      throw new Error(friendlyError);
    }
  },

  uploadAttachment: async (claimId, _messageId, file) => {
    try {
      return await uploadClaimAttachment(claimId, file);
    } catch (error) {
      const friendlyError = toFriendlyError(error);
      set({ error: friendlyError });
      throw new Error(friendlyError);
    }
  },

  getClaimById: (claimId) => get().claims.find((claim) => claim.id === claimId),

  getClaimsBySong: (songId) => get().claims.filter((claim) => claim.songId === songId),

  getClaimsByComposer: (composerId) => get().claims.filter((claim) => claim.composerId === composerId),

  getPendingClaimsCount: () => get().claims.filter((claim) => claim.status === 'pending').length,

  loadClaims: async (options = {}) => {
    set({ isLoading: true, error: null });
    try {
      const claims = await listCopyrightClaims(options);
      set({
        claims,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        claims: [],
        isLoading: false,
        error: toFriendlyError(error),
      });
    }
  },
}));

export default useCopyrightClaimsStore;
