import { supabase } from '@/lib/supabase-auth';

type PlaylistRow = {
  id: string | number;
  user_id: string | number;
  name?: string | null;
  description?: string | null;
  cover_url?: string | null;
  is_public?: boolean | number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PlaylistRelationRow = {
  playlist_id?: string | number | null;
  song_id?: string | number | null;
  track_id?: string | number | null;
  hino_id?: string | number | null;
  created_at?: string | null;
  position?: number | null;
  lookup_field?: 'id' | 'numero';
};

type HymnRow = {
  id: string | number;
  titulo?: string | null;
  title?: string | null;
  compositor_nome?: string | null;
  duracao?: string | number | null;
  cover_url?: string | null;
  categoria?: string | null;
  numero?: string | number | null;
  audio_url?: string | null;
  youtube_source?: string | null;
};

export interface PlaylistDTOTrack {
  id: string;
  title: string;
  artist: string;
  duration?: string;
  cover_url?: string;
  position?: number | null;
  created_at: string;
  number?: number;
  category?: string;
  audio_url?: string;
  youtube_source?: string;
}

export interface PlaylistDTO {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  tracks: PlaylistDTOTrack[];
}

const PLAYLIST_SELECT = 'id,user_id,name,description,cover_url,is_public,created_at,updated_at';

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

function toDurationString(value: unknown): string {
  if (value == null) return '0:00';
  if (typeof value === 'number' && Number.isFinite(value)) {
    const seconds = Math.max(0, Math.floor(value));
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }

  const text = String(value).trim();
  if (!text) return '0:00';
  if (text.includes(':')) return text;

  const numeric = Number(text);
  if (!Number.isNaN(numeric)) {
    return toDurationString(numeric);
  }

  return text;
}

function toTrackNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeDbId(value: unknown): string | number {
  const text = String(value ?? '').trim();
  if (!text) return '';

  const numeric = Number(text);
  if (Number.isFinite(numeric) && String(numeric) === text) {
    return numeric;
  }

  return text;
}

function mapRelationRows(
  rows: PlaylistRelationRow[],
  field: 'song_id' | 'track_id' | 'hino_id',
  lookupField: 'id' | 'numero',
  createdAtField: 'created_at' | 'added_at' = 'created_at'
): PlaylistRelationRow[] {
  return rows.map((row) => ({
    playlist_id: row.playlist_id,
    song_id: row[field],
    created_at: (row as any)[createdAtField] ?? row.created_at,
    position: row.position,
    lookup_field: lookupField,
  }));
}

async function loadPlaylistRelations(playlistIds: string[]): Promise<PlaylistRelationRow[]> {
  if (playlistIds.length === 0) return [];

  const [playlistHinos, current, legacy] = await Promise.all([
    supabase
      .from('playlist_hinos')
      .select('playlist_id,hino_id,position,created_at')
      .in('playlist_id', playlistIds),
    supabase
      .from('playlist_songs')
      .select('playlist_id,song_id,position,added_at')
      .in('playlist_id', playlistIds),
    supabase
      .from('playlist_tracks')
      .select('playlist_id,track_id,position,created_at')
      .in('playlist_id', playlistIds),
  ]);

  const relationRows: PlaylistRelationRow[] = [];
  const seen = new Set<string>();
  const collectRows = (rows: PlaylistRelationRow[]) => {
    for (const row of rows) {
      const key = `${row.playlist_id}:${row.song_id}:${row.position ?? ''}:${row.created_at ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      relationRows.push(row);
    }
  };

  if (!playlistHinos.error) {
    collectRows(mapRelationRows((playlistHinos.data || []) as PlaylistRelationRow[], 'hino_id', 'numero'));
  }

  if (!current.error) {
    collectRows(mapRelationRows((current.data || []) as PlaylistRelationRow[], 'song_id', 'id', 'added_at'));
  }

  if (!legacy.error) {
    collectRows(mapRelationRows((legacy.data || []) as PlaylistRelationRow[], 'track_id', 'id'));
  }

  if (relationRows.length > 0) {
    return relationRows;
  }

  const firstError = playlistHinos.error || current.error || legacy.error;
  if (firstError) {
    throw new Error(firstError.message);
  }

  return [];
}

async function loadHymnsByIds(songIds: string[]): Promise<Map<string, HymnRow>> {
  if (songIds.length === 0) return new Map();

  const normalizedIds = songIds.map((id) => normalizeDbId(id));

  const { data, error } = await supabase
    .from('hinos')
    .select('id,titulo,title,compositor_nome,duracao,cover_url,categoria,numero,audio_url,youtube_source')
    .in('id', normalizedIds)
    .limit(4000);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data || []).map((row: any) => [String(row.id), row as HymnRow]));
}

async function loadHymnsByNumbers(songNumbers: string[]): Promise<Map<string, HymnRow>> {
  if (songNumbers.length === 0) return new Map();

  const normalizedNumbers = songNumbers
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  if (normalizedNumbers.length === 0) return new Map();

  const { data, error } = await supabase
    .from('hinos')
    .select('id,titulo,title,compositor_nome,duracao,cover_url,categoria,numero,audio_url,youtube_source')
    .in('numero', normalizedNumbers)
    .limit(4000);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data || []).map((row: any) => [String(row.numero), row as HymnRow]));
}

async function createPlaylistSongRelation(input: {
  playlistId: string | number;
  trackId: string | number;
  position?: number;
}) {
  const normalizedId = normalizeDbId(input.trackId);
  const playlistHino = await supabase
    .from('playlist_hinos')
    .insert({
      playlist_id: String(input.playlistId),
      hino_id: normalizedId,
      position: input.position || 0,
    })
    .select()
    .single();

  if (!playlistHino.error) {
    return playlistHino.data;
  }

  const current = await supabase
    .from('playlist_songs')
    .insert({
      playlist_id: String(input.playlistId),
      song_id: String(input.trackId),
      position: input.position || 0,
    })
    .select()
    .single();

  if (!current.error) {
    return current.data;
  }

  const legacy = await supabase
    .from('playlist_tracks')
    .insert({
      playlist_id: String(input.playlistId),
      track_id: String(input.trackId),
      position: input.position || 0,
    })
    .select()
    .single();

  if (legacy.error) {
    throw new Error(playlistHino.error?.message || current.error?.message || legacy.error.message);
  }

  return legacy.data;
}

function mapTracksForPlaylist(
  playlistId: string,
  relationRows: PlaylistRelationRow[],
  hymnsById: Map<string, HymnRow>
): PlaylistDTOTrack[] {
  return relationRows
    .filter((row) => String(row.playlist_id || '') === playlistId)
    .map((row, index) => {
      const songId = String(row.song_id || '');
      const hymn = hymnsById.get(songId);
      const resolvedId = String(hymn?.id || songId);

      return {
        id: resolvedId,
        title: hymn?.titulo || hymn?.title || `Hino ${songId}`,
        artist: hymn?.compositor_nome || 'Cânticos CCB',
        duration: toDurationString(hymn?.duracao),
        cover_url: hymn?.cover_url || '',
        position: row.position ?? index + 1,
        created_at: row.created_at || new Date().toISOString(),
        number: toTrackNumber(hymn?.numero),
        category: hymn?.categoria || 'playlist',
        audio_url: hymn?.audio_url || undefined,
        youtube_source: hymn?.youtube_source || undefined,
      };
    });
}

async function mapPlaylistRows(rows: PlaylistRow[]): Promise<PlaylistDTO[]> {
  if (rows.length === 0) return [];

  const playlistIds = rows.map((row) => String(row.id));
  const relationRows = await loadPlaylistRelations(playlistIds);
  const hymnIds = Array.from(
    new Set(
      relationRows
        .filter((row) => row.lookup_field !== 'numero')
        .map((row) => String(row.song_id || ''))
        .filter(Boolean)
    )
  );
  const hymnNumbers = Array.from(
    new Set(
      relationRows
        .filter((row) => row.lookup_field === 'numero')
        .map((row) => String(row.song_id || ''))
        .filter(Boolean)
    )
  );
  const [hymnsById, hymnsByNumber] = await Promise.all([
    loadHymnsByIds(hymnIds),
    loadHymnsByNumbers(hymnNumbers),
  ]);

  return rows.map((row) => {
    const playlistId = String(row.id);
    return {
      id: playlistId,
      user_id: String(row.user_id),
      name: row.name || 'Playlist sem nome',
      description: row.description || undefined,
      cover_url: row.cover_url || undefined,
      is_public: toBoolean(row.is_public),
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || row.created_at || new Date().toISOString(),
      tracks: mapTracksForPlaylist(playlistId, relationRows, new Map([
        ...Array.from(hymnsById.entries()),
        ...Array.from(hymnsByNumber.entries()),
      ])),
    };
  });
}

export async function list(userId: string | number): Promise<PlaylistDTO[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select(PLAYLIST_SELECT)
    .eq('user_id', String(userId))
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return mapPlaylistRows((data || []) as PlaylistRow[]);
}

export async function get(id: string | number): Promise<PlaylistDTO> {
  const { data, error } = await supabase
    .from('playlists')
    .select(PLAYLIST_SELECT)
    .eq('id', String(id))
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Playlist não encontrada');

  const [playlist] = await mapPlaylistRows([data as PlaylistRow]);
  if (!playlist) throw new Error('Playlist não encontrada');
  return playlist;
}

export async function create(input: {
  userId: string | number;
  name: string;
  description?: string;
  coverUrl?: string;
  isPublic?: boolean;
}): Promise<PlaylistDTO> {
  const { data, error } = await supabase
    .from('playlists')
    .insert({
      user_id: String(input.userId),
      name: input.name,
      description: input.description || '',
      cover_url: input.coverUrl || '',
      is_public: input.isPublic !== false,
    })
    .select(PLAYLIST_SELECT)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Erro ao criar playlist');

  const [playlist] = await mapPlaylistRows([data as PlaylistRow]);
  if (!playlist) throw new Error('Erro ao criar playlist');
  return playlist;
}

export async function addTrack(input: {
  playlistId: string | number;
  trackId: string | number;
  title?: string;
  artist?: string;
  duration?: string;
  coverUrl?: string;
  position?: number;
}) {
  return createPlaylistSongRelation(input);
}

export async function removeTrack(input: {
  playlistId: string | number;
  trackId: string | number;
}) {
  const normalizedId = normalizeDbId(input.trackId);
  const [playlistHinos, current, legacy] = await Promise.all([
    supabase
      .from('playlist_hinos')
      .delete()
      .eq('playlist_id', String(input.playlistId))
      .eq('hino_id', normalizedId),
    supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', String(input.playlistId))
      .eq('song_id', String(input.trackId)),
    supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', String(input.playlistId))
      .eq('track_id', String(input.trackId)),
  ]);

  if (playlistHinos.error && current.error && legacy.error) {
    throw new Error(playlistHinos.error.message || current.error.message || legacy.error.message);
  }

  return { success: true };
}
