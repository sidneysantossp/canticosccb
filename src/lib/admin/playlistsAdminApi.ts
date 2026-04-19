import { getCurrentUser, publicSupabase, supabase } from '@/lib/supabase-auth';
import { upsertSiteConfigEntries } from '@/lib/admin/adminTableUtils';
import { supabaseDelete, supabaseInsert, supabaseUpdate } from '@/lib/supabaseRest';
import { getEmergencyEditorialPlaylists, getEmergencyPlaylistById, isSupabaseQuotaRestrictionErrorMessage } from '@/lib/emergencyCatalog';
import {
  EDITORIAL_PLAYLISTS_CONFIG_KEY,
  getEditorialPlaylistMetadataMap,
  invalidateSiteRuntimeConfigCache,
  type EditorialPlaylistMetadata,
} from '@/lib/publicSiteConfig';

export interface EditorialPlaylist {
  id: string;
  title: string;
  description: string;
  category: string;
  mood?: string;
  curator_name: string;
  cover_url: string;
  is_featured: boolean;
  is_active: boolean;
  plays_count: number;
  likes_count: number;
  followers_count: number;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePlaylistData {
  title: string;
  description?: string;
  category: string;
  mood?: string;
  curator_name?: string;
  cover_url?: string;
  is_featured?: boolean;
  is_active?: boolean;
}

type PlaylistRow = {
  id: string;
  user_id?: string | null;
  name?: string | null;
  description?: string | null;
  cover_url?: string | null;
  is_public?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const PLAYLIST_SELECT = 'id,user_id,name,description,cover_url,is_public,created_at,updated_at';

const defaultMetadata = (playlistId: string): EditorialPlaylistMetadata => {
  const now = new Date().toISOString();
  return {
    playlist_id: playlistId,
    category: 'special',
    mood: undefined,
    curator_name: 'Equipe Editorial CCB',
    is_featured: false,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
};

const mapRowToEditorialPlaylist = (
  row: PlaylistRow,
  metadata: EditorialPlaylistMetadata,
  itemsCount: number
): EditorialPlaylist => ({
  id: String(row.id),
  title: row.name || 'Playlist sem título',
  description: row.description || '',
  category: metadata.category,
  mood: metadata.mood,
  curator_name: metadata.curator_name,
  cover_url: row.cover_url || '',
  is_featured: metadata.is_featured,
  is_active: metadata.is_active,
  plays_count: 0,
  likes_count: 0,
  followers_count: 0,
  items_count: itemsCount,
  created_at: row.created_at || metadata.created_at,
  updated_at: row.updated_at || metadata.updated_at,
});

const sortEditorialPlaylists = (a: EditorialPlaylist, b: EditorialPlaylist) => {
  if (a.is_featured !== b.is_featured) {
    return a.is_featured ? -1 : 1;
  }
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
};

function isRestrictedSupabaseError(error: unknown): boolean {
  return isSupabaseQuotaRestrictionErrorMessage(String((error as any)?.message || error || ''));
}

async function loadMetadataMap(): Promise<Record<string, EditorialPlaylistMetadata>> {
  return getEditorialPlaylistMetadataMap();
}

async function saveMetadataMap(map: Record<string, EditorialPlaylistMetadata>) {
  await upsertSiteConfigEntries({
    [EDITORIAL_PLAYLISTS_CONFIG_KEY]: JSON.stringify(Object.values(map)),
  });
  invalidateSiteRuntimeConfigCache();
}

async function loadTrackCounts(playlistIds: string[]): Promise<Record<string, number>> {
  if (playlistIds.length === 0) return {};

  const { data, error } = await publicSupabase
    .from('playlist_tracks')
    .select('playlist_id')
    .in('playlist_id', playlistIds);

  if (error) {
    console.warn('⚠️ [playlistsAdminApi] Error loading playlist tracks:', error.message);
    return {};
  }

  return (data || []).reduce<Record<string, number>>((acc, row: any) => {
    const key = String(row.playlist_id);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

async function resolveCurrentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const sessionUserId = data.session?.user?.id;
  if (sessionUserId) return sessionUserId;

  const localUser = getCurrentUser();
  if (localUser?.id) return localUser.id;

  throw new Error('Não foi possível identificar o administrador atual para criar a playlist.');
}

export type Playlist = EditorialPlaylist;

export const getAll = async (): Promise<EditorialPlaylist[]> => {
  try {
    const [metadataMap, rowsResponse] = await Promise.all([
      loadMetadataMap(),
      publicSupabase.from('playlists').select(PLAYLIST_SELECT).order('updated_at', { ascending: false }),
    ]);

    if (rowsResponse.error) {
      if (isRestrictedSupabaseError(rowsResponse.error)) {
        const emergencyPlaylists = await getEmergencyEditorialPlaylists();
        return emergencyPlaylists.map((playlist) => ({
          id: playlist.id,
          title: playlist.name,
          description: playlist.description || '',
          category: 'special',
          mood: undefined,
          curator_name: 'Equipe Editorial CCB',
          cover_url: playlist.cover_url || '',
          is_featured: false,
          is_active: true,
          plays_count: 0,
          likes_count: 0,
          followers_count: 0,
          items_count: 0,
          created_at: playlist.created_at,
          updated_at: playlist.updated_at,
        }));
      }
      throw rowsResponse.error;
    }

    const rows = (rowsResponse.data || []) as PlaylistRow[];
    const editorialRows = rows.filter((row) => metadataMap[String(row.id)]);
    const trackCounts = await loadTrackCounts(editorialRows.map((row) => String(row.id)));

    return editorialRows
      .map((row) =>
        mapRowToEditorialPlaylist(
          row,
          metadataMap[String(row.id)] || defaultMetadata(String(row.id)),
          trackCounts[String(row.id)] || 0
        )
      )
      .sort(sortEditorialPlaylists);
  } catch (error) {
    console.error('❌ [playlistsAdminApi] Error fetching playlists:', error);
    return [];
  }
};

export const getAllPlaylists = getAll;

export const getById = async (id: string): Promise<EditorialPlaylist | null> => {
  try {
    const [metadataMap, playlistResponse, trackCountResponse] = await Promise.all([
      loadMetadataMap(),
      publicSupabase.from('playlists').select(PLAYLIST_SELECT).eq('id', id).maybeSingle(),
      publicSupabase.from('playlist_tracks').select('playlist_id').eq('playlist_id', id),
    ]);

    if (playlistResponse.error) {
      if (isRestrictedSupabaseError(playlistResponse.error)) {
        const playlist = await getEmergencyPlaylistById(id);
        if (!playlist) return null;
        return {
          id: playlist.id,
          title: playlist.name,
          description: playlist.description || '',
          category: 'special',
          mood: undefined,
          curator_name: 'Equipe Editorial CCB',
          cover_url: playlist.cover_url || '',
          is_featured: false,
          is_active: true,
          plays_count: 0,
          likes_count: 0,
          followers_count: 0,
          items_count: 0,
          created_at: playlist.created_at,
          updated_at: playlist.updated_at,
        };
      }
      throw playlistResponse.error;
    }

    if (!playlistResponse.data || !metadataMap[id]) {
      return null;
    }

    return mapRowToEditorialPlaylist(
      playlistResponse.data as PlaylistRow,
      metadataMap[id],
      trackCountResponse.data?.length || 0
    );
  } catch (error) {
    console.error('❌ [playlistsAdminApi.getById] Error:', error);
    return null;
  }
};

export const create = async (
  data: CreatePlaylistData
): Promise<{ success: boolean; playlist?: EditorialPlaylist }> => {
  try {
    const ownerId = await resolveCurrentUserId();
    const result = await supabaseInsert<any>('playlists', {
      user_id: ownerId,
      name: data.title.trim(),
      description: data.description || '',
      cover_url: data.cover_url || '',
      is_public: true,
    });

    const playlistId = String(result?.id || '');
    if (!playlistId) {
      throw new Error('Falha ao criar a playlist editorial.');
    }

    const metadataMap = await loadMetadataMap();
    const now = new Date().toISOString();
    metadataMap[playlistId] = {
      playlist_id: playlistId,
      category: data.category,
      mood: data.mood || undefined,
      curator_name: (data.curator_name || 'Equipe Editorial CCB').trim(),
      is_featured: Boolean(data.is_featured),
      is_active: data.is_active !== false,
      created_at: now,
      updated_at: now,
    };
    await saveMetadataMap(metadataMap);

    return {
      success: true,
      playlist: mapRowToEditorialPlaylist(
        {
          id: playlistId,
          user_id: ownerId,
          name: data.title.trim(),
          description: data.description || '',
          cover_url: data.cover_url || '',
          is_public: true,
          created_at: now,
          updated_at: now,
        },
        metadataMap[playlistId],
        0
      ),
    };
  } catch (error) {
    console.error('❌ [playlistsAdminApi.create] Error:', error);
    throw error;
  }
};

export const createPlaylist = create;

export const update = async (
  id: string,
  data: Partial<EditorialPlaylist>
): Promise<{ success: boolean }> => {
  try {
    const playlistPayload: Record<string, unknown> = {};
    if (data.title !== undefined) playlistPayload.name = data.title;
    if (data.description !== undefined) playlistPayload.description = data.description;
    if (data.cover_url !== undefined) playlistPayload.cover_url = data.cover_url;

    if (Object.keys(playlistPayload).length > 0) {
      await supabaseUpdate('playlists', { id: `eq.${id}` }, playlistPayload);
    }

    const metadataMap = await loadMetadataMap();
    const currentMetadata = metadataMap[id] || defaultMetadata(id);
    metadataMap[id] = {
      ...currentMetadata,
      category: data.category ?? currentMetadata.category,
      mood: data.mood !== undefined ? data.mood || undefined : currentMetadata.mood,
      curator_name: data.curator_name ?? currentMetadata.curator_name,
      is_featured: data.is_featured ?? currentMetadata.is_featured,
      is_active: data.is_active ?? currentMetadata.is_active,
      updated_at: new Date().toISOString(),
    };
    await saveMetadataMap(metadataMap);

    return { success: true };
  } catch (error) {
    console.error('❌ [playlistsAdminApi.update] Error:', error);
    return { success: false };
  }
};

export const updatePlaylist = update;

export const deleteItem = async (id: string): Promise<{ success: boolean }> => {
  try {
    await supabaseDelete('playlists', { id: `eq.${id}` });

    const metadataMap = await loadMetadataMap();
    delete metadataMap[id];
    await saveMetadataMap(metadataMap);

    return { success: true };
  } catch (error) {
    console.error('❌ [playlistsAdminApi.deleteItem] Error:', error);
    return { success: false };
  }
};

export const deletePlaylist = deleteItem;
export const getSiteSettings = async (...args: any[]) => ({});
export const updateSiteSettings = async (...args: any[]) => ({ success: true });
export const getComments = async (...args: any[]) => [];
export const deleteComment = async (...args: any[]) => ({ success: true });
export const approveComment = async (...args: any[]) => ({ success: true });
export const getClaims = async (...args: any[]) => [];
export const getCopyrightClaims = async (...args: any[]) => [];
export const updateClaim = async (...args: any[]) => ({ success: true });
export const getRoyalties = async (...args: any[]) => [];
export const processPayment = async (...args: any[]) => ({ success: true });
export type SiteSettings = any;
export type Comment = any;
export type Claim = any;
export type CopyrightClaim = any;
export type Royalty = any;
