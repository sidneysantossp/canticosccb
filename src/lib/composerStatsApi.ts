export type ComposerOverview = {
  plays: number;
  followers: number;
  likes: number;
  averageListenTimeSeconds: number;
};

export type TopSong = {
  id: string;
  title: string;
  plays: number;
  likes: number;
  coverUrl?: string;
};

// Utils
const qs = (params: Record<string, any>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

export async function getComposerOverview(usuarioId: number, period: '7d'|'30d'|'90d'|'1y' = '30d'): Promise<ComposerOverview> {
  const map: any = { '7d': 'last_7d', '30d': 'last_30d', '90d': 'last_90d', '1y': 'last_1y' };
  const url = `/api/analytics/compositor/overview.php?${qs({ usuario_id: usuarioId, period: map[period] })}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao carregar overview');
  const data = await res.json();
  const s = data.stats || {};
  return {
    plays: s.totalPlays || 0,
    followers: s.totalFollowers || 0,
    likes: 0,
    averageListenTimeSeconds: Math.round((s.averageListenTime || 0) * 60),
  };
}

export async function getTopSongs(usuarioId: number, limit: number): Promise<TopSong[]> {
  const url = `/api/analytics/compositor/highlights.php?${qs({ usuario_id: usuarioId, limit })}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao carregar destaques');
  const data = await res.json();
  return (data.top || []).map((t: any) => ({
    id: String(t.id),
    title: t.title,
    plays: t.plays || 0,
    likes: t.likes || 0,
    coverUrl: t.coverUrl || undefined,
  }));
}

export async function getPlaysSeries(usuarioId: number, days: number): Promise<{ day: string; plays: number }[]> {
  const url = `/api/analytics/compositor/series.php?${qs({ usuario_id: usuarioId, days })}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao carregar série');
  const data = await res.json();
  return data.series || [];
}

export async function getEngagementCounts(usuarioId: number, days: number): Promise<{ likes: number; shares: number; downloads: number }> {
  const url = `/api/analytics/compositor/engagement.php?${qs({ usuario_id: usuarioId, days })}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao carregar engajamento');
  const data = await res.json();
  return { likes: data.likes || 0, shares: data.shares || 0, downloads: data.downloads || 0 };
}

// Janela anterior (por enquanto, retorna 0 até termos endpoint com range)
export async function getEngagementCountsWindow(_usuarioId: number, _startISO: string, _endISO: string): Promise<{ likes: number; shares: number; downloads: number }> {
  return { likes: 0, shares: 0, downloads: 0 };
}

// Ainda não implementados no backend: retornar vazio
export async function getAudienceTopCountries(_usuarioId: number, _days: number, _limit: number) { return []; }
export async function getAudienceDevices(_usuarioId: number, _days: number) { return { mobile: 0, desktop: 0, other: 0 }; }

// New helpers for robust analytics resolution
export async function getComposerIdForUser(usuarioId: number): Promise<number | null> {
  const res = await fetch(`/api/compositores/index.php?usuario_id=${encodeURIComponent(String(usuarioId))}`);
  if (!res.ok) return null;
  const data = await res.json();
  const comp = data?.id ? data : (data?.compositor || data?.compositores?.[0]);
  const id = comp?.id;
  const n = typeof id === 'string' ? parseInt(id, 10) : (typeof id === 'number' ? id : NaN);
  return Number.isFinite(n) ? n : null;
}

export async function getEngagementCountsByComposerId(compositorId: number, days: number): Promise<{ likes: number; shares: number; downloads: number }> {
  const url = `/api/analytics/compositor/engagement.php?${qs({ compositor_id: compositorId, days })}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao carregar engajamento');
  const data = await res.json();
  return { likes: data.likes || 0, shares: data.shares || 0, downloads: data.downloads || 0 };
}
