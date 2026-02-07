// API real para dados do painel de perfil
import { supabase } from '@/lib/supabase-auth';

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
    composer_name?: string;
    cover_url?: string;
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
      followsResult
    ] = await Promise.all([
      // Contagem de playlists
      safeQuery(supabase.from('playlists').select('*', { count: 'exact', head: true }).eq('user_id', userId)),
      // Contagem de favoritos (tabela: favorites, campo: user_id UUID)
      safeQuery(supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', userId)),
      // Playlists do usuário
      safeQuery(supabase.from('playlists').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)),
      // Compositores seguidos (tabela: user_follows)
      safeQuery(supabase.from('user_follows').select('*').eq('user_id', userId).limit(20))
    ]);

    const playlistsCount = playlistsResult.count || 0;
    const favoritesCount = favoritesResult.count || 0;
    const playlists = playlistsDataResult.data as any[] | null;
    const followedRaw = followsResult.data as any[] | null;

    console.log('📊 ProfileDashboard - Stats carregadas:', {
      userId,
      playlistsCount,
      favoritesCount
    });

    return {
      stats: {
        playlistsCount,
        favoritesCount,
        hoursListened: 0,
        followersCount: 0
      },
      recentPlays: [],
      activities: [],
      followedComposers: (followedRaw || []).map((item: any) => ({
        id: String(item.followed_id || item.compositor_id || item.id),
        name: item.followed_name || 'Compositor',
        artistic_name: item.artistic_name,
        photo_url: item.photo_url,
        followers_count: 0,
        songs_count: 0
      })),
      playlists: (playlists || []).map((p: any) => ({
        id: String(p.id),
        name: p.name,
        description: p.description,
        cover_url: p.cover_url,
        songs_count: 0,
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
