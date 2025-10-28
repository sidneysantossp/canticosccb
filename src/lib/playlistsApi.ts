// STUB temporário
const API = '/api/playlists';

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
  const res = await fetch(`${API}/list.php?user_id=${userId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao listar playlists');
  return data.playlists as PlaylistDTO[];
}

export async function get(id: string | number): Promise<PlaylistDTO> {
  const res = await fetch(`${API}/get.php?id=${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao carregar playlist');
  return data.playlist as PlaylistDTO;
}

export async function create(input: { userId: number; name: string; description?: string; coverUrl?: string; isPublic?: boolean; }): Promise<PlaylistDTO> {
  const res = await fetch(`${API}/create.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: input.userId,
      name: input.name,
      description: input.description,
      cover_url: input.coverUrl,
      is_public: input.isPublic === false ? 0 : 1,
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao criar playlist');
  return data.playlist as PlaylistDTO;
}

export async function addTrack(input: { playlistId: string | number; trackId: string | number; title: string; artist: string; duration?: string; coverUrl?: string; position?: number; }) {
  const res = await fetch(`${API}/add-track.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playlist_id: Number(input.playlistId),
      track_id: String(input.trackId),
      title: input.title,
      artist: input.artist,
      duration: input.duration,
      cover_url: input.coverUrl,
      position: input.position,
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao adicionar faixa');
  return data.track;
}

export async function removeTrack(input: { playlistId: string | number; trackId: string | number; }) {
  const res = await fetch(`${API}/remove-track.php`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playlist_id: Number(input.playlistId),
      track_id: String(input.trackId),
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao remover faixa');
  return data;
}
