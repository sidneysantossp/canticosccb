import { supabase } from '@/lib/supabase-auth';

export interface HistoryItem {
  id: number;
  usuario_id: number;
  hino_id: number;
  title: string;
  artist: string;
  cover_url?: string;
  duration?: string;
  played_at: string;
}

export async function listHistory(userId: number, limit: number = 100): Promise<HistoryItem[]> {
  const { data, error } = await supabase
    .from('historico')
    .select(`
      id,
      usuario_id,
      hino_id,
      created_at,
      hinos (
        id,
        titulo,
        compositor_nome,
        capa,
        duracao
      )
    `)
    .eq('usuario_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Erro ao buscar histórico:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    usuario_id: item.usuario_id,
    hino_id: item.hino_id,
    title: item.hinos?.titulo || 'Título desconhecido',
    artist: item.hinos?.compositor_nome || 'Artista desconhecido',
    cover_url: item.hinos?.capa || '',
    duration: item.hinos?.duracao || '0:00',
    played_at: item.created_at
  }));
}

export async function addToHistory(userId: number, hinoId: number): Promise<void> {
  const { error } = await supabase
    .from('historico')
    .insert({
      usuario_id: userId,
      hino_id: hinoId
    });

  if (error) {
    console.error('Erro ao adicionar ao histórico:', error);
  }
}

export async function clearHistory(userId: number): Promise<void> {
  const { error } = await supabase
    .from('historico')
    .delete()
    .eq('usuario_id', userId);

  if (error) {
    console.error('Erro ao limpar histórico:', error);
    throw error;
  }
}
