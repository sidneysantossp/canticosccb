import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  getComposerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToComposerNotifications,
  type ComposerNotification
} from '@/lib/notificationsApi';

export interface Notification {
  id: string;
  type: 'favorite_song' | 'favorite_album' | 'follow' | 'admin' | 'comment';
  title: string;
  message: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  songId?: string;
  songTitle?: string;
  albumId?: string;
  albumTitle?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  composerId: string | null;
  
  // Actions
  setComposerId: (composerId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => void;
  loadNotifications: (composerId: string) => Promise<void>;
  subscribeToNotifications: (composerId: string) => void;
}

let notificationChannel: any = null;

const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      composerId: null,

      setComposerId: (composerId: string) => {
        set({ composerId });
      },

      addNotification: (notificationData) => {
        const newNotification: Notification = {
          ...notificationData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          isRead: false
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }));
      },

      markAsRead: async (id: string) => {
        // Atualizar localmente primeiro
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          if (!notification || notification.isRead) return state;

          return {
            notifications: state.notifications.map(n => 
              n.id === id ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          };
        });

        // Sincronizar com API
        try {
          await markNotificationAsRead(id);
        } catch (error) {
          console.error('[NotificationsStore] Error marking as read:', error);
        }
      },

      markAllAsRead: async () => {
        const { composerId } = get();
        if (!composerId) return;

        // Atualizar localmente primeiro
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true })),
          unreadCount: 0
        }));

        // Sincronizar com API
        try {
          await markAllNotificationsAsRead(composerId);
        } catch (error) {
          console.error('[NotificationsStore] Error marking all as read:', error);
        }
      },

      removeNotification: async (id: string) => {
        // Remover localmente primeiro
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          const wasUnread = notification && !notification.isRead;

          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
          };
        });

        // Sincronizar com API
        try {
          await deleteNotification(id);
        } catch (error) {
          console.error('[NotificationsStore] Error deleting notification:', error);
        }
      },

      clearAll: () => {
        set({
          notifications: [],
          unreadCount: 0
        });
      },

      loadNotifications: async (composerId: string) => {
        set({ isLoading: true, composerId });
        
        try {
          const { data, error } = await getComposerNotifications(composerId, {
            limit: 50
          });

          if (error) {
            console.error('[NotificationsStore] Error loading notifications:', error);
            set({ isLoading: false });
            return;
          }

          // Converter para o formato da store
          const notifications: Notification[] = data.map((n: ComposerNotification) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            userId: n.user_id || undefined,
            userName: n.user_name || undefined,
            userAvatar: n.user_avatar || undefined,
            songId: n.song_id || undefined,
            songTitle: n.song_title || undefined,
            albumId: n.album_id || undefined,
            albumTitle: n.album_title || undefined,
            isRead: n.is_read,
            createdAt: n.created_at
          }));

          const unreadCount = notifications.filter(n => !n.isRead).length;
          
          set({ 
            notifications,
            unreadCount,
            isLoading: false 
          });
        } catch (error) {
          console.error('[NotificationsStore] Exception loading notifications:', error);
          set({ isLoading: false });
        }
      },

      subscribeToNotifications: (composerId: string) => {
        // Cancelar subscrição anterior se existir
        if (notificationChannel) {
          notificationChannel.unsubscribe();
        }

        // Criar nova subscrição
        notificationChannel = subscribeToComposerNotifications(composerId, (notification) => {
          // Adicionar nova notificação ao estado
          const newNotification: Notification = {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            userId: notification.user_id || undefined,
            userName: notification.user_name || undefined,
            userAvatar: notification.user_avatar || undefined,
            songId: notification.song_id || undefined,
            songTitle: notification.song_title || undefined,
            albumId: notification.album_id || undefined,
            albumTitle: notification.album_title || undefined,
            isRead: notification.is_read,
            createdAt: notification.created_at
          };

          set((state) => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1
          }));

          // Opcional: Mostrar notificação do sistema
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: newNotification.userAvatar || '/logo-canticos-ccb.png'
            });
          }
        });
      }
    }),
    {
      name: 'notifications-storage',
      partialize: (state) => ({ 
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        composerId: state.composerId
      })
    }
  )
);

// Helper functions for creating specific notification types
export const createFavoriteNotification = (userName: string, userAvatar: string, songTitle: string, songId: string) => {
  return {
    type: 'favorite' as const,
    title: 'Novo favorito',
    message: `${userName} favoritou "${songTitle}"`,
    userName,
    userAvatar,
    songTitle,
    songId
  };
};

export const createFollowNotification = (userName: string, userAvatar: string, userId: string) => {
  return {
    type: 'follow' as const,
    title: 'Novo seguidor',
    message: `${userName} começou a seguir você`,
    userName,
    userAvatar,
    userId
  };
};

export const createAdminNotification = (title: string, message: string) => {
  return {
    type: 'admin' as const,
    title,
    message
  };
};

export default useNotificationsStore;
