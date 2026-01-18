import { supabase } from '@/lib/supabase-auth';

export interface PlaylistDTO {
  id: string;
  user_id: number;
  name: string;
  description?: string;
  cover_url?: string;
  is_public: number;
  created_at: string;
  updated_at: string;
  tracks: Array<{
    id: string;
    title: string;
    artist: string;
    duration?: string;
    cover_url?: string;
    position?: number | null;
    created_at: string;
  }>;
}

export async function list(userId: number): Promise<PlaylistDTO[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select(`
      *,
      playlist_tracks (
        id,
        track_id,
        title,
        artist,
        duration,
        cover_url,
        position,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map(p => ({
    id: String(p.id),
    user_id: p.user_id,
    name: p.name,
    description: p.description,
    cover_url: p.cover_url,
    is_public: p.is_public,
    created_at: p.created_at,
    updated_at: p.updated_at,
    tracks: (p.playlist_tracks || []).map((t: any) => ({
      id: String(t.track_id),
      title: t.title,
      artist: t.artist,
      duration: t.duration,
      cover_url: t.cover_url,
      position: t.position,
      created_at: t.created_at
    }))
  }));
}

export async function get(id: string | number): Promise<PlaylistDTO> {
  const { data, error } = await supabase
    .from('playlists')
    .select(`
      *,
      playlist_tracks (
        id,
        track_id,
        title,
        artist,
        duration,
        cover_url,
        position,
        created_at
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Playlist não encontrada');

  return {
    id: String(data.id),
    user_id: data.user_id,
    name: data.name,
    description: data.description,
    cover_url: data.cover_url,
    is_public: data.is_public,
    created_at: data.created_at,
    updated_at: data.updated_at,
    tracks: (data.playlist_tracks || []).map((t: any) => ({
      id: String(t.track_id),
      title: t.title,
      artist: t.artist,
      duration: t.duration,
      cover_url: t.cover_url,
      position: t.position,
      created_at: t.created_at
    }))
  };
}

export async function create(input: { userId: number; name: string; description?: string; coverUrl?: string; isPublic?: boolean; }): Promise<PlaylistDTO> {
  const { data, error } = await supabase
    .from('playlists')
    .insert({
      user_id: input.userId,
      name: input.name,
      description: input.description || '',
      cover_url: input.coverUrl || '',
      is_public: input.isPublic === false ? 0 : 1,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Erro ao criar playlist');

  return {
    id: String(data.id),
    user_id: data.user_id,
    name: data.name,
    description: data.description,
    cover_url: data.cover_url,
    is_public: data.is_public,
    created_at: data.created_at,
    updated_at: data.updated_at,
    tracks: []
  };
}

export async function addTrack(input: { playlistId: string | number; trackId: string | number; title: string; artist: string; duration?: string; coverUrl?: string; position?: number; }) {
  const { data, error } = await supabase
    .from('playlist_tracks')
    .insert({
      playlist_id: Number(input.playlistId),
      track_id: String(input.trackId),
      title: input.title,
      artist: input.artist,
      duration: input.duration || '0:00',
      cover_url: input.coverUrl || '',
      position: input.position || 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function removeTrack(input: { playlistId: string | number; trackId: string | number; }) {
  const { error } = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('playlist_id', Number(input.playlistId))
    .eq('track_id', String(input.trackId));

  if (error) throw new Error(error.message);
  return { success: true };
}
