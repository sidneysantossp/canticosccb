import { supabase } from '@/lib/supabase-auth';

export interface RoyaltyRecord {
  id: string;
  composer: string;
  month: string;
  streams: number;
  revenue: number;
  status: 'pending' | 'paid' | 'processing';
  raw: any;
}

const normalizeStatus = (status?: string | null): RoyaltyRecord['status'] => {
  switch ((status || '').toLowerCase()) {
    case 'paid':
      return 'paid';
    case 'processing':
      return 'processing';
    default:
      return 'pending';
  }
};

const formatReferenceMonth = (row: any) => {
  if (row.month) return String(row.month);
  if (row.reference_month) return String(row.reference_month);
  if (row.period) return String(row.period);
  if (row.created_at) {
    const date = new Date(row.created_at);
    return date.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
  }
  return '-';
};

const mapRoyalty = (row: any): RoyaltyRecord => ({
  id: String(row.id),
  composer:
    row.composer_name ||
    row.artist_name ||
    row.payee_name ||
    row.metadata?.composer_name ||
    (row.composer_id ? `Compositor #${row.composer_id}` : 'Compositor'),
  month: formatReferenceMonth(row),
  streams: Number(row.streams_count || row.plays_count || row.total_streams || 0),
  revenue: Number(row.amount || row.total_amount || row.revenue || row.value || 0),
  status: normalizeStatus(row.status),
  raw: row,
});

export const getRoyalties = async (): Promise<RoyaltyRecord[]> => {
  const { data, error } = await supabase
    .from('royalties')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapRoyalty);
};

export const processPayment = async (id: string): Promise<{ success: boolean }> => {
  let lastError: any = null;

  for (const payload of [{ status: 'processing' }, { status: 'paid' }, { paid_at: new Date().toISOString() }]) {
    const { error } = await supabase
      .from('royalties')
      .update(payload)
      .eq('id', id);

    if (!error) return { success: true };
    lastError = error;
  }

  if (lastError) throw lastError;
  return { success: true };
};
