import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// import { sendTemplateEmail } from '@/lib/admin/emailAdminApi';

export interface ChatMessage {
  id: string;
  claimId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'composer';
  message: string;
  attachments?: {
    id: string;
    type: 'image' | 'video' | 'pdf' | 'audio';
    url: string;
    name: string;
    size: number;
  }[];
  timestamp: string;
  read: boolean;
}

export interface CopyrightClaim {
  id: string;
  songId: number;
  songTitle: string;
  songArtist: string;
  songCoverUrl: string;
  composerId: string;
  composerName: string;
  composerEmail: string;
  
  // Formulário de reivindicação
  claimType: 'composer' | 'author' | 'both';
  description: string;
  proofDocuments?: string[];
  
  // Status e flags
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Datas
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  resolvedAt?: string;
  
  // Admin
  reviewedBy?: string;
  reviewerNotes?: string;
  
  // Chat
  chatMessages: ChatMessage[];
  // unread por papel
  hasUnreadForAdmin: boolean;
  hasUnreadForComposer: boolean;
  lastMessageAt?: string;
}

interface CopyrightClaimsState {
  claims: CopyrightClaim[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createClaim: (claim: Omit<CopyrightClaim, 'id' | 'createdAt' | 'updatedAt' | 'chatMessages' | 'hasUnreadMessages' | 'status'>) => CopyrightClaim;
  updateClaimStatus: (claimId: string, status: CopyrightClaim['status'], reviewerNotes?: string) => void;
  sendMessage: (claimId: string, message: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>) => void;
  markMessagesAsRead: (claimId: string, userId: string, userRole?: 'admin' | 'composer') => void;
  uploadAttachment: (claimId: string, messageId: string, file: File) => Promise<string>;
  getClaimById: (claimId: string) => CopyrightClaim | undefined;
  getClaimsBySong: (songId: number) => CopyrightClaim[];
  getClaimsByComposer: (composerId: string) => CopyrightClaim[];
  getPendingClaimsCount: () => number;
  loadClaims: () => Promise<void>;
}

const useCopyrightClaimsStore = create<CopyrightClaimsState>()(
  persist(
    (set, get) => ({
      claims: [],
      isLoading: false,
      error: null,

      createClaim: (claimData) => {
        const now = new Date().toISOString();
        const newClaim: CopyrightClaim = {
          ...claimData,
          id: `claim_${Date.now()}`,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
          chatMessages: [],
          hasUnreadForAdmin: true,
          hasUnreadForComposer: false
        };

        // Mensagem automática de recebimento para o compositor (marcada como lida para ele)
        const autoMsg: ChatMessage = {
          id: `msg_${Date.now()}_auto`,
          claimId: newClaim.id,
          senderId: 'system',
          senderName: 'Equipe Cânticos CCB',
          senderRole: 'admin',
          message: 'Recebemos sua solicitação. Em breve nossa equipe entrará em contato para os devidos esclarecimentos.',
          timestamp: now,
          read: true
        };
        newClaim.chatMessages = [autoMsg];
        newClaim.lastMessageAt = now;

        set((state) => ({
          claims: [newClaim, ...state.claims]
        }));

        // Notificação por email (best-effort): aviso ao compositor e alerta ao admin
        // (async () => {
        //   try {
        //     if (newClaim.composerEmail) {
        //       await sendTemplateEmail('claim-received', newClaim.composerEmail, {
        //         composer_name: newClaim.composerName || 'Usuário',
        //         claim_id: newClaim.id
        //       });
        //     }
        //     // TODO: substituir por email(s) de admin via settings ou role
        //     const adminFallback = 'admin@canticosccb.com.br';
        //     await sendTemplateEmail('claim-new', adminFallback, {
        //       claim_id: newClaim.id,
        //       composer_name: newClaim.composerName || 'Usuário',
        //       composer_email: newClaim.composerEmail || ''
        //     });
        //   } catch (e) {
        //     console.warn('Email notification (claim create) failed:', e);
        //   }
        // })();

        return newClaim;
      },

      updateClaimStatus: (claimId, status, reviewerNotes) => {
        const now = new Date().toISOString();
        
        set((state) => ({
          claims: state.claims.map((claim) =>
            claim.id === claimId
              ? {
                  ...claim,
                  status,
                  reviewerNotes,
                  updatedAt: now,
                  reviewedAt: now,
                  resolvedAt: status === 'resolved' ? now : claim.resolvedAt
                }
              : claim
          )
        }));
      },

      sendMessage: (claimId, messageData) => {
        const now = new Date().toISOString();
        const newMessage: ChatMessage = {
          ...messageData,
          id: `msg_${Date.now()}`,
          timestamp: now,
          read: false,
          claimId
        };

        set((state) => ({
          claims: state.claims.map((claim) =>
            claim.id === claimId
              ? {
                  ...claim,
                  chatMessages: [...claim.chatMessages, newMessage],
                  hasUnreadForAdmin: messageData.senderRole !== 'admin' ? true : claim.hasUnreadForAdmin,
                  hasUnreadForComposer: messageData.senderRole === 'admin' ? true : claim.hasUnreadForComposer,
                  lastMessageAt: now,
                  updatedAt: now
                }
              : claim
          )
        }));

        // Email para o compositor quando admin enviar mensagem
        // if (messageData.senderRole === 'admin') {
        //   (async () => {
        //     try {
        //       const claim = get().claims.find(c => c.id === claimId);
        //       if (claim?.composerEmail) {
        //         await sendTemplateEmail('claim-admin-message', claim.composerEmail, {
        //           composer_name: claim.composerName || 'Usuário',
        //           claim_id: claim.id
        //         });
        //       }
        //     } catch (e) {
        //       console.warn('Email notification (admin message) failed:', e);
        //     }
        //   })();
        // }
      },

      markMessagesAsRead: (claimId, userId, userRole) => {
        set((state) => ({
          claims: state.claims.map((claim) =>
            claim.id === claimId
              ? {
                  ...claim,
                  chatMessages: claim.chatMessages.map((msg) =>
                    msg.senderId !== userId ? { ...msg, read: true } : msg
                  ),
                  hasUnreadForAdmin: userRole === 'admin' ? false : claim.hasUnreadForAdmin,
                  hasUnreadForComposer: userRole === 'composer' ? false : claim.hasUnreadForComposer
                }
              : claim
          )
        }));
      },

      uploadAttachment: async (claimId, messageId, file) => {
        // TODO: Implementar upload real
        // Simular upload por enquanto
        const mockUrl = URL.createObjectURL(file);
        return mockUrl;
      },

      getClaimById: (claimId) => {
        return get().claims.find((c) => c.id === claimId);
      },

      getClaimsBySong: (songId) => {
        return get().claims.filter((c) => c.songId === songId);
      },

      getClaimsByComposer: (composerId) => {
        return get().claims.filter((c) => c.composerId === composerId);
      },

      getPendingClaimsCount: () => {
        return get().claims.filter((c) => c.status === 'pending').length;
      },

      loadClaims: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // TODO: Implementar carregamento da API
          set({ isLoading: false });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Erro ao carregar reivindicações'
          });
        }
      }
    }),
    {
      name: 'copyright-claims-storage',
      partialize: (state) => ({ claims: state.claims })
    }
  )
);

export default useCopyrightClaimsStore;
