import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];

/**
 * Hook to fetch data from Supabase
 */
export function useSupabaseQuery<T extends keyof Tables>(
  table: T,
  options?: {
    select?: string;
    filter?: any;
    orderBy?: string;
    limit?: number;
  }
) {
  const [data, setData] = useState<Tables[T]['Row'][] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let query = supabase.from(table).select(options?.select || '*');

        if (options?.filter) {
          Object.entries(options.filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (options?.orderBy) {
          query = query.order(options.orderBy);
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data: result, error: queryError } = await query;

        if (queryError) throw queryError;
        setData(result as Tables[T]['Row'][]);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table, JSON.stringify(options)]);

  return { data, loading, error };
}

/**
 * Hook for authentication state
 */
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

/**
 * Hook to fetch user profile
 */
export function useUserProfile(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data, loading, error } = useSupabaseQuery('profiles', {
    filter: { id: targetUserId },
  });

  return {
    profile: data?.[0] || null,
    loading,
    error,
  };
}

/**
 * Hook to fetch user's liked songs
 */
export function useLikedSongs() {
  const { user } = useAuth();
  const [likedSongs, setLikedSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLikedSongs([]);
      setLoading(false);
      return;
    }

    const fetchLikedSongs = async () => {
      try {
        setLoading(true);
        const { data, error: queryError } = await supabase
          .from('liked_songs')
          .select(`
            *,
            songs (*)
          `)
          .eq('user_id', user.id)
          .order('liked_at', { ascending: false });

        if (queryError) throw queryError;
        setLikedSongs(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedSongs();
  }, [user]);

  const likeSong = async (songId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('liked_songs')
      .insert({ user_id: user.id, song_id: songId });

    if (!error) {
      // Refresh liked songs
      const { data } = await supabase
        .from('liked_songs')
        .select(`*, songs (*)`)
        .eq('user_id', user.id)
        .order('liked_at', { ascending: false });
      setLikedSongs(data || []);
    }
  };

  const unlikeSong = async (songId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('liked_songs')
      .delete()
      .eq('user_id', user.id)
      .eq('song_id', songId);

    if (!error) {
      // Refresh liked songs
      const { data } = await supabase
        .from('liked_songs')
        .select(`*, songs (*)`)
        .eq('user_id', user.id)
        .order('liked_at', { ascending: false });
      setLikedSongs(data || []);
    }
  };

  return { likedSongs, loading, error, likeSong, unlikeSong };
}

/**
 * Hook to fetch user's playlists
 */
export function useUserPlaylists() {
  const { user } = useAuth();

  const { data, loading, error } = useSupabaseQuery('playlists', {
    filter: user ? { user_id: user.id } : undefined,
    orderBy: 'created_at',
  });

  return {
    playlists: data || [],
    loading,
    error,
  };
}

/**
 * Hook to fetch songs with filters
 */
export function useSongs(options?: {
  category?: string;
  artistId?: string;
  limit?: number;
  search?: string;
}) {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('songs')
          .select('*, artists(*), albums(*)')
          .eq('is_available', true);

        if (options?.category) {
          query = query.eq('category', options.category);
        }

        if (options?.artistId) {
          query = query.eq('artist_id', options.artistId);
        }

        if (options?.search) {
          query = query.ilike('title', `%${options.search}%`);
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }

        query = query.order('plays_count', { ascending: false });

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;
        setSongs(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [
    options?.category,
    options?.artistId,
    options?.limit,
    options?.search,
  ]);

  return { songs, loading, error };
}

/**
 * Hook to record play history
 */
export function usePlayHistory() {
  const { user } = useAuth();

  const recordPlay = async (songId: string, durationPlayed: number) => {
    if (!user) return;

    await supabase.from('play_history').insert({
      user_id: user.id,
      song_id: songId,
      duration_played: durationPlayed,
    });

    // Increment play count
    await supabase.rpc('increment_play_count', { song_uuid: songId });
  };

  return { recordPlay };
}

/**
 * Hook for realtime subscriptions
 */
export function useRealtimeSubscription<T extends keyof Tables>(
  table: T,
  callback: (payload: any) => void
) {
  useEffect(() => {
    const subscription = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table as string },
        callback
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [table, callback]);
}
