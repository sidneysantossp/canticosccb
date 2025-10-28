import { mockHinos } from '@/data/mockData';

export type TrendingPeriod = 'hoje' | 'semana' | 'mes';
export type TrendingDirection = 'up' | 'down' | 'stable';

export interface TrendingHymn {
  id: string;
  number: number;
  title: string;
  composer_name: string;
  category: string;
  duration: string;
  play_count_today: number;
  cover_url: string;
  audio_url: string;
  created_at: string;
  rank?: number;
  previous_rank?: number;
  trending_direction?: TrendingDirection;
}

const buildFallbackImage = (seed: string, size: number = 300) => {
  const normalizedSeed = encodeURIComponent(seed.toLowerCase().replace(/\s+/g, '-'));
  return `https://picsum.photos/seed/${normalizedSeed}/${size}/${size}`;
};

export async function getTrendingHymns(
  period: TrendingPeriod = 'hoje',
  limit: number = 10
): Promise<TrendingHymn[]> {
  const sorted = [...mockHinos].sort((a, b) => b.plays - a.plays).slice(0, limit);

  const divisor = period === 'hoje' ? 12 : period === 'semana' ? 32 : 48;

  const trends = sorted.map((hino, index) => {
    const rank = index + 1;
    const previousRank = Math.max(1, rank + 1);
    const direction: TrendingDirection = rank % 3 === 0 ? 'up' : rank % 3 === 1 ? 'down' : 'stable';

    return {
      id: hino.id,
      number: hino.number,
      title: hino.title,
      composer_name: hino.artist,
      category: hino.category,
      duration: hino.duration,
      play_count_today: Math.max(1, Math.floor(hino.plays / divisor)),
      cover_url: hino.coverUrl || buildFallbackImage(`${hino.title}-${hino.id}`),
      audio_url: hino.audioUrl || '',
      created_at: hino.createdAt,
      rank,
      previous_rank: previousRank,
      trending_direction: direction,
    } satisfies TrendingHymn;
  });

  return trends;
}
