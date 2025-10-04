import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Song = Database['public']['Tables']['songs']['Row'];
type SongInsert = Database['public']['Tables']['songs']['Insert'];
type SongUpdate = Database['public']['Tables']['songs']['Update'];

/**
 * Service for managing songs
 */
export class SongsService {
  /**
   * Get all songs with optional filters
   */
  static async getSongs(options?: {
    category?: string;
    artistId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from('songs')
      .select(`
        *,
        artists (
          id,
          name,
          image_url,
          verified
        ),
        albums (
          id,
          title,
          cover_url
        )
      `)
      .eq('is_available', true);

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.artistId) {
      query = query.eq('artist_id', options.artistId);
    }

    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,lyrics.ilike.%${options.search}%`);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    query = query.order('plays_count', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Get a single song by ID
   */
  static async getSongById(id: string) {
    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        artists (*),
        albums (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get popular songs
   */
  static async getPopularSongs(limit = 10) {
    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        artists (
          id,
          name,
          image_url
        )
      `)
      .eq('is_available', true)
      .order('plays_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Get songs by category
   */
  static async getSongsByCategory(category: string, limit = 20) {
    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        artists (
          id,
          name,
          image_url
        ),
        albums (
          id,
          title,
          cover_url
        )
      `)
      .eq('category', category)
      .eq('is_available', true)
      .order('plays_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Increment play count
   */
  static async incrementPlayCount(songId: string) {
    const { error } = await supabase.rpc('increment_play_count', {
      song_uuid: songId,
    });

    if (error) throw error;
  }

  /**
   * Search songs
   */
  static async searchSongs(query: string, limit = 20) {
    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        artists (
          id,
          name,
          image_url
        )
      `)
      .or(`title.ilike.%${query}%,lyrics.ilike.%${query}%`)
      .eq('is_available', true)
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Get recommended songs based on user preferences
   */
  static async getRecommendedSongs(userId: string, limit = 10) {
    // Get user's liked songs categories
    const { data: likedSongs } = await supabase
      .from('liked_songs')
      .select(`
        songs (
          category
        )
      `)
      .eq('user_id', userId);

    // Extract categories
    const categories = likedSongs
      ?.map((item: any) => item.songs?.category)
      .filter(Boolean) || [];

    const uniqueCategories = [...new Set(categories)];

    if (uniqueCategories.length === 0) {
      // If no liked songs, return popular songs
      return this.getPopularSongs(limit);
    }

    // Get songs from liked categories
    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        artists (
          id,
          name,
          image_url
        )
      `)
      .in('category', uniqueCategories)
      .eq('is_available', true)
      .order('plays_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Create new song (admin only)
   */
  static async createSong(song: SongInsert) {
    const { data, error } = await supabase
      .from('songs')
      .insert(song)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update song (admin only)
   */
  static async updateSong(id: string, updates: SongUpdate) {
    const { data, error } = await supabase
      .from('songs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete song (admin only)
   */
  static async deleteSong(id: string) {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export default SongsService;
