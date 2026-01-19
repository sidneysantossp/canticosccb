// API real para dados do painel de perfil

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

export async function getProfileDashboardData(userId: string, _isComposer: boolean): Promise<ProfileDashboardData> {
  const { supabase } = await import('@/lib/supabase-auth');
  
  try {
    // Buscar estatísticas em paralelo
    const [
      { count: playlistsCount },
      { count: favoritesCount },
      { data: playlists },
      { data: recentPlays },
      { data: followedComposers }
    ] = await Promise.all([
      // Contagem de playlists
      supabase.from('playlists').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      // Contagem de favoritos
      supabase.from('favoritos').select('*', { count: 'exact', head: true }).eq('usuario_id', Number(userId)),
      // Playlists do usuário
      supabase.from('playlists').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      // Histórico recente
      supabase.from('historico').select(`
        id,
        created_at,
        hinos (id, titulo, compositor_nome, capa)
      `).eq('usuario_id', userId).order('created_at', { ascending: false }).limit(10),
      // Compositores seguidos
      supabase.from('seguidores').select(`
        compositor_id,
        compositores (id, name, artistic_name, photo_url)
      `).eq('usuario_id', userId).limit(20)
    ]);

    console.log('📊 ProfileDashboard - Stats carregadas:', {
      userId,
      playlistsCount,
      favoritesCount
    });

    return {
      stats: {
        playlistsCount: playlistsCount || 0,
        favoritesCount: favoritesCount || 0,
        hoursListened: 0,
        followersCount: 0
      },
      recentPlays: (recentPlays || []).map((item: any) => ({
        id: String(item.id),
        hymn: item.hinos ? {
          id: String(item.hinos.id),
          title: item.hinos.titulo,
          composer_name: item.hinos.compositor_nome,
          cover_url: item.hinos.capa
        } : undefined,
        created_at: item.created_at
      })),
      activities: [],
      followedComposers: (followedComposers || []).map((item: any) => ({
        id: String(item.compositores?.id || item.compositor_id),
        name: item.compositores?.name || 'Compositor',
        artistic_name: item.compositores?.artistic_name,
        photo_url: item.compositores?.photo_url,
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
