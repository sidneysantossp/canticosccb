export type FollowerStats = {
  total: number;
  thisMonth: number;
  growth: number;
  engagement: number;
  averagePlays: number;
};

export type Follower = {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  followedAt: string;
  totalPlays: number;
  isActive: boolean;
  location?: string | null;
  favoriteSong?: string | null;
};

export type TopFan = {
  id: string;
  name: string;
  avatar_url?: string;
  totalPlays: number;
  totalLikes: number;
  engagementScore: number;
  plays?: number;
  hoursListened?: number | null;
};

export type FollowerGrowthPoint = { date: string; count: number };

const qs = (params: Record<string, any>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

export async function getFollowerStats(usuarioId: number): Promise<FollowerStats> {
  const url = `/api/followers/compositor/stats.php?${qs({ usuario_id: usuarioId })}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao carregar stats de seguidores');
  return await res.json();
}

export async function getFollowers(usuarioId: number, limit = 50, offset = 0, search = '', filter: 'all'|'recent'|'active' = 'all'): Promise<Follower[]> {
  const url = `/api/followers/compositor/list.php?${qs({ usuario_id: usuarioId, limit, offset, search, filter })}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao carregar seguidores');
  const data = await res.json();
  return data.followers || [];
}

export async function getTopFans(usuarioId: number, limit = 3): Promise<TopFan[]> {
  const url = `/api/followers/compositor/top_fans.php?${qs({ usuario_id: usuarioId, limit })}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao carregar top fãs');
  const data = await res.json();
  return data.top || [];
}

export async function getFollowerGrowth(usuarioId: number, days = 30): Promise<FollowerGrowthPoint[]> {
  const url = `/api/followers/compositor/growth.php?${qs({ usuario_id: usuarioId, days })}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao carregar crescimento');
  const data = await res.json();
  return data.series || [];
}
