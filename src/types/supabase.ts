export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          bio: string | null
          is_premium: boolean
          premium_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string | null
          bio?: string | null
          is_premium?: boolean
          premium_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          bio?: string | null
          is_premium?: boolean
          premium_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      artists: {
        Row: {
          id: string
          name: string
          bio: string | null
          image_url: string | null
          cover_url: string | null
          verified: boolean
          followers_count: number
          monthly_listeners: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          bio?: string | null
          image_url?: string | null
          cover_url?: string | null
          verified?: boolean
          followers_count?: number
          monthly_listeners?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          bio?: string | null
          image_url?: string | null
          cover_url?: string | null
          verified?: boolean
          followers_count?: number
          monthly_listeners?: number
          created_at?: string
          updated_at?: string
        }
      }
      albums: {
        Row: {
          id: string
          title: string
          artist_id: string | null
          cover_url: string | null
          release_year: number | null
          total_tracks: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          artist_id?: string | null
          cover_url?: string | null
          release_year?: number | null
          total_tracks?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          artist_id?: string | null
          cover_url?: string | null
          release_year?: number | null
          total_tracks?: number
          created_at?: string
          updated_at?: string
        }
      }
      songs: {
        Row: {
          id: string
          number: number
          title: string
          artist_id: string | null
          album_id: string | null
          duration: number
          audio_url: string
          cover_url: string | null
          lyrics: string | null
          category: string | null
          plays_count: number
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          number: number
          title: string
          artist_id?: string | null
          album_id?: string | null
          duration: number
          audio_url: string
          cover_url?: string | null
          lyrics?: string | null
          category?: string | null
          plays_count?: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          number?: number
          title?: string
          artist_id?: string | null
          album_id?: string | null
          duration?: number
          audio_url?: string
          cover_url?: string | null
          lyrics?: string | null
          category?: string | null
          plays_count?: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      playlists: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          cover_url: string | null
          privacy: 'public' | 'private' | 'collaborative'
          is_collaborative: boolean
          total_duration: number
          total_songs: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          cover_url?: string | null
          privacy?: 'public' | 'private' | 'collaborative'
          is_collaborative?: boolean
          total_duration?: number
          total_songs?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          cover_url?: string | null
          privacy?: 'public' | 'private' | 'collaborative'
          is_collaborative?: boolean
          total_duration?: number
          total_songs?: number
          created_at?: string
          updated_at?: string
        }
      }
      playlist_songs: {
        Row: {
          id: string
          playlist_id: string | null
          song_id: string | null
          position: number
          added_by: string | null
          added_at: string
        }
        Insert: {
          id?: string
          playlist_id?: string | null
          song_id?: string | null
          position: number
          added_by?: string | null
          added_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string | null
          song_id?: string | null
          position?: number
          added_by?: string | null
          added_at?: string
        }
      }
      liked_songs: {
        Row: {
          id: string
          user_id: string | null
          song_id: string | null
          liked_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          song_id?: string | null
          liked_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          song_id?: string | null
          liked_at?: string
        }
      }
      following_artists: {
        Row: {
          id: string
          user_id: string | null
          artist_id: string | null
          followed_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          artist_id?: string | null
          followed_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          artist_id?: string | null
          followed_at?: string
        }
      }
      play_history: {
        Row: {
          id: string
          user_id: string | null
          song_id: string | null
          played_at: string
          duration_played: number | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          song_id?: string | null
          played_at?: string
          duration_played?: number | null
        }
        Update: {
          id?: string
          user_id?: string | null
          song_id?: string | null
          played_at?: string
          duration_played?: number | null
        }
      }
      queue: {
        Row: {
          id: string
          user_id: string | null
          song_id: string | null
          position: number
          added_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          song_id?: string | null
          position: number
          added_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          song_id?: string | null
          position?: number
          added_at?: string
        }
      }
      user_preferences: {
        Row: {
          user_id: string
          audio_quality: string
          crossfade_enabled: boolean
          crossfade_duration: number
          normalize_volume: boolean
          autoplay: boolean
          gapless_playback: boolean
          download_quality: string
          download_over_cellular: boolean
          theme: string
          language: string
          private_session: boolean
          show_in_friend_activity: boolean
          email_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          audio_quality?: string
          crossfade_enabled?: boolean
          crossfade_duration?: number
          normalize_volume?: boolean
          autoplay?: boolean
          gapless_playback?: boolean
          download_quality?: string
          download_over_cellular?: boolean
          theme?: string
          language?: string
          private_session?: boolean
          show_in_friend_activity?: boolean
          email_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          audio_quality?: string
          crossfade_enabled?: boolean
          crossfade_duration?: number
          normalize_volume?: boolean
          autoplay?: boolean
          gapless_playback?: boolean
          download_quality?: string
          download_over_cellular?: boolean
          theme?: string
          language?: string
          private_session?: boolean
          show_in_friend_activity?: boolean
          email_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string | null
          plan: 'free' | 'premium' | 'family'
          status: 'active' | 'canceled' | 'expired'
          started_at: string
          expires_at: string | null
          billing_period: 'monthly' | 'yearly' | null
          amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          plan?: 'free' | 'premium' | 'family'
          status?: 'active' | 'canceled' | 'expired'
          started_at?: string
          expires_at?: string | null
          billing_period?: 'monthly' | 'yearly' | null
          amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          plan?: 'free' | 'premium' | 'family'
          status?: 'active' | 'canceled' | 'expired'
          started_at?: string
          expires_at?: string | null
          billing_period?: 'monthly' | 'yearly' | null
          amount?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_play_count: {
        Args: {
          song_uuid: string
        }
        Returns: void
      }
      update_playlist_stats: {
        Args: {
          playlist_uuid: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
