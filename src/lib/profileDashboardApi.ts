// API real para dados do painel de perfil
import { supabase } from '@/lib/supabase-auth';
import { listHistory } from './historyApi';

export interface FollowedComposer {
  id: string;
  name: string;
  artistic_name?: string;
  photo_url?: string;
  followers_count: number;
  songs_count: number;
}

export interface UserPlaylist {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  songs_count: number;
  created_at: string;
}

export interface RecentPlayItem {
  id: string;
  hymn?: {
    id: string;
    title: string;
    artist?: string;
    composer_name?: string;
    coverUrl?: string;
    cover_url?: string;
    audioUrl?: string;
    youtubeSource?: string;
    duration?: string;
    number?: number;
    category?: string;
    createdAt?: string;
  };
  created_at: string;
}

export interface ActivityItem {
  id: string;
  activity_type: 'favorite' | 'playlist_created' | 'playlist_updated' | 'follow' | 'play';
  related_id?: string;
  related_title?: string;
  created_at: string;
}

export interface ProfileDashboardData {
  stats: {
    playlistsCount: number;
    favoritesCount: number;
    hoursListened: number;
    followersCount: number;
  };
  recentPlays: RecentPlayItem[];
  activities: ActivityItem[];
  followedComposers: FollowedComposer[];
  playlists: UserPlaylist[];
  composerProfile?: {
    id: string;
    name: string;
    artistic_name?: string;
    email?: string;
    avatar_url?: string;
    created_at?: string;
    location?: string;
  } | null;
}

// Helper: query segura que retorna fallback se a tabela não existir
async function safeQuery<T>(query: PromiseLike<{ data: T | null; error: any; count?: number | null }>): Promise<{ data: T | null; error: any; count: number | null }> {
  try {
    const result = await query as any;
    return { data: result.data, error: result.error, count: result.count ?? null };
  } catch {
    return { data: null, error: null, count: null };
  }
}

