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
  const isLocalDevelopment = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('172.')
  );
  const API_BASE_URL = isLocalDevelopment ? '/api' : ((import.meta as any)?.env?.VITE_API_BASE_URL || 'https://canticosccb.com.br/api');
  const res = await fetch(`${API_BASE_URL}/profile-dashboard/index.php?usuario_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Falha ao carregar dashboard do perfil');
  const data = await res.json();
  return data as ProfileDashboardData;
}
