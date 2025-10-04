import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Playlist = Database['public']['Tables']['playlists']['Row'];
type PlaylistInsert = Database['public']['Tables']['playlists']['Insert'];
type PlaylistUpdate = Database['public']['Tables']['playlists']['Update'];

/**
 * Service for managing playlists
 */
export class PlaylistsService {
  /**
   * Get user's playlists
   */
  static async getUserPlaylists(userId: string) {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get playlist by ID with songs
   */
  static async getPlaylistById(id: string) {
    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_songs (
          id,
          position,
          added_at,
          songs (
            *,
            artists (
              id,
              name,
              image_url
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Sort songs by position
    if (data?.playlist_songs) {
      data.playlist_songs.sort((a, b) => a.position - b.position);
    }

    return data;
  }

  /**
   * Create new playlist
   */
  static async createPlaylist(playlist: PlaylistInsert) {
    const { data, error } = await supabase
      .from('playlists')
      .insert(playlist)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update playlist
   */
  static async updatePlaylist(id: string, updates: PlaylistUpdate) {
    const { data, error } = await supabase
      .from('playlists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete playlist
   */
  static async deletePlaylist(id: string) {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Add song to playlist
   */
  static async addSongToPlaylist(playlistId: string, songId: string, userId: string) {
    // Get current max position
    const { data: songs } = await supabase
      .from('playlist_songs')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = songs && songs.length > 0 ? songs[0].position + 1 : 0;

    // Add song
    const { error } = await supabase
      .from('playlist_songs')
      .insert({
        playlist_id: playlistId,
        song_id: songId,
        position: nextPosition,
        added_by: userId,
      });

    if (error) throw error;

    // Update playlist stats
    await supabase.rpc('update_playlist_stats', {
      playlist_uuid: playlistId,
    });
  }

  /**
   * Remove song from playlist
   */
  static async removeSongFromPlaylist(playlistId: string, songId: string) {
    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('song_id', songId);

    if (error) throw error;

    // Update playlist stats
    await supabase.rpc('update_playlist_stats', {
      playlist_uuid: playlistId,
    });
  }

  /**
   * Reorder songs in playlist
   */
  static async reorderPlaylistSongs(
    playlistId: string,
    songIds: string[]
  ) {
    // Update positions
    const updates = songIds.map((songId, index) => ({
      playlist_id: playlistId,
      song_id: songId,
      position: index,
    }));

    // Delete all current positions
    await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId);

    // Insert new positions
    const { error } = await supabase
      .from('playlist_songs')
      .insert(updates);

    if (error) throw error;
  }

  /**
   * Get public playlists
   */
  static async getPublicPlaylists(limit = 20) {
    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        profiles (
          id,
          name,
          avatar_url
        )
      `)
      .eq('privacy', 'public')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Search playlists
   */
  static async searchPlaylists(query: string, limit = 20) {
    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        profiles (
          id,
          name,
          avatar_url
        )
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('privacy', 'public')
      .limit(limit);

    if (error) throw error;
    return data;
  }
}

export default PlaylistsService;