export async function getProfileDashboardData(userId: string, _isComposer: boolean): Promise<ProfileDashboardData> {
  try {
    // Buscar estatísticas em paralelo (nomes de tabelas conforme schema real)
    const [
      playlistsResult,
      favoritesResult,
      playlistsDataResult,
      followsResult,
    ] = await Promise.all([
      // Contagem de playlists
      safeQuery(supabase.from('playlists').select('*', { count: 'exact', head: true }).eq('user_id', userId)),
      // Contagem de favoritos (tabela: favorites, campo: user_id UUID)
      safeQuery(supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', userId)),
      // Playlists do usuário
      safeQuery(supabase.from('playlists').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)),
      // Compositores seguidos (tabela: user_follows)
      safeQuery(supabase.from('user_follows').select('*').eq('user_id', userId).limit(20)),
    ]);

    const playlistsCount = playlistsResult.count || 0;
    const favoritesCount = favoritesResult.count || 0;
    const playlists = playlistsDataResult.data as any[] | null;
    const followedRaw = followsResult.data as any[] | null;
    const recentPlaysRaw = await listHistory(userId, 12);

    const playlistIds = (playlists || []).map((item: any) => String(item.id));
    let playlistTrackCountMap: Record<string, number> = {};

    if (playlistIds.length > 0) {
      const [playlistHinosRows, playlistSongsRows, playlistTracksRows] = await Promise.all([
        safeQuery(
          supabase
            .from('playlist_hinos')
            .select('playlist_id')
            .in('playlist_id', playlistIds)
        ),
        safeQuery(
          supabase
            .from('playlist_songs')
            .select('playlist_id')
            .in('playlist_id', playlistIds)
        ),
        safeQuery(
          supabase
            .from('playlist_tracks')
            .select('playlist_id')
            .in('playlist_id', playlistIds)
        )
      ]);

      for (const row of (playlistHinosRows.data as any[] | null) || []) {
        const key = String(row.playlist_id);
        playlistTrackCountMap[key] = (playlistTrackCountMap[key] || 0) + 1;
      }

      for (const row of (playlistSongsRows.data as any[] | null) || []) {
        const key = String(row.playlist_id);
        playlistTrackCountMap[key] = (playlistTrackCountMap[key] || 0) + 1;
      }

      for (const row of (playlistTracksRows.data as any[] | null) || []) {
        const key = String(row.playlist_id);
        playlistTrackCountMap[key] = (playlistTrackCountMap[key] || 0) + 1;
      }
    }

    const followedIds = Array.from(
      new Set(
        ((followedRaw || []).map((item: any) =>
          String(item.composer_id || item.compositor_id || item.followed_id || '')
        )).filter(Boolean)
      )
    );

    let followedComposerMap: Record<string, any> = {};
    let composerSongCountMap: Record<string, number> = {};

    if (followedIds.length > 0) {
      const [composerRows, hymnRows] = await Promise.all([
        safeQuery(
          supabase
            .from('composers')
            .select('id,name,artistic_name,avatar_url,photo_url,followers_count')
            .in('id', followedIds)
        ),
        safeQuery(
          supabase
            .from('hinos')
            .select('id,compositor_id')
            .in('compositor_id', followedIds)
            .limit(5000)
        )
      ]);

      for (const composer of (composerRows.data as any[] | null) || []) {
        followedComposerMap[String(composer.id)] = composer;
      }

      for (const hymn of (hymnRows.data as any[] | null) || []) {
        const key = String(hymn.compositor_id || '');
        if (!key) continue;
        composerSongCountMap[key] = (composerSongCountMap[key] || 0) + 1;
      }
    }

    return {
      stats: {
        playlistsCount,
        favoritesCount,
        hoursListened: 0,
        followersCount: 0
      },
      recentPlays: (recentPlaysRaw || []).map((item: any) => ({
        id: String(item.id),
        created_at: item.started_at,
        hymn: {
          id: String(item.hino_id),
          title: item.title || 'Título desconhecido',
          artist: item.composer_name || 'Compositor Desconhecido',
          composer_name: item.composer_name || 'Compositor Desconhecido',
          coverUrl: item.cover_url || '',
          cover_url: item.cover_url || '',
          duration: item.duration_sec ? `${Math.floor(item.duration_sec / 60)}:${String(item.duration_sec % 60).padStart(2, '0')}` : '0:00',
          createdAt: item.started_at
        }
      })),
      activities: [],
      followedComposers: (followedRaw || []).map((item: any) => ({
        id: String(item.composer_id || item.compositor_id || item.followed_id || item.id),
        name: followedComposerMap[String(item.composer_id || item.compositor_id || item.followed_id || item.id)]?.name || item.followed_name || 'Compositor',
        artistic_name: followedComposerMap[String(item.composer_id || item.compositor_id || item.followed_id || item.id)]?.artistic_name || item.artistic_name,
        photo_url: followedComposerMap[String(item.composer_id || item.compositor_id || item.followed_id || item.id)]?.avatar_url
          || followedComposerMap[String(item.composer_id || item.compositor_id || item.followed_id || item.id)]?.photo_url
          || item.photo_url,
        followers_count: Number(
          followedComposerMap[String(item.composer_id || item.compositor_id || item.followed_id || item.id)]?.followers_count || 0
        ),
        songs_count: Number(
          composerSongCountMap[String(item.composer_id || item.compositor_id || item.followed_id || item.id)] || 0
        )
      })),
      playlists: (playlists || []).map((p: any) => ({
        id: String(p.id),
        name: p.name,
        description: p.description,
        cover_url: p.cover_url,
        songs_count: playlistTrackCountMap[String(p.id)] || 0,
        created_at: p.created_at
      })),
      composerProfile: null
    };
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    // Retornar dados vazios em caso de erro
    return {
      stats: { playlistsCount: 0, favoritesCount: 0, hoursListened: 0, followersCount: 0 },
      recentPlays: [],
      activities: [],
      followedComposers: [],
      playlists: [],
      composerProfile: null
    };
  }
}
