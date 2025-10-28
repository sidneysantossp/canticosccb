// Stub notifications API for migration phase
export type ComposerNotification = {
  id: string;
  type: 'favorite_song' | 'favorite_album' | 'follow' | 'admin' | 'comment';
  title: string;
  message: string;
  user_id?: string;
  user_name?: string;
  user_avatar?: string;
  song_id?: string;
  song_title?: string;
  album_id?: string;
  album_title?: string;
  is_read: boolean;
  created_at: string;
};

export async function getComposerNotifications(_composerId: string, _opts?: { limit?: number }) {
  return { data: [] as ComposerNotification[], error: null as any };
}
export async function markNotificationAsRead(_id: string) { return; }
export async function markAllNotificationsAsRead(_composerId: string) { return; }
export async function deleteNotification(_id: string) { return; }

export function subscribeToComposerNotifications(_composerId: string, _cb: (n: ComposerNotification) => void) {
  return { unsubscribe() {} };
}
