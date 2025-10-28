import { getApiUrl } from '@/lib/api-helper';

export async function getUserFavorites(userId: number): Promise<string[]> {
  try {
    const url = getApiUrl(`/api/favorites/index.php?usuario_id=${encodeURIComponent(String(userId))}`);
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const ids = Array.isArray(data?.favorites) ? data.favorites : [];
    return ids.map((v: any) => String(v));
  } catch {
    return [];
  }
}

export async function addFavorite(userId: number, hymnId: number): Promise<boolean> {
  try {
    const url = getApiUrl('/api/favorites/index.php');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: userId, hino_id: hymnId })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function removeFavorite(userId: number, hymnId: number): Promise<boolean> {
  try {
    const url = getApiUrl('/api/favorites/index.php');
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: userId, hino_id: hymnId })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncLocalFavoritesWithBackend(userId: number): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  try {
    const stored = localStorage.getItem('favoriteHymns');
    if (!stored) return;
    const ids: any[] = JSON.parse(stored);
    const unique = Array.from(new Set((Array.isArray(ids) ? ids : []).map((v) => Number(v) || parseInt(String(v), 10)).filter((n) => !!n)));
    if (unique.length === 0) return;
    for (const id of unique) {
      await fetch(getApiUrl('/api/favorites/index.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: userId, hino_id: id })
      });
    }
    localStorage.removeItem('favoriteHymns');
  } catch {}
}
