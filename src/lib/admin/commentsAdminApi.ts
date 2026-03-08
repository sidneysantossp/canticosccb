import { supabase } from '@/lib/supabase-auth';

export interface AdminCommentRecord {
  id: string;
  user: string;
  userEmail: string;
  song: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  raw: any;
}

const normalizeStatus = (row: any): AdminCommentRecord['status'] => {
  const explicit = String(row?.status || '').toLowerCase();
  if (explicit === 'approved') return 'approved';
  if (explicit === 'rejected') return 'rejected';
  if (explicit === 'pending') return 'pending';

  if (row?.is_approved === true) return 'approved';
  if (row?.is_approved === false) return 'rejected';
  return 'pending';
};

const mapComment = (row: any): AdminCommentRecord => ({
  id: String(row.id),
  user: row.user_name || row.author_name || row.nome || row.name || row.metadata?.user_name || 'Usuário',
  userEmail: row.user_email || row.email || row.metadata?.user_email || '',
  song:
    row.song_title ||
    row.hymn_title ||
    row.target_title ||
    row.title ||
    (row.song_id ? `Hino #${row.song_id}` : row.hymn_id ? `Hino #${row.hymn_id}` : 'Conteúdo'),
  content: row.content || row.comment || row.message || row.body || '',
  status: normalizeStatus(row),
  created_at: row.created_at || new Date().toISOString(),
  raw: row,
});

export const getComments = async (): Promise<AdminCommentRecord[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapComment);
};

const tryUpdateStatus = async (id: string, payloads: Record<string, unknown>[]) => {
  let lastError: any = null;

  for (const payload of payloads) {
    const { error } = await supabase
      .from('comments')
      .update(payload)
      .eq('id', id);

    if (!error) return;
    lastError = error;
  }

  if (lastError) throw lastError;
};

export const approveComment = async (id: string): Promise<{ success: boolean }> => {
  await tryUpdateStatus(id, [{ status: 'approved' }, { is_approved: true }]);
  return { success: true };
};

export const rejectComment = async (id: string): Promise<{ success: boolean }> => {
  await tryUpdateStatus(id, [{ status: 'rejected' }, { is_approved: false }]);
  return { success: true };
};

export const deleteComment = async (id: string): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};
