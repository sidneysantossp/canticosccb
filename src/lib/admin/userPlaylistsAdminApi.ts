import { publicSupabase } from '@/lib/supabase-auth';
import { supabaseDelete, supabaseUpdate } from '@/lib/supabaseRest';

type PlaylistRow = {
  id: string;
  user_id?: string | null;
  name?: string | null;
  description?: string | null;
  cover_url?: string | null;
  is_public?: boolean | number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type UserRow = {
  id: string;
  email?: string | null;
  name?: string | null;
};

type PlaylistSongRow = {
  playlist_id?: string | number | null;
  song_id?: string | number | null;
};

type HymnRow = {
  id: string;
  numero?: string | number | null;
  titulo?: string | null;
  title?: string | null;
};

export interface PlaylistSongSummary {
  id: string;
  song_id: string;
  song_title: string;
  song_number?: string | null;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string;
  cover_url: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  song_count: number;
  followers_count: number;
}

export interface PlaylistWithDetails extends Playlist {
  songs: PlaylistSongSummary[];
}

const PLAYLIST_SELECT = 'id,user_id,name,description,cover_url,is_public,created_at,updated_at';

const toBoolean = (value: unknown) => value === true || value === 1 || value === '1';

const mapPlaylistRow = (
  row: PlaylistRow,
  usersById: Map<string, UserRow>,
  songCountsByPlaylistId: Map<string, number>
): Playlist => {
  const ownerId = String(row.user_id || '');
  const owner = usersById.get(ownerId);

  return {
    id: String(row.id),
    user_id: ownerId,
    name: row.name || 'Playlist sem nome',
    description: row.description || '',
    cover_url: row.cover_url || '',
    is_public: toBoolean(row.is_public),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || row.created_at || new Date().toISOString(),
    user_name: owner?.name || 'Usuário desconhecido',
    user_email: owner?.email || '',
    song_count: songCountsByPlaylistId.get(String(row.id)) || 0,
    followers_count: 0,
  };
};

async function loadUsersById(userIds: string[]): Promise<Map<string, UserRow>> {
  if (userIds.length === 0) return new Map();

  const { data, error } = await publicSupabase
    .from('users')
    .select('id,email,name')
    .in('id', userIds);

  if (error) {
    console.warn('⚠️ [userPlaylistsAdminApi] Error loading playlist owners:', error.message);
    return new Map();
  }

  return new Map((data || []).map((row: any) => [String(row.id), row as UserRow]));
}

async function loadPlaylistSongRows(playlistIds: string[]): Promise<PlaylistSongRow[]> {
  if (playlistIds.length === 0) return [];

  const { data, error } = await publicSupabase
    .from('playlist_songs')
    .select('playlist_id,song_id')
    .in('playlist_id', playlistIds)
    .limit(4000);

  if (error) {
    console.warn('⚠️ [userPlaylistsAdminApi] Error loading playlist_songs:', error.message);
    return [];
  }

  return (data || []) as PlaylistSongRow[];
}

function countSongsByPlaylist(rows: PlaylistSongRow[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const playlistId = String(row.playlist_id || '');
    if (!playlistId) continue;
    counts.set(playlistId, (counts.get(playlistId) || 0) + 1);
  }

  return counts;
}

async function loadHymnsById(songIds: string[]): Promise<Map<string, HymnRow>> {
  if (songIds.length === 0) return new Map();

  const { data, error } = await publicSupabase
    .from('hinos')
    .select('id,numero,titulo,title')
    .in('id', songIds)
    .limit(4000);

  if (error) {
    console.warn('⚠️ [userPlaylistsAdminApi] Error loading hymns:', error.message);
    return new Map();
  }

  return new Map((data || []).map((row: any) => [String(row.id), row as HymnRow]));
}

export async function getAllUserPlaylists(): Promise<Playlist[]> {
  const { data, error } = await publicSupabase
    .from('playlists')
    .select(PLAYLIST_SELECT)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  const playlistRows = (data || []) as PlaylistRow[];
  const playlistIds = playlistRows.map((row) => String(row.id));
  const userIds = Array.from(new Set(playlistRows.map((row) => String(row.user_id || '')).filter(Boolean)));

  const [usersById, playlistSongRows] = await Promise.all([
    loadUsersById(userIds),
    loadPlaylistSongRows(playlistIds),
  ]);

  const songCountsByPlaylistId = countSongsByPlaylist(playlistSongRows);

  return playlistRows.map((row) => mapPlaylistRow(row, usersById, songCountsByPlaylistId));
}

export async function getUserPlaylistById(id: string): Promise<PlaylistWithDetails | null> {
  const { data, error } = await publicSupabase
    .from('playlists')
    .select(PLAYLIST_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const playlistRow = data as PlaylistRow;
  const playlistId = String(playlistRow.id);
  const ownerId = String(playlistRow.user_id || '');

  const [usersById, playlistSongRows] = await Promise.all([
    loadUsersById(ownerId ? [ownerId] : []),
    loadPlaylistSongRows([playlistId]),
  ]);

  const songCountsByPlaylistId = countSongsByPlaylist(playlistSongRows);
  const songIds = Array.from(
    new Set(playlistSongRows.map((row) => String(row.song_id || '')).filter(Boolean))
  );
  const hymnsById = await loadHymnsById(songIds);

  return {
    ...mapPlaylistRow(playlistRow, usersById, songCountsByPlaylistId),
    songs: playlistSongRows.map((row) => {
      const songId = String(row.song_id || '');
      const hymn = hymnsById.get(songId);
      return {
        id: songId,
        song_id: songId,
        song_title: hymn?.titulo || hymn?.title || `Hino ${songId}`,
        song_number: hymn?.numero != null ? String(hymn.numero) : null,
      };
    }),
  };
}

export async function updateUserPlaylist(
  id: string,
  data: Partial<Pick<Playlist, 'name' | 'description' | 'cover_url' | 'is_public'>>
): Promise<{ success: boolean }> {
  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.cover_url !== undefined) payload.cover_url = data.cover_url;
  if (data.is_public !== undefined) payload.is_public = data.is_public;

  if (Object.keys(payload).length === 0) {
    return { success: true };
  }

  await supabaseUpdate('playlists', { id: `eq.${id}` }, payload);
  return { success: true };
}

export async function toggleUserPlaylistVisibility(
  id: string,
  isPublic: boolean
): Promise<{ success: boolean }> {
  return updateUserPlaylist(id, { is_public: isPublic });
}

export async function deleteUserPlaylist(id: string): Promise<{ success: boolean }> {
  await supabaseDelete('playlist_songs', { playlist_id: `eq.${id}` }).catch(() => null);
  await supabaseDelete('playlists', { id: `eq.${id}` });
  return { success: true };
}

export async function removeSongFromUserPlaylist(
  playlistId: string,
  songId: string
): Promise<{ success: boolean }> {
  await supabaseDelete('playlist_songs', {
    playlist_id: `eq.${playlistId}`,
    song_id: `eq.${songId}`,
  });
  return { success: true };
}
