import { supabase } from './supabase-auth';

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

export async function getComposerNotifications(composerId: string, opts?: { limit?: number }) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('composer_id', composerId)
      .neq('type', 'support_chat')
      .order('created_at', { ascending: false })
      .limit(opts?.limit || 50);

    if (error) throw error;

    return { data: data as ComposerNotification[], error: null };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { data: [], error };
  }
}

export async function markNotificationAsRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) console.error('Error marking notification as read:', error);
}

export async function markAllNotificationsAsRead(composerId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('composer_id', composerId)
    .eq('is_read', false);

  if (error) console.error('Error marking all notifications as read:', error);
}

export async function deleteNotification(id: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) console.error('Error deleting notification:', error);
}

export function subscribeToComposerNotifications(composerId: string, cb: (n: ComposerNotification) => void) {
  const channel = supabase
    .channel(`composer-notifications-${composerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `composer_id=eq.${composerId}`
      },
      (payload) => {
        const row = payload.new as ComposerNotification;
        if (row?.type === 'support_chat') return;
        cb(row);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}
