import { supabase } from '@/lib/supabase-auth';

export async function getUserFavorites(userId: string | number): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('hino_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao buscar favoritos:', error);
      return [];
    }

    return (data || []).map((v: any) => String(v.hino_id));
  } catch {
    return [];
  }
}

export async function addFavorite(userId: string | number, hymnId: string | number): Promise<boolean> {
  try {
    console.log('💚 addFavorite - Tentando adicionar:', { userId, hymnId });
    
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        hino_id: hymnId
      })
      .select();

    if (error) {
      console.error('❌ Erro ao adicionar favorito:', error);
      return false;
    }

    console.log('✅ Favorito adicionado com sucesso:', data);
    return true;
  } catch (err) {
    console.error('❌ Exceção ao adicionar favorito:', err);
    return false;
  }
}

export async function removeFavorite(userId: string | number, hymnId: string | number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('hino_id', hymnId);

    if (error) {
      console.error('Erro ao remover favorito:', error);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function syncLocalFavoritesWithBackend(userId: string | number): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  try {
    const stored = localStorage.getItem('favoriteHymns');
    if (!stored) return;
    const ids: any[] = JSON.parse(stored);
    const unique = Array.from(new Set((Array.isArray(ids) ? ids : []).map((v) => Number(v) || parseInt(String(v), 10)).filter((n) => !!n)));
    if (unique.length === 0) return;
    
    for (const id of unique) {
      await addFavorite(userId, id);
    }
    
    localStorage.removeItem('favoriteHymns');
  } catch {}
}
