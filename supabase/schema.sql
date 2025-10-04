-- =====================================================
-- CÂNTICOS CCB - DATABASE SCHEMA
-- Supabase PostgreSQL Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Users Table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artists Table
CREATE TABLE public.artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    bio TEXT,
    image_url TEXT,
    cover_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    followers_count INTEGER DEFAULT 0,
    monthly_listeners INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Albums Table
CREATE TABLE public.albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
    cover_url TEXT,
    release_year INTEGER,
    total_tracks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Songs Table
CREATE TABLE public.songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    artist_id UUID REFERENCES public.artists(id) ON DELETE SET NULL,
    album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
    duration INTEGER NOT NULL, -- em segundos
    audio_url TEXT NOT NULL,
    cover_url TEXT,
    lyrics TEXT,
    category TEXT,
    plays_count INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playlists Table
CREATE TABLE public.playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    privacy TEXT CHECK (privacy IN ('public', 'private', 'collaborative')) DEFAULT 'public',
    is_collaborative BOOLEAN DEFAULT FALSE,
    total_duration INTEGER DEFAULT 0, -- em segundos
    total_songs INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playlist Songs Junction Table
CREATE TABLE public.playlist_songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(playlist_id, song_id)
);

-- Liked Songs Table
CREATE TABLE public.liked_songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
    liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, song_id)
);

-- Following Artists Table
CREATE TABLE public.following_artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
    followed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, artist_id)
);

-- Play History Table
CREATE TABLE public.play_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_played INTEGER -- em segundos
);

-- Queue Table
CREATE TABLE public.queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Preferences Table
CREATE TABLE public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    audio_quality TEXT DEFAULT 'high',
    crossfade_enabled BOOLEAN DEFAULT FALSE,
    crossfade_duration INTEGER DEFAULT 5,
    normalize_volume BOOLEAN DEFAULT TRUE,
    autoplay BOOLEAN DEFAULT TRUE,
    gapless_playback BOOLEAN DEFAULT TRUE,
    download_quality TEXT DEFAULT 'high',
    download_over_cellular BOOLEAN DEFAULT FALSE,
    theme TEXT DEFAULT 'dark',
    language TEXT DEFAULT 'pt-BR',
    private_session BOOLEAN DEFAULT FALSE,
    show_in_friend_activity BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions Table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT CHECK (plan IN ('free', 'premium', 'family')) DEFAULT 'free',
    status TEXT CHECK (status IN ('active', 'canceled', 'expired')) DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    billing_period TEXT CHECK (billing_period IN ('monthly', 'yearly')),
    amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Songs indexes
CREATE INDEX idx_songs_artist_id ON public.songs(artist_id);
CREATE INDEX idx_songs_album_id ON public.songs(album_id);
CREATE INDEX idx_songs_category ON public.songs(category);
CREATE INDEX idx_songs_plays_count ON public.songs(plays_count DESC);

-- Playlists indexes
CREATE INDEX idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX idx_playlists_privacy ON public.playlists(privacy);

-- Playlist songs indexes
CREATE INDEX idx_playlist_songs_playlist_id ON public.playlist_songs(playlist_id);
CREATE INDEX idx_playlist_songs_song_id ON public.playlist_songs(song_id);
CREATE INDEX idx_playlist_songs_position ON public.playlist_songs(position);

-- Liked songs indexes
CREATE INDEX idx_liked_songs_user_id ON public.liked_songs(user_id);
CREATE INDEX idx_liked_songs_song_id ON public.liked_songs(song_id);
CREATE INDEX idx_liked_songs_liked_at ON public.liked_songs(liked_at DESC);

-- Play history indexes
CREATE INDEX idx_play_history_user_id ON public.play_history(user_id);
CREATE INDEX idx_play_history_song_id ON public.play_history(song_id);
CREATE INDEX idx_play_history_played_at ON public.play_history(played_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liked_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.following_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Playlists policies
CREATE POLICY "Public playlists are viewable by everyone" ON public.playlists
    FOR SELECT USING (privacy = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can create their own playlists" ON public.playlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists" ON public.playlists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists" ON public.playlists
    FOR DELETE USING (auth.uid() = user_id);

-- Liked songs policies
CREATE POLICY "Users can view their own liked songs" ON public.liked_songs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can like songs" ON public.liked_songs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike songs" ON public.liked_songs
    FOR DELETE USING (auth.uid() = user_id);

-- Play history policies
CREATE POLICY "Users can view their own play history" ON public.play_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their play history" ON public.play_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Queue policies
CREATE POLICY "Users can view their own queue" ON public.queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own queue" ON public.queue
    FOR ALL USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON public.artists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON public.albums
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON public.songs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON public.playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment play count
CREATE OR REPLACE FUNCTION increment_play_count(song_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.songs 
    SET plays_count = plays_count + 1 
    WHERE id = song_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update playlist stats
CREATE OR REPLACE FUNCTION update_playlist_stats(playlist_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.playlists p
    SET 
        total_songs = (SELECT COUNT(*) FROM public.playlist_songs WHERE playlist_id = playlist_uuid),
        total_duration = (
            SELECT COALESCE(SUM(s.duration), 0) 
            FROM public.playlist_songs ps 
            JOIN public.songs s ON ps.song_id = s.id 
            WHERE ps.playlist_id = playlist_uuid
        )
    WHERE p.id = playlist_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('avatars', 'avatars', true),
    ('covers', 'covers', true),
    ('audio', 'audio', true)
ON CONFLICT DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for covers
CREATE POLICY "Cover images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'covers');

-- Storage policies for audio
CREATE POLICY "Audio files are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'audio');

-- =====================================================
-- INITIAL DATA / SEED
-- =====================================================

-- Insert default artist
INSERT INTO public.artists (name, bio, verified, followers_count, monthly_listeners)
VALUES 
    ('Coral CCB', 'O Coral da Congregação Cristã no Brasil', true, 1234567, 2500000),
    ('Orquestra CCB', 'Orquestra oficial da CCB', true, 856000, 1800000);

-- Insert sample categories
-- Categories will be stored as text in songs table
-- Popular categories: 'louvor', 'adoracao', 'classicos', 'instrumental', 'coral', 'oracao'
