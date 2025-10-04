-- =====================================================
-- SEED DATA - Cânticos CCB
-- Popular banco com dados de exemplo
-- =====================================================

-- Insert Artists
INSERT INTO public.artists (id, name, bio, image_url, cover_url, verified, followers_count, monthly_listeners) VALUES
('a1111111-1111-1111-1111-111111111111', 'Coral CCB', 'O Coral da Congregação Cristã no Brasil é conhecido por sua tradição musical que remonta a mais de um século, preservando os hinos sagrados com reverência e devoção.', 'https://picsum.photos/seed/coral/600/600', 'https://picsum.photos/seed/coral-cover/1400/400', true, 1234567, 2500000),
('a2222222-2222-2222-2222-222222222222', 'Orquestra CCB', 'Orquestra oficial da Congregação Cristã no Brasil, trazendo arranjos instrumentais dos hinos tradicionais.', 'https://picsum.photos/seed/orquestra/600/600', 'https://picsum.photos/seed/orquestra-cover/1400/400', true, 856000, 1800000),
('a3333333-3333-3333-3333-333333333333', 'Coral Jovem CCB', 'Vozes jovens dedicadas ao louvor através dos hinos sagrados.', 'https://picsum.photos/seed/jovem/600/600', 'https://picsum.photos/seed/jovem-cover/1400/400', true, 542000, 950000);

-- Insert Albums
INSERT INTO public.albums (id, title, artist_id, cover_url, release_year, total_tracks) VALUES
('b1111111-1111-1111-1111-111111111111', 'Hinos de Louvor Vol. 1', 'a1111111-1111-1111-1111-111111111111', 'https://picsum.photos/seed/album1/300/300', 2023, 15),
('b2222222-2222-2222-2222-222222222222', 'Hinos Clássicos', 'a1111111-1111-1111-1111-111111111111', 'https://picsum.photos/seed/album2/300/300', 2022, 20),
('b3333333-3333-3333-3333-333333333333', 'Hinos de Esperança', 'a1111111-1111-1111-1111-111111111111', 'https://picsum.photos/seed/album3/300/300', 2022, 18),
('b4444444-4444-4444-4444-444444444444', 'Hinário Vol. 1', 'a1111111-1111-1111-1111-111111111111', 'https://picsum.photos/seed/album4/300/300', 2021, 25),
('b5555555-5555-5555-5555-555555555555', 'Instrumental Clássico', 'a2222222-2222-2222-2222-222222222222', 'https://picsum.photos/seed/album5/300/300', 2023, 12);

-- Insert Songs (Hinos)
INSERT INTO public.songs (id, number, title, artist_id, album_id, duration, audio_url, cover_url, lyrics, category, plays_count) VALUES
-- Hinos de Louvor
('c1111111-1111-1111-1111-111111111111', 100, 'Hino 100 - Vencendo Vem Jesus', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 225, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://picsum.photos/seed/hino100/300/300', 
'Vencendo vem Jesus, o Rei dos reis
Guiando Seus fiéis a combater
Com Ele venceremos, sem temer
Pois Seu poder jamais há de perecer', 'louvor', 12345678),

('c2222222-2222-2222-2222-222222222222', 50, 'Hino 50 - Saudosa Lembrança', 'a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 252, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://picsum.photos/seed/hino50/300/300',
'Saudosa lembrança de Jesus, meu Salvador
Que por mim padeceu tão grande dor
Na cruz derramou Seu precioso sangue
Para me salvar do meu pecado', 'adoracao', 9876543),

('c3333333-3333-3333-3333-333333333333', 200, 'Hino 200 - Jerusalém Celeste', 'a1111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', 238, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://picsum.photos/seed/hino200/300/300',
'Jerusalém celeste, morada de luz
Onde habita eternamente nosso Senhor Jesus
Ali não há tristeza, nem choro ou dor
Somente paz e alegria no amor do Salvador', 'classicos', 8765432),

('c4444444-4444-4444-4444-444444444444', 1, 'Hino 1 - Deus Eterno', 'a1111111-1111-1111-1111-111111111111', 'b4444444-4444-4444-4444-444444444444', 210, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'https://picsum.photos/seed/hino1/300/300',
'Deus eterno, Deus de amor
Criador do céu e da terra
Tu és santo, Tu és Senhor
Teu poder jamais se encerra', 'louvor', 7654321),

('c5555555-5555-5555-5555-555555555555', 5, 'Hino 5 - Vem Pecador', 'a1111111-1111-1111-1111-111111111111', 'b4444444-4444-4444-4444-444444444444', 245, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 'https://picsum.photos/seed/hino5/300/300',
'Vem pecador, sem demorar
A Jesus Cristo te entregar
Ele te quer perdoar
E vida eterna te dar', 'oracao', 6543210),

('c6666666-6666-6666-6666-666666666666', 300, 'Hino 300 - Além do Véu', 'a1111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', 202, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', 'https://picsum.photos/seed/hino300/300/300',
'Além do véu eu vou morar
Na glória celestial
Com Cristo vou habitar
Na pátria eternal', 'adoracao', 5432109),

('c7777777-7777-7777-7777-777777777777', 150, 'Hino 150 - Fé Mais Fé', 'a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 235, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', 'https://picsum.photos/seed/hino150/300/300',
'Fé mais fé, Senhor, me dá
Para eu seguir a Ti
Fé mais fé, pra suportar
As lutas que há aqui', 'louvor', 4321098),

('c8888888-8888-8888-8888-888888888888', 75, 'Hino 75 - Ceia do Senhor', 'a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 258, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', 'https://picsum.photos/seed/hino75/300/300',
'À mesa da comunhão
Viemos com devoção
Celebrar a ceia do Senhor
E lembrar Seu grande amor', 'classicos', 3210987),

-- Instrumentais
('c9999999-9999-9999-9999-999999999999', 101, 'Hino 100 - Instrumental', 'a2222222-2222-2222-2222-222222222222', 'b5555555-5555-5555-5555-555555555555', 225, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', 'https://picsum.photos/seed/inst100/300/300', null, 'instrumental', 2109876),

('ca111111-1111-1111-1111-111111111111', 50, 'Hino 50 - Instrumental', 'a2222222-2222-2222-2222-222222222222', 'b5555555-5555-5555-5555-555555555555', 252, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', 'https://picsum.photos/seed/inst50/300/300', null, 'instrumental', 1098765);

-- =====================================================
-- Sample User Data (for testing)
-- =====================================================

-- Note: In production, users are created through Supabase Auth
-- This is just sample data structure

-- Sample Playlists (will be created after user signup)
-- These are examples, actual creation happens through the app

-- =====================================================
-- Update Stats
-- =====================================================

-- Update album track counts
UPDATE public.albums SET total_tracks = (
    SELECT COUNT(*) FROM public.songs WHERE album_id = albums.id
);

-- Update artist followers (this would normally be calculated from following_artists table)
-- Already set in the INSERT statements above

-- =====================================================
-- Verify Data
-- =====================================================

-- Check inserted data
-- SELECT COUNT(*) as total_artists FROM public.artists;
-- SELECT COUNT(*) as total_albums FROM public.albums;
-- SELECT COUNT(*) as total_songs FROM public.songs;

-- Show sample songs
-- SELECT s.number, s.title, a.name as artist, al.title as album, s.plays_count
-- FROM public.songs s
-- LEFT JOIN public.artists a ON s.artist_id = a.id
-- LEFT JOIN public.albums al ON s.album_id = al.id
-- ORDER BY s.plays_count DESC
-- LIMIT 10;
