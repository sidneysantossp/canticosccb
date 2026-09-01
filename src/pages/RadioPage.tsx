import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import RadioPlayer from '@/components/radio/RadioPlayer';
import RadioSchedule, { type RadioProgram } from '@/components/radio/RadioSchedule';
import SEOHead from '@/components/SEO/SEOHead';
import { getHomePageData, type HomePageData, type HomeHymn } from '@/lib/homeApi';
import { hasPlayableTrackSource } from '@/lib/playerFeedback';
import { usePlayerStore } from '@/stores/playerStore';
import type { Hino } from '@/types';
import { generateBreadcrumbSchema } from '@/utils/schemaGenerator';

const emptyHomeData: HomePageData = {
  banners: [], featured: [], albums: [], hymnsCantados: [], hymnsTocados: [], hymnsAvulsos: [],
  newReleases: [], trending: [], composers: [], playlists: [], categories: [],
};

const shifts: Array<Omit<RadioProgram, 'tracks'>> = [
  { id: 'morning', label: 'Manhã', timeRange: '06:00 — 11:59' },
  { id: 'afternoon', label: 'Tarde', timeRange: '12:00 — 17:59' },
  { id: 'night', label: 'Noite', timeRange: '18:00 — 23:59' },
  { id: 'dawn', label: 'Madrugada', timeRange: '00:00 — 05:59' },
];

const toTrack = (hymn: HomeHymn): Hino => ({
  id: String(hymn.id),
  title: hymn.title,
  number: Number(hymn.number || 0),
  category: hymn.category || 'Hinos',
  artist: hymn.composer_name || 'Cânticos CCB',
  duration: hymn.duration || '00:00',
  audioUrl: hymn.audio_url || '',
  coverUrl: hymn.cover_url || '',
  plays: 0,
  isLiked: false,
  createdAt: hymn.created_at || new Date().toISOString(),
  youtubeSource: hymn.youtube_source,
});

const uniqueById = (items: HomeHymn[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = String(item.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const RadioPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [homeData, setHomeData] = useState<HomePageData>(emptyHomeData);
  const [activeScheduleIndex, setActiveScheduleIndex] = useState(0);
  const {
    currentTrack, isPlaying, volume, playbackContext, play, pause, resume,
    setVolume, clearQueue, addToQueue, setPlaybackContext,
  } = usePlayerStore();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getHomePageData();
        if (!cancelled) setHomeData(data);
      } catch (error) {
        console.error('Erro ao carregar a programação da rádio:', error);
        if (!cancelled) setHomeData(emptyHomeData);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const updateActiveProgram = () => {
      const currentHour = new Date().getHours();
      setActiveScheduleIndex(currentHour < 6 ? 3 : currentHour < 12 ? 0 : currentHour < 18 ? 1 : 2);
    };
    updateActiveProgram();
    const interval = window.setInterval(updateActiveProgram, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const lineup = useMemo(() => uniqueById([
    ...homeData.featured,
    ...homeData.trending,
    ...homeData.newReleases,
    ...homeData.hymnsTocados,
    ...homeData.hymnsCantados,
    ...homeData.hymnsAvulsos,
  ]).filter((hymn) => hasPlayableTrackSource({
    number: hymn.number,
    title: hymn.title,
    artist: hymn.composer_name,
    audioUrl: hymn.audio_url,
    youtubeSource: hymn.youtube_source,
  })).slice(0, 24), [homeData]);

  const isRadioActive = playbackContext?.id === 'radio-canticos' && Boolean(currentTrack);
  const isRadioPlaying = isRadioActive && isPlaying;
  const schedule = useMemo<RadioProgram[]>(() => shifts.map((shift, index) => ({
    ...shift,
    tracks: lineup.slice(index * 6, index * 6 + 6).map((hymn) => ({
      artist: hymn.composer_name || 'Cânticos CCB',
      duration: hymn.duration || '—',
      id: String(hymn.id),
      title: hymn.title,
    })),
  })), [lineup]);

  const startRadio = (startAtIndex = 0) => {
    const tracks = lineup.map(toTrack);
    if (!tracks.length) return;
    const normalizedIndex = Math.max(0, Math.min(startAtIndex, tracks.length - 1));
    const started = play(tracks[normalizedIndex]);
    if (started === false) return;
    clearQueue();
    [...tracks.slice(normalizedIndex + 1), ...tracks.slice(0, normalizedIndex)].forEach(addToQueue);
    setPlaybackContext({ type: 'playlist', id: 'radio-canticos' });
  };

  const handlePlayPause = () => {
    if (!isRadioActive) {
      startRadio(activeScheduleIndex * 3);
      return;
    }
    if (isPlaying) pause();
    else resume();
  };

  const schemaData = generateBreadcrumbSchema([
    { name: 'Início', url: '/' },
    { name: 'Rádio Cânticos CCB', url: '/radio' },
  ]);

  return (
    <div className="radio-page mx-auto min-h-[calc(100vh-5rem)] w-full max-w-[1440px] pb-28 pt-4 sm:pt-6 lg:pb-16">
      <SEOHead
        title="Rádio Cânticos CCB — programação musical online"
        description="Ouça a Rádio Cânticos CCB e acompanhe a sequência de hinos organizada por manhã, tarde, noite e madrugada."
        canonical="/radio"
        schemaData={schemaData}
      />
      <Link to="/" className="radio-back-link">
        <ArrowLeft aria-hidden="true" />
        Voltar
      </Link>
      <RadioPlayer
        disabled={loading || lineup.length === 0}
        isPlaying={isRadioPlaying}
        onPlayPause={handlePlayPause}
        onVolumeChange={setVolume}
        trackName={isRadioActive && currentTrack ? currentTrack.title : 'Rádio Cânticos CCB — programação ao vivo'}
        volume={volume}
      />
      {!loading && lineup.length === 0 ? <p className="radio-unavailable">Programação temporariamente indisponível.</p> : null}
      <RadioSchedule
        programs={schedule}
        activeIndex={activeScheduleIndex}
        currentTrackId={isRadioActive && currentTrack ? String(currentTrack.id) : undefined}
      />
    </div>
  );
};

export default RadioPage;
