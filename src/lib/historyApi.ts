import { supabase } from '@/lib/supabase-auth';

export interface HistoryItem {
  id: string;
  usuario_id: string;
  hino_id: string;
  title: string;
  composer_name: string;
  cover_url?: string;
  duration_sec: number;
  started_at: string;
}

type ListeningHistoryRow = {
  id: string | number;
  user_id: string | number;
  hymn_id?: string | number | null;
  song_id?: string | number | null;
  listened_at?: string | null;
  played_at?: string | null;
  duration_seconds?: number | null;
  duration_played?: number | null;
};

const parseDurationToSeconds = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value));

  const text = String(value).trim();
  if (!text) return 0;
  if (text.includes(':')) {
    const parts = text.split(':').map((item) => Number(item) || 0);
    if (parts.length === 2) return (parts[0] * 60) + parts[1];
    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  }

  const numeric = Number(text);
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0;
};

const isMissingRelationError = (error: any) => {
  const message = String(error?.message || '');
  return message.includes('Could not find the table') || message.includes('does not exist');
};

const normalizeDbId = (value: unknown): string | number => {
  const text = String(value ?? '').trim();
  if (!text) return '';

  const numeric = Number(text);
  if (Number.isFinite(numeric) && String(numeric) === text) {
    return numeric;
  }

  return text;
};

async function loadHymnsByIds(hymnIds: Array<string | number>) {
  if (hymnIds.length === 0) {
    return new Map<string, any>();
  }

  const uniqueIds = Array.from(
    new Set(
      hymnIds
        .map((id) => normalizeDbId(id))
        .filter((id) => String(id).trim() !== '')
    )
  );

  const { data, error } = await supabase
    .from('hinos')
    .select('id,titulo,compositor_nome,cover_url,duracao')
    .in('id', uniqueIds)
    .limit(4000);

  if (error) {
    console.error('Erro ao buscar hinos do histórico:', error);
    return new Map<string, any>();
  }

  return new Map((data || []).map((row: any) => [String(row.id), row]));
}

export async function listHistory(userId: string | number, limit: number = 100): Promise<HistoryItem[]> {
  const [listeningHistory, songHistory] = await Promise.all([
    supabase
      .from('listening_history')
      .select('id,user_id,hymn_id,listened_at,duration_seconds')
      .eq('user_id', String(userId))
      .order('listened_at', { ascending: false })
      .limit(limit),
    supabase
      .from('user_song_history')
      .select('id,user_id,song_id,played_at,duration_played')
      .eq('user_id', String(userId))
      .order('played_at', { ascending: false })
      .limit(limit),
  ]);

  const rows: ListeningHistoryRow[] = [];

  if (!listeningHistory.error) {
    rows.push(...((listeningHistory.data || []) as ListeningHistoryRow[]));
  } else if (!isMissingRelationError(listeningHistory.error)) {
    console.error('Erro ao buscar listening_history:', listeningHistory.error);
  }

  if (!songHistory.error) {
    rows.push(...((songHistory.data || []) as ListeningHistoryRow[]));
  } else if (!isMissingRelationError(songHistory.error)) {
    console.error('Erro ao buscar user_song_history:', songHistory.error);
  }

  const sortedRows = rows
    .sort((a, b) => {
      const left = new Date(a.listened_at || a.played_at || 0).getTime();
      const right = new Date(b.listened_at || b.played_at || 0).getTime();
      return right - left;
    })
    .slice(0, limit);

  const hymnIds = sortedRows
    .map((item) => item.hymn_id ?? item.song_id)
    .filter((value) => value != null);
  const hymnsById = await loadHymnsByIds(hymnIds as Array<string | number>);

  return sortedRows.map((item) => {
    const hymnId = String(item.hymn_id ?? item.song_id ?? '');
    const hymn = hymnsById.get(hymnId);

    return {
      id: String(item.id),
      usuario_id: String(item.user_id),
      hino_id: hymnId,
      title: hymn?.titulo || `Hino ${hymnId}` || 'Título desconhecido',
      composer_name: hymn?.compositor_nome || 'Artista desconhecido',
      cover_url: hymn?.cover_url || '',
      duration_sec: parseDurationToSeconds(item.duration_seconds ?? item.duration_played ?? hymn?.duracao),
      started_at: item.listened_at || item.played_at || new Date().toISOString(),
    };
  });
}

export async function addToHistory(userId: string | number, hinoId: string | number): Promise<void> {
  const normalizedId = normalizeDbId(hinoId);

  const listeningHistory = await supabase
    .from('listening_history')
    .insert({
      user_id: String(userId),
      hymn_id: normalizedId,
      listened_at: new Date().toISOString(),
      duration_seconds: 0,
      completed: false,
    });

  if (!listeningHistory.error) {
    return;
  }

  const songHistory = await supabase
    .from('user_song_history')
    .insert({
      user_id: String(userId),
      song_id: normalizedId,
      played_at: new Date().toISOString(),
      duration_played: 0,
      completed: false,
    });

  if (songHistory.error && !isMissingRelationError(songHistory.error)) {
    console.error('Erro ao adicionar ao histórico:', songHistory.error);
  }
}

export async function clearHistory(userId: string | number): Promise<void> {
  const [listeningHistory, songHistory] = await Promise.all([
    supabase.from('listening_history').delete().eq('user_id', String(userId)),
    supabase.from('user_song_history').delete().eq('user_id', String(userId)),
  ]);

  if (
    listeningHistory.error &&
    songHistory.error &&
    !isMissingRelationError(listeningHistory.error) &&
    !isMissingRelationError(songHistory.error)
  ) {
    console.error('Erro ao limpar histórico:', listeningHistory.error, songHistory.error);
    throw listeningHistory.error;
  }
}
