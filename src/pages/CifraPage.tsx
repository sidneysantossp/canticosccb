import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ScrollText, Settings2, Eye, Printer, Share2, Music, X, Heart, Flag, Gauge, Hand, Target, RefreshCw, Play, Pause, RotateCcw, PanelLeftClose, PanelLeftOpen, ListMusic, BookOpen, Library, ChevronRight, Columns, Type, Search } from 'lucide-react';
import { GiGuitar } from 'react-icons/gi';
import SEOHead from '@/components/SEO/SEOHead';
import ChordDictionaryCarousel from '@/components/cifras/ChordDictionaryCarousel';
import { generateCifraSchema, generateBreadcrumbSchema } from '@/utils/schemaGenerator';
import { fetchCifraByLegacyHinarioSlug, fetchCifraBySlug, fetchCifras, incrementCifraViews, type Cifra, INSTRUMENTS, ALL_KEYS } from '@/api/cifras';
import { buildHinoUrl } from '@/utils/slugUrl';
import { buildCifraUrl } from '@/utils/cifraUrl';
import { buildHinarioUrl } from '@/utils/hinarioSeo';
import {
  addCifraFavorite,
  fetchCifraChordShapeVariants,
  fetchAdminPreviewCifraPageBySlug,
  fetchCifraEngagementSnapshot,
  fetchPublicCifraPageBySlug,
  removeCifraFavorite,
  resolveCifraVersionChordOverride,
  scoreCifraChordNameMatch,
  serializeSectionLines,
  submitCifraReport,
  trackCifraUsageEvent,
  type CifraEngagementSnapshot,
  type PublicCifraPageData,
} from '@/lib/cifras-v2';
import { getHinarioRangeForNumero } from '@/lib/hinarioRanges';
import { extractHymnNumber, findRelatedHinario, findRelatedHymn } from '@/lib/hymnConnectionsApi';
import { hinosApi } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { CIFRA_V2_INSTRUMENTS, type CifraChordShape, type CifraInstrument, type CifraReportType, type CifraVersionSection } from '@/types/cifras-v2';
import type { Hino } from '@/types';
import { usePlayerStore } from '@/stores/playerStore';
import {
  isChordLine,
  isSectionLine,
  extractChords,
  getSemitonesBetweenKeys,
  simplifyCifraContent,
  transposeCifraContent,
} from '@/utils/chordUtils';

type DisplayCifra = Cifra | PublicCifraPageData;

const PUBLIC_INSTRUMENTS = [
  ...INSTRUMENTS,
  ...CIFRA_V2_INSTRUMENTS.filter((entry) => !INSTRUMENTS.some((legacy) => legacy.value === entry.value)),
];

function isCifraV2(cifra: DisplayCifra | null): cifra is PublicCifraPageData {
  return Boolean(cifra && 'source' in cifra && cifra.source === 'v2');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripTrailingArtistFromTitle(title: string, artist?: string | null): string {
  const normalizedTitle = title.trim();
  const normalizedArtist = artist?.trim();

  if (!normalizedArtist) {
    return normalizedTitle;
  }

  return normalizedTitle
    .replace(new RegExp(`\\s+-\\s+${escapeRegExp(normalizedArtist)}\\s*$`, 'i'), '')
    .trim();
}

function getCifraCategoryLabel(category?: string | null): string {
  const normalized = String(category || '').trim().toLowerCase();
  const labels: Record<string, string> = {
    avulso: 'Hino Avulso CCB',
    avulsos: 'Hino Avulso CCB',
    cantado: 'Hino Cantado CCB',
    cantados: 'Hino Cantado CCB',
    tocado: 'Hino Tocado CCB',
    tocados: 'Hino Tocado CCB',
    instrumental: 'Hino Instrumental CCB',
    instrumentais: 'Hino Instrumental CCB',
  };

  return labels[normalized] || String(category || 'Cifra CCB').trim();
}

function getSectionAnchor(sectionLabel: string, index: number): string {
  const normalized = String(sectionLabel || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized ? `sec-${normalized}-${index + 1}` : `sec-${index + 1}`;
}

const REPORT_TYPE_OPTIONS: Array<{ value: CifraReportType; label: string }> = [
  { value: 'wrong_chord', label: 'Acorde incorreto' },
  { value: 'wrong_key', label: 'Tom incorreto' },
  { value: 'formatting', label: 'Problema de formatação' },
  { value: 'duplicate', label: 'Cifra duplicada' },
  { value: 'copyright', label: 'Questão de direitos autorais' },
  { value: 'other', label: 'Outro problema' },
];

const DEMO_CIFRA_SLUG = 'demo-hoje-deus-te-abraca';

const DEMO_CIFRA: Cifra = {
  id: -1,
  title: 'Hoje Deus Te Abraça',
  artist: 'Hinos Avulsos CCB',
  slug: DEMO_CIFRA_SLUG,
  original_key: 'A',
  instrument: 'violao',
  capo: 4,
  cover_url: null,
  hino_id: null,
  category: 'avulsos',
  views_count: 0,
  is_active: true,
  created_by: null,
  created_at: '2026-08-08T00:00:00.000Z',
  updated_at: '2026-08-08T00:00:00.000Z',
  content: `[Intro]
        A  D  E  A  C#7
        F#m  Bm  E  A  D  A

[Primeira Parte]

                 Bm    Bm/A   E/G#
Hoje você orou chorando
              A    C#7   F#m
A sua alma perguntando
                   Bm   Bm/A  E
O porque de tantas lutas
                      A   D   A
Provas que vem pra derrubar
                 Bm   Bm/A   E/G#
Querido irmão fique sabendo
                      A   C#7   F#m
O que Deus falou não caiu no chão
             Bm   Bm/A   E/G#
Ó alma se alegra
                   A   D   A
Suas promessas cumprirão

[Refrão]

              D              E
Hoje Deus te abraça nesta oração
          A   C#7        F#m
E vai passear no seu coração
                 Bm
Vai dando glória a Deus
                    E
Sinta as portas se abrindo
              A
E uma obra tu verás
       E/G#    F#m
Ah, as, ah, as
          D           A
E uma obra tu verás
       E/G#    F#m
Ah, as, ah, as

( A  D  E  A  C#7 )
( F#m  Bm  E  A  D  A )`,
};

function buildInitialEngagement(cifra: PublicCifraPageData): CifraEngagementSnapshot {
  return {
    versionId: cifra.id,
    viewsCount: cifra.views_count || 0,
    sharesCount: cifra.shares_count || 0,
    printsCount: cifra.prints_count || 0,
    favoritesCount: cifra.favorites_count || 0,
    reportsCount: cifra.reports_count || 0,
    openReportsCount: cifra.open_reports_count || 0,
    lastInteractionAt: cifra.last_interaction_at || null,
    isFavorited: false,
  };
}

function sortChordShapeVariantsForContext(
  requestedChordName: string,
  shapes: CifraChordShape[],
  options: {
    preferredKey?: string | null;
    originalKey?: string | null;
    progression?: string[] | null;
  },
): CifraChordShape[] {
  return [...shapes].sort((left, right) => {
    const leftScore =
      scoreCifraChordNameMatch(requestedChordName, left.chord_name, options) +
      left.priority * 5 +
      ((left.variation_name || 'default').trim().toLowerCase() === 'default' ? 10 : 0);
    const rightScore =
      scoreCifraChordNameMatch(requestedChordName, right.chord_name, options) +
      right.priority * 5 +
      ((right.variation_name || 'default').trim().toLowerCase() === 'default' ? 10 : 0);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return left.variation_name.localeCompare(right.variation_name);
  });
}

function prioritizeShapesForEditorialOverride(
  shapes: CifraChordShape[],
  overrideShapeId?: string | null,
): CifraChordShape[] {
  if (!overrideShapeId) {
    return shapes;
  }

  const overrideIndex = shapes.findIndex((shape) => shape.id === overrideShapeId);
  if (overrideIndex <= 0) {
    return shapes;
  }

  return [shapes[overrideIndex], ...shapes.slice(0, overrideIndex), ...shapes.slice(overrideIndex + 1)];
}

function parseDurationLabelToSeconds(value?: string | null): number | null {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return null;
  }

  const parts = normalized.split(':').map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return null;
}

function buildPlayerTrackFromHymn(row: any, fallbackCoverUrl?: string | null): Hino {
  return {
    id: String(row.id),
    title: String(row.titulo || 'Hino CCB'),
    number: Number(row.numero || 0),
    category: String(row.categoria || 'Hinos CCB'),
    artist: String(row.compositor_nome || 'Canticos CCB'),
    duration: String(row.duracao || '00:00'),
    audioUrl: row.youtube_source ? '' : (row.audio_url || undefined),
    coverUrl: row.cover_url || fallbackCoverUrl || undefined,
    lyrics: row.letra || undefined,
    plays: 0,
    isLiked: false,
    createdAt: row.created_at || new Date().toISOString(),
    youtubeSource: row.youtube_source || undefined,
  };
}

function estimateSectionWindow(index: number, totalSections: number, durationSeconds: number) {
  const safeTotal = Math.max(totalSections, 1);
  const start = (durationSeconds * index) / safeTotal;
  const end = (durationSeconds * (index + 1)) / safeTotal;

  return {
    start: Math.max(0, start),
    end: Math.max(start, end),
  };
}

function resolveSectionTiming(
  sections: CifraVersionSection[],
  sectionIndex: number,
  durationSeconds: number,
  options?: { preferLoopWindow?: boolean },
) {
  const estimated = estimateSectionWindow(sectionIndex, sections.length, durationSeconds);
  const section = sections[sectionIndex];
  const nextSection = sections[sectionIndex + 1];

  if (!section) {
    return estimated;
  }

  const preferLoopWindow = Boolean(options?.preferLoopWindow);
  const cueStart = section.cue_start_seconds ?? estimated.start;
  const cueEnd = section.cue_end_seconds ?? nextSection?.cue_start_seconds ?? estimated.end;
  const loopStart = section.loop_start_seconds ?? cueStart;
  const loopEnd = section.loop_end_seconds ?? cueEnd;

  return {
    start: Math.max(0, preferLoopWindow ? loopStart : cueStart),
    end: Math.max(preferLoopWindow ? loopStart : cueStart, preferLoopWindow ? loopEnd : cueEnd),
  };
}

function resolveDefaultStudySectionIndex(
  sections: CifraVersionSection[],
  sectionOrder?: number | null,
): number | null {
  if (!Number.isFinite(sectionOrder) || !sectionOrder || sectionOrder < 1) {
    return null;
  }

  const directMatch = sections.findIndex((section) => section.section_order === sectionOrder);
  if (directMatch >= 0) {
    return directMatch;
  }

  const positionalMatch = sectionOrder - 1;
  return positionalMatch >= 0 && positionalMatch < sections.length ? positionalMatch : null;
}

const CifraPage: React.FC = () => {
  const { slug, instrument: routeInstrument } = useParams<{ slug: string; instrument?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    currentTrack,
    isPlaying: isPlayerPlaying,
    currentTime: playerCurrentTime,
    duration: playerDuration,
    play,
    pause,
    resume,
    setCurrentTime,
    setPlaybackContext,
  } = usePlayerStore();
  const [cifra, setCifra] = useState<DisplayCifra | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedHymn, setRelatedHymn] = useState<{ id: string; numero: number; titulo: string } | null>(null);
  const [relatedLyric, setRelatedLyric] = useState<{ numero: number; titulo: string } | null>(null);
  const [relatedHymnTrack, setRelatedHymnTrack] = useState<Hino | null>(null);
  const [isRelatedTrackLoading, setIsRelatedTrackLoading] = useState(false);
  const [engagement, setEngagement] = useState<CifraEngagementSnapshot | null>(null);
  const [chordShapeVariants, setChordShapeVariants] = useState<Record<string, CifraChordShape[]>>({});
  const [selectedShapeIds, setSelectedShapeIds] = useState<Record<string, string>>({});
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<CifraReportType>('wrong_chord');
  const [reportMessage, setReportMessage] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');

  // User controls
  const [selectedKey, setSelectedKey] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('violao');
  const [fontSize, setFontSize] = useState(16);
  const [showChords, setShowChords] = useState(true);
  const [useSimplifiedChords, setUseSimplifiedChords] = useState(true);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); // 0 = off
  const [showOptions, setShowOptions] = useState(false);
  const [showKeySelector, setShowKeySelector] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showLeftHandedDiagrams, setShowLeftHandedDiagrams] = useState(false);
  const [useTwoColumnLayout, setUseTwoColumnLayout] = useState(false);
  const [studyModeEnabled, setStudyModeEnabled] = useState(false);
  const [focusedSectionIndex, setFocusedSectionIndex] = useState<number | null>(null);
  const [syncStudyWithAudio, setSyncStudyWithAudio] = useState(false);
  const [loopFocusedSection, setLoopFocusedSection] = useState(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [metronomeBpm, setMetronomeBpm] = useState(72);
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
  const [sidebarInstrumentCifras, setSidebarInstrumentCifras] = useState<Cifra[]>([]);

  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  const metronomeIntervalRef = useRef<number | null>(null);
  const metronomeBeatRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const queuedSeekRef = useRef<number | null>(null);
  const lastSyncedSectionRef = useRef<number | null>(null);
  const lastLoopAtRef = useRef(0);

  useEffect(() => {
    if (slug) loadCifra(slug);
    return () => stopAutoScroll();
  }, [slug, routeInstrument]);

  useEffect(() => {
    void fetchCifras({ instrument: selectedInstrument, category: 'hinario', is_active: true, limit: 520 })
      .then(setSidebarInstrumentCifras)
      .catch(() => setSidebarInstrumentCifras([]));
  }, [selectedInstrument]);

  useEffect(() => {
    if (user?.email) {
      setReporterEmail((current) => current || user.email);
    }
  }, [user?.email]);

  useEffect(() => {
    let cancelled = false;

    const loadConnections = async () => {
      if (!cifra) {
        setRelatedHymn(null);
        setRelatedLyric(null);
        return;
      }

      try {
        const inferredNumber = extractHymnNumber(cifra.title);
        const [hymnMatch, lyricMatch] = await Promise.all([
          findRelatedHymn({
            hymnId: cifra.hino_id,
            numero: inferredNumber,
            titulo: cifra.title,
          }),
          findRelatedHinario(inferredNumber),
        ]);

        if (!cancelled) {
          setRelatedHymn(hymnMatch ? {
            id: hymnMatch.id,
            numero: hymnMatch.numero,
            titulo: hymnMatch.titulo,
          } : null);
          setRelatedLyric(lyricMatch ? {
            numero: lyricMatch.numero,
            titulo: lyricMatch.titulo,
          } : null);
        }
      } catch (connectionError) {
        console.error('Erro ao carregar conexoes da cifra:', connectionError);
        if (!cancelled) {
          setRelatedHymn(null);
          setRelatedLyric(null);
        }
      }
    };

    void loadConnections();
    return () => {
      cancelled = true;
    };
  }, [cifra]);

  useEffect(() => {
    let cancelled = false;

    const loadRelatedTrack = async () => {
      if (!relatedHymn) {
        setRelatedHymnTrack(null);
        setIsRelatedTrackLoading(false);
        return;
      }

      try {
        setIsRelatedTrackLoading(true);
        const { data, error: hymnError } = await hinosApi.get(relatedHymn.id);
        if (hymnError) {
          throw new Error(hymnError);
        }

        if (!cancelled && data) {
          setRelatedHymnTrack(buildPlayerTrackFromHymn(data, cifra?.cover_url || null));
        }
      } catch (trackError) {
        console.error('Erro ao carregar o áudio do hino relacionado:', trackError);
        if (!cancelled) {
          setRelatedHymnTrack(null);
        }
      } finally {
        if (!cancelled) {
          setIsRelatedTrackLoading(false);
        }
      }
    };

    void loadRelatedTrack();

    return () => {
      cancelled = true;
    };
  }, [cifra?.cover_url, relatedHymn]);

  useEffect(() => {
    let cancelled = false;

    const syncEngagement = async () => {
      if (!cifra || !isCifraV2(cifra)) {
        setEngagement(null);
        return;
      }

      setEngagement((current) => current ?? buildInitialEngagement(cifra));

      try {
        await trackCifraUsageEvent(cifra.id, 'view', {
          userId: user?.id || null,
          metadata: {
            slug: cifra.slug,
            instrument: cifra.instrument,
          },
        });
      } catch (trackingError) {
        console.error('Erro ao registrar visualização da cifra:', trackingError);
      }

      try {
        const snapshot = await fetchCifraEngagementSnapshot(cifra.id, user?.id || null);
        if (!cancelled) {
          setEngagement(snapshot);
        }
      } catch (engagementError) {
        console.error('Erro ao carregar métricas da cifra:', engagementError);
      }
    };

    void syncEngagement();

    return () => {
      cancelled = true;
    };
  }, [cifra, user?.id]);

  useEffect(() => {
    let cancelled = false;

    const loadChordShapes = async () => {
      if (!showChords || !cifra) {
        setChordShapeVariants({});
        setSelectedShapeIds({});
        return;
      }

      const visibleChords = extractChords(
        transposeCifraContent(cifra.content, getSemitonesBetweenKeys(cifra.original_key, selectedKey), selectedKey),
      ).slice(0, 12);

      if (visibleChords.length === 0) {
        setChordShapeVariants({});
        setSelectedShapeIds({});
        return;
      }

      try {
        const shapes = await fetchCifraChordShapeVariants(selectedInstrument as CifraInstrument, visibleChords);
        if (!cancelled) {
          const sortedShapes = Object.fromEntries(
            Object.entries(shapes).map(([chord, options]) => [
              chord,
              prioritizeShapesForEditorialOverride(
                sortChordShapeVariantsForContext(chord, options, {
                  preferredKey: selectedKey,
                  originalKey: cifra.original_key,
                  progression: visibleChords,
                }),
                isCifraV2(cifra)
                  ? resolveCifraVersionChordOverride(cifra.chord_overrides, chord, selectedKey)?.preferred_shape_id
                  : null,
              ),
            ]),
          );

          setChordShapeVariants(sortedShapes);
          setSelectedShapeIds((current) => {
            const next: Record<string, string> = {};

            visibleChords.forEach((chord) => {
              const options = sortedShapes[chord] || [];
              if (options.length === 0) {
                return;
              }

              const override = isCifraV2(cifra)
                ? resolveCifraVersionChordOverride(cifra.chord_overrides, chord, selectedKey)
                : null;
              const overrideStillExists = override && options.some((shape) => shape.id === override.preferred_shape_id);
              if (overrideStillExists) {
                next[chord] = override.preferred_shape_id;
                return;
              }

              const currentSelection = current[chord];
              const currentStillExists = currentSelection && options.some((shape) => shape.id === currentSelection);
              next[chord] = currentStillExists ? currentSelection : options[0].id;
            });

            return next;
          });
        }
      } catch (shapeError) {
        console.error('Erro ao carregar shapes de acordes da cifra:', shapeError);
        if (!cancelled) {
          setChordShapeVariants({});
          setSelectedShapeIds({});
        }
      }
    };

    void loadChordShapes();

    return () => {
      cancelled = true;
    };
  }, [cifra, selectedInstrument, selectedKey, showChords]);

  const measureBeats = useMemo(() => {
    if (!cifra || !isCifraV2(cifra) || !cifra.time_signature) {
      return 4;
    }

    const numerator = Number.parseInt(String(cifra.time_signature).split('/')[0] || '4', 10);
    return Number.isFinite(numerator) && numerator > 0 ? numerator : 4;
  }, [cifra]);

  const structuredSectionItems = useMemo(
    () => (isCifraV2(cifra) ? (cifra.sections || []).map((section, index) => ({ section, index })) : []),
    [cifra],
  );

  const visibleStructuredSections = useMemo(() => {
    if (!isCifraV2(cifra)) {
      return [];
    }

    if (!studyModeEnabled || focusedSectionIndex === null) {
      return structuredSectionItems;
    }

    return structuredSectionItems.filter((item) => item.index === focusedSectionIndex);
  }, [cifra, focusedSectionIndex, studyModeEnabled, structuredSectionItems]);

  const isRelatedTrackActive = Boolean(relatedHymnTrack && currentTrack?.id === relatedHymnTrack.id);
  const canPlayRelatedTrack = Boolean(relatedHymnTrack && (relatedHymnTrack.audioUrl || relatedHymnTrack.youtubeSource));
  const hasStructuredSections = structuredSectionItems.length > 0;
  const structuredSections = isCifraV2(cifra) ? (cifra.sections || []) : [];
  const supportsStudyTools = isCifraV2(cifra) && structuredSections.length > 0;
  const supportsTwoColumnLayout = isCifraV2(cifra) && structuredSections.length > 1;
  const effectiveRelatedDuration = useMemo(() => {
    if (!relatedHymnTrack) {
      return null;
    }

    if (isRelatedTrackActive && playerDuration > 0) {
      return playerDuration;
    }

    return parseDurationLabelToSeconds(relatedHymnTrack.duration);
  }, [isRelatedTrackActive, playerDuration, relatedHymnTrack]);

  const ensureAudioContext = useCallback(() => {
    const AudioContextCtor = window.AudioContext || ((window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!AudioContextCtor) {
      showToast('warning', 'Metrônomo indisponível', 'Este navegador não oferece suporte ao metrônomo nesta página.');
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor();
    }

    if (audioContextRef.current.state === 'suspended') {
      void audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, [showToast]);

  const playMetronomeClick = useCallback((accent: boolean) => {
    const audioContext = ensureAudioContext();
    if (!audioContext) {
      return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = accent ? 'square' : 'sine';
    oscillator.frequency.setValueAtTime(accent ? 1360 : 980, now);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(accent ? 0.18 : 0.11, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }, [ensureAudioContext]);

  const stopMetronome = useCallback(() => {
    if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }
    metronomeBeatRef.current = 0;
  }, []);

  const startMetronome = useCallback(() => {
    stopMetronome();

    if (metronomeBpm <= 0) {
      return;
    }

    if (!ensureAudioContext()) {
      setMetronomeEnabled(false);
      setUseSimplifiedChords(true);
      return;
    }

    playMetronomeClick(true);
    metronomeBeatRef.current = 1 % measureBeats;

    const intervalMs = Math.max(120, Math.round((60_000 / metronomeBpm)));
    metronomeIntervalRef.current = window.setInterval(() => {
      const isAccent = metronomeBeatRef.current % measureBeats === 0;
      playMetronomeClick(isAccent);
      metronomeBeatRef.current = (metronomeBeatRef.current + 1) % measureBeats;
    }, intervalMs);
  }, [ensureAudioContext, measureBeats, metronomeBpm, playMetronomeClick, stopMetronome]);

  useEffect(() => {
    if (metronomeEnabled) {
      startMetronome();
    } else {
      stopMetronome();
    }

    return () => stopMetronome();
  }, [metronomeEnabled, metronomeBpm, measureBeats, startMetronome, stopMetronome]);

  useEffect(() => {
    return () => {
      stopMetronome();
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
      }
    };
  }, [stopMetronome]);

  const scrollToSection = useCallback((index: number) => {
    const item = structuredSectionItems.find((entry) => entry.index === index);
    if (!item) {
      return;
    }

    const element = document.getElementById(getSectionAnchor(item.section.section_label, index));
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [structuredSectionItems]);

  const restartFocusedSection = useCallback(() => {
    if (focusedSectionIndex !== null) {
      scrollToSection(focusedSectionIndex);
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [focusedSectionIndex, scrollToSection]);

  const queueSeekToSecond = useCallback((targetSecond: number) => {
    queuedSeekRef.current = Math.max(0, targetSecond);
    setCurrentTime(Math.max(0, targetSecond));
  }, [setCurrentTime]);

  const seekToSectionStart = useCallback((sectionIndex: number) => {
    if (!hasStructuredSections || !effectiveRelatedDuration || structuredSectionItems.length === 0) {
      return;
    }

    const { start } = resolveSectionTiming(structuredSections, sectionIndex, effectiveRelatedDuration, {
      preferLoopWindow: loopFocusedSection,
    });
    queueSeekToSecond(start);
  }, [effectiveRelatedDuration, hasStructuredSections, loopFocusedSection, queueSeekToSecond, structuredSectionItems.length, structuredSections]);

  const handlePlayRelatedTrack = useCallback((options?: { seekToFocusedSection?: boolean }) => {
    if (!relatedHymnTrack || !canPlayRelatedTrack) {
      showToast('info', 'Áudio indisponível', 'Este hino relacionado ainda não possui áudio público para reprodução direta.');
      return;
    }

    setPlaybackContext({ type: 'unknown', id: `cifra:${slug || relatedHymnTrack.id}` });

    if (isRelatedTrackActive) {
      if (options?.seekToFocusedSection && focusedSectionIndex !== null) {
        seekToSectionStart(focusedSectionIndex);
      }

      if (isPlayerPlaying) {
        pause();
      } else {
        resume();
      }
      return;
    }

    play(relatedHymnTrack);
    if (options?.seekToFocusedSection && focusedSectionIndex !== null) {
      window.setTimeout(() => {
        seekToSectionStart(focusedSectionIndex);
      }, 450);
    }
  }, [
    canPlayRelatedTrack,
    focusedSectionIndex,
    isPlayerPlaying,
    isRelatedTrackActive,
    pause,
    play,
    relatedHymnTrack,
    resume,
    seekToSectionStart,
    setPlaybackContext,
    showToast,
    slug,
  ]);

  const handleRestartRelatedTrack = useCallback(() => {
    if (!relatedHymnTrack || !canPlayRelatedTrack) {
      return;
    }

    if (!isRelatedTrackActive) {
      handlePlayRelatedTrack({ seekToFocusedSection: false });
      window.setTimeout(() => queueSeekToSecond(0), 450);
      return;
    }

    queueSeekToSecond(0);
    if (!isPlayerPlaying) {
      resume();
    }
  }, [
    canPlayRelatedTrack,
    handlePlayRelatedTrack,
    isPlayerPlaying,
    isRelatedTrackActive,
    queueSeekToSecond,
    relatedHymnTrack,
    resume,
  ]);

  const loadCifra = async (slug: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setStudyModeEnabled(false);
      setFocusedSectionIndex(null);
      setSyncStudyWithAudio(false);
      setLoopFocusedSection(false);
      setUseTwoColumnLayout(false);
      setMetronomeEnabled(false);
      if (slug === DEMO_CIFRA_SLUG) {
        setCifra(DEMO_CIFRA);
        setEngagement(null);
        setSelectedKey(DEMO_CIFRA.original_key);
        setSelectedInstrument(DEMO_CIFRA.instrument);
        setMetronomeBpm(72);
        return;
      }

      const isAdminPreview = searchParams.get('preview') === 'admin';
      const requestedInstrument = routeInstrument as CifraInstrument | undefined;
      const publicData = isAdminPreview
        ? await fetchAdminPreviewCifraPageBySlug(slug, requestedInstrument)
        : await fetchPublicCifraPageBySlug(slug, requestedInstrument);
      if (publicData) {
        const defaultStudySectionIndex = resolveDefaultStudySectionIndex(
          publicData.sections,
          publicData.default_study_section_order,
        );

        setCifra(publicData);
        setEngagement(buildInitialEngagement(publicData));
        setSelectedKey(publicData.preferred_key || publicData.original_key);
        setSelectedInstrument(publicData.instrument);
        setMetronomeBpm(publicData.tempo_bpm || 72);
        setStudyModeEnabled(defaultStudySectionIndex !== null);
        setFocusedSectionIndex(defaultStudySectionIndex);
        setSyncStudyWithAudio(defaultStudySectionIndex !== null && publicData.default_study_sync_audio);
        setLoopFocusedSection(defaultStudySectionIndex !== null && publicData.default_study_loop_section);
        return;
      }

      const data = await fetchCifraBySlug(slug, routeInstrument);
      if (data) {
        setCifra(data);
        setEngagement(null);
        setSelectedKey(data.original_key);
        setSelectedInstrument(data.instrument);
        setMetronomeBpm(72);
        incrementCifraViews(data.id);
      } else {
        const redirectedCifra = await fetchCifraByLegacyHinarioSlug(slug);
        if (redirectedCifra) {
          navigate(buildCifraUrl(redirectedCifra.instrument, redirectedCifra.slug), { replace: true });
          return;
        }
        setEngagement(null);
        setError('Cifra não encontrada');
      }
    } catch (err: any) {
      setEngagement(null);
      setError(err?.message || 'Erro ao carregar cifra');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (queuedSeekRef.current === null || !isRelatedTrackActive || playerDuration <= 0) {
      return;
    }

    const targetSecond = queuedSeekRef.current;
    const currentDrift = Math.abs(playerCurrentTime - targetSecond);
    if (currentDrift <= 1.2) {
      queuedSeekRef.current = null;
    } else {
      setCurrentTime(targetSecond);
    }
  }, [isRelatedTrackActive, playerCurrentTime, playerDuration, setCurrentTime]);

  useEffect(() => {
    if (!studyModeEnabled || !syncStudyWithAudio || loopFocusedSection || !hasStructuredSections || !isRelatedTrackActive || playerDuration <= 0) {
      return;
    }

    const exactIndex = structuredSections.findIndex((_, index) => {
      const timing = resolveSectionTiming(structuredSections, index, playerDuration);
      return playerCurrentTime >= timing.start && playerCurrentTime < timing.end;
    });
    const progressRatio = Math.min(0.999, Math.max(0, playerCurrentTime / playerDuration));
    const estimatedIndex =
      exactIndex >= 0
        ? exactIndex
        : Math.min(
            structuredSectionItems.length - 1,
            Math.floor(progressRatio * structuredSectionItems.length),
          );

    if (lastSyncedSectionRef.current === estimatedIndex) {
      return;
    }

    lastSyncedSectionRef.current = estimatedIndex;
    setFocusedSectionIndex(estimatedIndex);
    scrollToSection(estimatedIndex);
  }, [
    hasStructuredSections,
    isRelatedTrackActive,
    loopFocusedSection,
    playerCurrentTime,
    playerDuration,
    scrollToSection,
    structuredSectionItems.length,
    structuredSections,
    studyModeEnabled,
    syncStudyWithAudio,
  ]);

  useEffect(() => {
    if (!studyModeEnabled || !loopFocusedSection || focusedSectionIndex === null || !hasStructuredSections || !isRelatedTrackActive || playerDuration <= 0) {
      return;
    }

    const { start, end } = resolveSectionTiming(structuredSections, focusedSectionIndex, playerDuration, {
      preferLoopWindow: true,
    });
    const now = Date.now();

    if (
      playerCurrentTime >= Math.max(start + 0.35, end - 0.4) &&
      now - lastLoopAtRef.current > 900
    ) {
      lastLoopAtRef.current = now;
      setCurrentTime(start);
      if (!isPlayerPlaying) {
        resume();
      }
      scrollToSection(focusedSectionIndex);
    }
  }, [
    focusedSectionIndex,
    hasStructuredSections,
    isPlayerPlaying,
    isRelatedTrackActive,
    loopFocusedSection,
    playerCurrentTime,
    playerDuration,
    resume,
    scrollToSection,
    setCurrentTime,
    structuredSectionItems.length,
    studyModeEnabled,
  ]);

  useEffect(() => {
    if (!studyModeEnabled) {
      setSyncStudyWithAudio(false);
      setLoopFocusedSection(false);
      lastSyncedSectionRef.current = null;
      return;
    }

    if (!syncStudyWithAudio) {
      lastSyncedSectionRef.current = null;
    }

    if (focusedSectionIndex === null) {
      setLoopFocusedSection(false);
    }
  }, [focusedSectionIndex, studyModeEnabled, syncStudyWithAudio]);

  const refreshEngagement = async (versionId: string) => {
    try {
      const snapshot = await fetchCifraEngagementSnapshot(versionId, user?.id || null);
      setEngagement(snapshot);
    } catch (refreshError) {
      console.error('Erro ao atualizar métricas da cifra:', refreshError);
    }
  };

  const handleInstrumentChange = (instrument: string) => {
    if (!cifra || !isCifraV2(cifra)) {
      setSelectedInstrument(instrument);
      return;
    }

    const matchingVersion = cifra.available_versions.find((version) => version.instrument === instrument);

    if (matchingVersion && matchingVersion.slug !== cifra.slug) {
      navigate(buildCifraUrl(matchingVersion.instrument, matchingVersion.slug));
      return;
    }

    setSelectedInstrument(instrument);
    if (matchingVersion) {
      setSelectedKey(matchingVersion.preferred_key || matchingVersion.original_key);
    }
  };

  // Auto-scroll
  const startAutoScroll = useCallback((speed: number) => {
    stopAutoScroll();
    if (speed <= 0) return;
    scrollIntervalRef.current = window.setInterval(() => {
      window.scrollBy({ top: speed, behavior: 'smooth' });
    }, 100);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoScrollSpeed > 0) {
      startAutoScroll(autoScrollSpeed);
    } else {
      stopAutoScroll();
    }
    return () => stopAutoScroll();
  }, [autoScrollSpeed, startAutoScroll, stopAutoScroll]);

  // Transposition
  const semitones = cifra ? getSemitonesBetweenKeys(cifra.original_key, selectedKey) : 0;
  const displayedContent = cifra && (selectedInstrument === 'violao' || selectedInstrument === 'ukulele') && useSimplifiedChords
    ? simplifyCifraContent(cifra.content, cifra.original_key)
    : cifra?.content || '';
  const transposedContent = cifra ? transposeCifraContent(displayedContent, semitones, selectedKey) : '';
  const chords = extractChords(transposedContent);
  const sidebarSearchResults = useMemo(() => {
    const term = sidebarSearchTerm.trim();
    if (!term) return [];
    const number = term.match(/^0*(\d{1,3})$/)?.[1];
    const normalize = (value: string) => value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    if (number) {
      return sidebarInstrumentCifras.filter((item) => new RegExp(`^Hino\\s+${Number(number)}\\b`, 'i').test(item.title)).slice(0, 1);
    }
    return sidebarInstrumentCifras.filter((item) => normalize(item.title).includes(normalize(term))).slice(0, 6);
  }, [sidebarInstrumentCifras, sidebarSearchTerm]);
  const shouldRenderTwoColumns = supportsTwoColumnLayout && useTwoColumnLayout && !studyModeEnabled;
  const focusedSectionWindow = useMemo(() => {
    if (focusedSectionIndex === null || !effectiveRelatedDuration || structuredSectionItems.length === 0) {
      return null;
    }

    return resolveSectionTiming(structuredSections, focusedSectionIndex, effectiveRelatedDuration, {
      preferLoopWindow: loopFocusedSection,
    });
  }, [effectiveRelatedDuration, focusedSectionIndex, loopFocusedSection, structuredSectionItems.length, structuredSections]);
  const focusedSectionHasEditorialTiming = focusedSectionIndex !== null
    ? Boolean(
        structuredSections[focusedSectionIndex]?.cue_start_seconds != null
        || structuredSections[focusedSectionIndex]?.cue_end_seconds != null
        || structuredSections[focusedSectionIndex]?.loop_start_seconds != null
        || structuredSections[focusedSectionIndex]?.loop_end_seconds != null,
      )
    : false;
  const editorialStudySectionLabel = useMemo(() => {
    if (!isCifraV2(cifra) || cifra.default_study_section_order == null) {
      return null;
    }

    const sectionIndex = resolveDefaultStudySectionIndex(structuredSections, cifra.default_study_section_order);
    if (sectionIndex === null) {
      return null;
    }

    return structuredSections[sectionIndex]?.section_label || `Seção ${cifra.default_study_section_order}`;
  }, [cifra, structuredSections]);
  const handleShapeSelection = (chord: string, shapeId: string) => {
    setSelectedShapeIds((current) => ({ ...current, [chord]: shapeId }));
  };

  const transposeUp = () => {
    const majorKeys = ALL_KEYS.filter(k => !k.includes('m'));
    const minorKeys = ALL_KEYS.filter(k => k.includes('m'));
    const keys = selectedKey.includes('m') ? minorKeys : majorKeys;
    const idx = keys.indexOf(selectedKey);
    const newIdx = (idx + 1) % keys.length;
    setSelectedKey(keys[newIdx]);
  };

  const transposeDown = () => {
    const majorKeys = ALL_KEYS.filter(k => !k.includes('m'));
    const minorKeys = ALL_KEYS.filter(k => k.includes('m'));
    const keys = selectedKey.includes('m') ? minorKeys : majorKeys;
    const idx = keys.indexOf(selectedKey);
    const newIdx = (idx - 1 + keys.length) % keys.length;
    setSelectedKey(keys[newIdx]);
  };

  const handlePrint = async () => {
    if (!user) {
      showToast('info', 'Cadastro necessário', 'Crie sua conta gratuita para imprimir a partitura.');
      navigate(`/register?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    if (cifra && isCifraV2(cifra)) {
      try {
        await trackCifraUsageEvent(cifra.id, 'print', {
          userId: user?.id || null,
          metadata: { slug: cifra.slug },
        });
        setEngagement((current) => current ? {
          ...current,
          printsCount: current.printsCount + 1,
        } : current);
      } catch (printError) {
        console.error('Erro ao registrar impressão da cifra:', printError);
      }
    }

    window.print();
  };

  const handleShare = async () => {
    let shared = false;

    if (navigator.share) {
      try {
        await navigator.share({
          title: cifra?.title,
          url: window.location.href,
        });
        shared = true;
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      shared = true;
      showToast('success', 'Link copiado', 'O link da cifra foi copiado para a área de transferência.');
    }

    if (shared && cifra && isCifraV2(cifra)) {
      try {
        await trackCifraUsageEvent(cifra.id, 'share', {
          userId: user?.id || null,
          metadata: { slug: cifra.slug },
        });
        setEngagement((current) => current ? {
          ...current,
          sharesCount: current.sharesCount + 1,
        } : current);
      } catch (shareError) {
        console.error('Erro ao registrar compartilhamento da cifra:', shareError);
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!cifra || !isCifraV2(cifra)) {
      showToast('info', 'Favorito indisponível', 'Os favoritos avançados ficam disponíveis nas cifras publicadas do módulo novo.');
      return;
    }

    if (!user?.id) {
      showToast('info', 'Faça login para favoritar', 'Entre na sua conta para salvar esta cifra nos seus favoritos.');
      return;
    }

    try {
      setIsFavoriteLoading(true);
      if (engagement?.isFavorited) {
        await removeCifraFavorite(cifra.id, user.id);
        showToast('success', 'Favorito removido', 'A cifra foi removida da sua coleção.');
      } else {
        await addCifraFavorite(cifra.id, user.id);
        showToast('success', 'Cifra favoritada', 'A cifra foi adicionada aos seus favoritos.');
      }
      await refreshEngagement(cifra.id);
    } catch (favoriteError) {
      console.error('Erro ao alternar favorito da cifra:', favoriteError);
      showToast('error', 'Erro ao favoritar', 'Não foi possível atualizar seus favoritos agora.');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!cifra || !isCifraV2(cifra)) {
      return;
    }

    if (!reportMessage.trim() || reportMessage.trim().length < 10) {
      showToast('warning', 'Descreva o problema', 'Explique com mais detalhes o que precisa ser corrigido nesta cifra.');
      return;
    }

    try {
      setIsSubmittingReport(true);
      await submitCifraReport({
        versionId: cifra.id,
        reportType,
        message: reportMessage.trim(),
        reporterEmail: reporterEmail.trim() || user?.email || null,
        reporterUserId: user?.id || null,
      });

      showToast('success', 'Denúncia enviada', 'Recebemos seu relato e ele entrou na fila de revisão editorial.');
      setShowReportModal(false);
      setReportMessage('');
      await refreshEngagement(cifra.id);
    } catch (reportError) {
      console.error('Erro ao enviar denúncia da cifra:', reportError);
      showToast('error', 'Erro ao enviar denúncia', 'Não foi possível registrar o problema agora. Tente novamente.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Render chord line with colored chords
  const renderLine = (line: string, idx: React.Key) => {
    if (isSectionLine(line)) {
      return (
        <div key={idx} className="mt-8 mb-3 text-base font-medium text-gray-500 sm:font-bold sm:text-white print:font-medium print:text-[#252525]">
          {line}
        </div>
      );
    }
    if (isChordLine(line) && showChords) {
      return (
        <div key={idx} className="whitespace-pre text-primary-400 sm:text-primary-400 print:text-primary-600">
          {line}
        </div>
      );
    }
    if (isChordLine(line) && !showChords) {
      return null;
    }
    return (
      <div key={idx} className="whitespace-pre-wrap text-gray-100 sm:text-gray-200 print:text-[#252525]">
        {line || '\u00A0'}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !cifra) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Music className="w-16 h-16 text-gray-600" />
        <h2 className="text-xl text-gray-400">{error || 'Cifra não encontrada'}</h2>
        <Link to="/cifras" className="text-primary-400 hover:underline">
          Voltar para cifras
        </Link>
      </div>
    );
  }

  const instrumentOptions = isCifraV2(cifra)
    ? Array.from(new Map(cifra.available_versions.map((version) => [version.instrument, version])).values())
        .map((version) => ({
          value: version.instrument,
          label: PUBLIC_INSTRUMENTS.find((entry) => entry.value === version.instrument)?.label || version.instrument,
          slug: version.slug,
        }))
    : PUBLIC_INSTRUMENTS;
  const instrumentLabel = PUBLIC_INSTRUMENTS.find(i => i.value === cifra.instrument)?.label || cifra.instrument;
  const seoInstrumentLabel = cifra.instrument === 'violao' ? 'Violão' : instrumentLabel;
  const editorialPreferredKey =
    isCifraV2(cifra) && cifra.preferred_key && cifra.preferred_key !== cifra.original_key
      ? cifra.preferred_key
      : null;
  const instrumentHubMap: Record<string, string> = {
    violao: '/cifras-violao-ccb',
    ukulele: '/cifras-ukulele-ccb',
    teclado: '/cifras-teclado-ccb',
  };
  const instrumentHubUrl = instrumentHubMap[cifra.instrument] || '/cifras';
  const relatedNumber = relatedHymn?.numero || relatedLyric?.numero || (isCifraV2(cifra) ? cifra.hinario_numero : null) || extractHymnNumber(cifra.title);
  const displayCifraTitle = stripTrailingArtistFromTitle(relatedHymn?.titulo || relatedLyric?.titulo || cifra.title, cifra.artist)
    .replace(/\s*[-–—]\s*Elias Brandão\s*$/i, '')
    .replace(/^\s*(?:hino\s*)?\d+\s*(?:ccb)?\s*[-–—:.]\s*/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  // The artist/category remains available below the title; avoid repeating it
  // in the visible hymn heading (for example, "(Hinário CCB)").
  const headerCifraTitle = displayCifraTitle;
  const headerCifraCategory = getCifraCategoryLabel(cifra.category);
  const hinarioRange = getHinarioRangeForNumero(relatedNumber);
  const isGenericHinarioTitle = relatedNumber !== null && new RegExp(`^hino\\s*${relatedNumber}\\s*$`, 'i').test(displayCifraTitle);
  const cifraTitle = relatedNumber
    ? `Cifra Hino ${relatedNumber} CCB${isGenericHinarioTitle ? '' : ` - ${displayCifraTitle}`} para ${seoInstrumentLabel}. Aprenda a tocar!`
    : `Cifra ${displayCifraTitle} para ${seoInstrumentLabel}. Aprenda a tocar!`;
  const rawCifraDescription = relatedNumber
    ? `Aprenda a tocar no ${seoInstrumentLabel.toLowerCase()} a cifra do Hino ${relatedNumber} CCB${isGenericHinarioTitle ? '' : `, ${displayCifraTitle}`}. Confira acordes, tom original, transposição e letra para estudar, ensaiar e tocar com segurança.`
    : `Aprenda a tocar no ${seoInstrumentLabel.toLowerCase()} a cifra de ${displayCifraTitle}. Confira acordes, tom original, transposição e letra para estudar, ensaiar e tocar com segurança.`;
  const cifraDescription = rawCifraDescription.length <= 180
    ? rawCifraDescription
    : `${rawCifraDescription.slice(0, 177).replace(/\s+\S*$/, '')}…`;
  const cifraKeywords = (isCifraV2(cifra) ? cifra.seo_keywords : null) || [
    cifra.title,
    cifra.artist,
    relatedNumber ? `hino ${relatedNumber} ccb cifra` : null,
    relatedNumber ? `cifra hino ${relatedNumber} ccb` : null,
    relatedNumber ? `letra hino ${relatedNumber} ccb` : null,
    'cifras hinos ccb',
    instrumentLabel,
  ].filter(Boolean).join(', ');
  const renderChordDiagrams = (className = '') => showChords ? (
    <ChordDictionaryCarousel
      chords={chords}
      chordShapeVariants={chordShapeVariants}
      selectedShapeIds={selectedShapeIds}
      selectedInstrument={selectedInstrument}
      selectedKey={selectedKey}
      originalKey={cifra.original_key}
      instrumentLabel={instrumentLabel}
      leftHanded={showLeftHandedDiagrams}
      chordOverrides={isCifraV2(cifra) ? cifra.chord_overrides : null}
      onSelectShape={handleShapeSelection}
      className={className}
      bare
    />
  ) : null;
  return (
    <>
    <SEOHead
      title={cifraTitle}
      description={cifraDescription}
      keywords={cifraKeywords}
      canonical={buildCifraUrl(cifra.instrument, slug)}
      ogImage={cifra.cover_url}
      schemaData={[
        generateCifraSchema({
          name: displayCifraTitle,
          url: buildCifraUrl(cifra.instrument, slug),
          artist: cifra.artist,
          description: `Cifra e acordes de ${displayCifraTitle} - Tom: ${cifra.original_key}`,
          image: cifra.cover_url,
          datePublished: cifra.created_at,
          dateModified: cifra.updated_at,
          musicalKey: cifra.original_key,
          instrument: cifra.instrument,
        }),
        generateBreadcrumbSchema([
          { name: 'Início', url: '/' },
          { name: 'Cifras', url: '/cifras' },
          { name: displayCifraTitle, url: buildCifraUrl(cifra.instrument, slug) },
        ]),
      ]}
    />
    <div className="min-h-screen overflow-x-clip bg-[#080909] px-6 pt-6 pb-36 text-white sm:mx-auto sm:min-h-0 sm:max-w-6xl sm:bg-transparent sm:px-4 sm:py-6 sm:pb-6 sm:text-inherit print:max-w-none print:bg-white print:px-12 print:py-10 print:pb-0 print:text-[#252525]">
      <div className="mb-14 hidden print:block">
        <div className="flex items-start justify-between gap-8">
          <div>
            <h1 className="text-[34px] font-black leading-tight tracking-[-0.03em] text-[#202124]">{displayCifraTitle}</h1>
          </div>
          <div className="text-right text-2xl font-black text-[#202124]">Cânticos CCB</div>
        </div>
        <div className="mt-10 space-y-6 font-mono text-[17px] leading-relaxed text-[#252525]">
          <p className="font-bold">Tom: <span className="text-primary-600">{selectedKey}</span>{selectedKey !== cifra.original_key ? ` (forma dos acordes no tom de ${cifra.original_key})` : ''}</p>
          {isCifraV2(cifra) && cifra.tuning ? (
            <p>Afinação: <span className="font-bold text-primary-600">{cifra.tuning}</span></p>
          ) : null}
          {cifra.capo > 0 ? (
            <p>Capotraste na <span className="font-bold text-primary-600">{cifra.capo}ª casa</span></p>
          ) : null}
        </div>
      </div>

      {/* Mobile stage header */}
      <div className="mb-9 sm:hidden print:hidden">
        <div className="flex items-start gap-4">
          <Link
            to="/cifras"
            aria-label="Voltar para cifras"
            className="mt-1 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white shadow-lg shadow-black/30 transition-colors active:scale-95"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] font-black leading-[1.02] tracking-[-0.04em] text-white">{headerCifraTitle}</h1>
            <nav aria-label="Breadcrumb" className="mt-2 flex items-center gap-1 text-sm">
              <Link to="/cifras" className="text-primary-400 hover:text-primary-300">Cifras</Link>
              <span className="text-gray-600">/</span>
              <Link to={instrumentHubUrl} className="text-gray-300 hover:text-primary-300">{instrumentLabel}</Link>
            </nav>
          </div>
          <button
            type="button"
            onClick={() => setShowOptions(true)}
            aria-label="Abrir opções da cifra"
            className="mt-1 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white shadow-lg shadow-black/30 transition-colors active:scale-95"
          >
            <Settings2 className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 pl-16">
          <button
            type="button"
            onClick={() => setShowOptions(true)}
            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-gray-100"
          >
            Tom <span className="text-primary-400">{selectedKey}</span>
          </button>
          {cifra.capo > 0 ? (
            <button
              type="button"
              onClick={() => setShowOptions(true)}
              className="rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-2 text-sm font-semibold text-gray-100"
            >
              Capo <span className="text-primary-400">{cifra.capo}ª casa</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setMetronomeEnabled((current) => !current)}
            className={`hidden text-left font-bold ${
              metronomeEnabled
                ? 'text-[#118a42]'
                : 'text-[#252525]'
            }`}
          >
            {metronomeEnabled ? `${metronomeBpm} BPM` : 'Metrônomo'}
          </button>
        </div>
      </div>

      <div className={`grid gap-6 lg:items-start ${isSidebarCollapsed ? 'lg:grid-cols-[60px,minmax(0,1fr)]' : 'lg:grid-cols-[240px,minmax(0,1fr)]'}`}>
      {/* Recursos e controlos */}
      {!isSidebarCollapsed && (
        <aside className="relative sticky top-[88px] z-40 col-start-1 row-start-1 hidden space-y-3 print:hidden lg:block">
          <button type="button" onClick={() => setIsSidebarCollapsed(true)} title="Encolher barra lateral" aria-label="Encolher barra lateral" className="absolute -top-2 right-3 z-10 flex h-4 w-4 items-center justify-center rounded-md border border-gray-700 bg-[#080909] text-gray-400 transition-colors hover:border-primary-500/50 hover:text-white"><PanelLeftClose className="h-2 w-2" /></button>
          <div className="flex items-center justify-between gap-2 px-1 pt-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Ferramentas</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={handlePrint} title="Imprimir" aria-label="Imprimir" className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"><Printer className="h-4 w-4" /></button>
              <button type="button" onClick={handleShare} title="Compartilhar" aria-label="Compartilhar" className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"><Share2 className="h-4 w-4" /></button>
            </div>
          </div>

          <section className="overflow-hidden rounded-2xl border border-gray-700/80 bg-gray-800/75 shadow-lg shadow-black/20">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-primary-400" />
              <label htmlFor="sidebar-hymn-search" className="sr-only">Buscar hino</label>
              <input
                id="sidebar-hymn-search"
                type="search"
                value={sidebarSearchTerm}
                onChange={(event) => setSidebarSearchTerm(event.target.value)}
                placeholder="Buscar hino"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
              />
            </div>
            {sidebarSearchTerm.trim() ? (
              <div className="max-h-56 overflow-y-auto border-t border-gray-700/80">
                {sidebarSearchResults.length > 0 ? sidebarSearchResults.map((item) => {
                  const number = item.title.match(/^Hino\s+(\d{1,3})\b/i)?.[1];
                  const name = item.title.replace(/^Hino\s+\d{1,3}\s*-\s*/i, '');
                  return <Link key={item.id} to={buildCifraUrl(item.instrument, item.slug)} onClick={() => setSidebarSearchTerm('')} className="flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-white/[0.05]"><span className="font-mono text-xs text-primary-300">{number?.padStart(2, '0')}</span><span className="min-w-0 flex-1 truncate text-white">{name}</span><ChevronRight className="h-4 w-4 text-gray-500" /></Link>;
                }) : <p className="px-3 py-2.5 text-xs text-gray-400">Nenhum hino encontrado.</p>}
              </div>
            ) : null}
          </section>

          <div className="overflow-hidden rounded-2xl border border-gray-700/80 bg-gray-800/75 shadow-lg shadow-black/20">
            <button type="button" onClick={() => setAutoScrollSpeed((current) => current === 0 ? 1 : 0)} className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-gray-100 transition-colors hover:bg-gray-700/70">
              <ScrollText className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Rolagem</span><span className="text-xs text-gray-400">{autoScrollSpeed > 0 ? `${autoScrollSpeed}x` : 'Desligada'}</span><ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
            {supportsTwoColumnLayout ? <button type="button" onClick={() => setUseTwoColumnLayout((current) => !current)} className="flex w-full items-center gap-3 border-t border-gray-700/80 px-3 py-3 text-left text-sm text-gray-100 transition-colors hover:bg-gray-700/70"><Columns className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Dividir em colunas</span><span className="text-xs text-gray-400">{useTwoColumnLayout ? 'Ativo' : 'Desligado'}</span><ChevronRight className="h-4 w-4 text-gray-500" /></button> : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-700/80 bg-gray-800/75 shadow-lg shadow-black/20">
            <button type="button" onClick={() => setShowOptions(true)} className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-gray-100 transition-colors hover:bg-gray-700/70"><GiGuitar className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Instrumento</span><span className="max-w-[90px] truncate text-xs text-gray-400">{instrumentLabel}</span><ChevronRight className="h-4 w-4 text-gray-500" /></button>
            <div className="flex items-center gap-3 border-t border-gray-700/80 px-3 py-3 text-sm text-gray-100"><Music className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Tom</span><button type="button" onClick={transposeDown} aria-label="Diminuir tom" className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-500 text-gray-300 hover:bg-gray-700"><Minus className="h-3 w-3" /></button><button type="button" onClick={() => setShowKeySelector(true)} className="font-semibold text-primary-300">{selectedKey}</button><button type="button" onClick={transposeUp} aria-label="Aumentar tom" className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-500 text-gray-300 hover:bg-gray-700"><Plus className="h-3 w-3" /></button></div>
            <div className="flex items-center gap-3 border-t border-gray-700/80 px-3 py-3 text-sm text-gray-100"><Target className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Capotraste</span><span className="text-xs text-gray-400">{cifra.capo > 0 ? `${cifra.capo}ª casa` : 'Sem capo'}</span></div>
            <div className="flex items-center gap-3 border-t border-gray-700/80 px-3 py-3 text-sm text-gray-100"><Settings2 className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Afinação</span><span className="text-xs text-gray-400">{isCifraV2(cifra) && cifra.tuning ? cifra.tuning : 'Padrão'}</span></div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-700/80 bg-gray-800/75 shadow-lg shadow-black/20">
            <button type="button" onClick={() => setShowChords((current) => !current)} className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-gray-100 transition-colors hover:bg-gray-700/70"><Music className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Acordes</span><span className="text-xs text-gray-400">{showChords ? 'Mostrar' : 'Ocultar'}</span><ChevronRight className="h-4 w-4 text-gray-500" /></button>
            {(selectedInstrument === 'violao' || selectedInstrument === 'ukulele') ? <button type="button" onClick={() => setUseSimplifiedChords((current) => !current)} className="flex w-full items-center gap-3 border-t border-gray-700/80 px-3 py-3 text-left text-sm text-gray-100 transition-colors hover:bg-gray-700/70"><Target className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Modo simplificado</span><span className="text-xs text-gray-400">{useSimplifiedChords ? 'Ativo' : 'Completo'}</span><ChevronRight className="h-4 w-4 text-gray-500" /></button> : null}
            {selectedInstrument !== 'teclado' ? <button type="button" onClick={() => setShowLeftHandedDiagrams((current) => !current)} className="flex w-full items-center gap-3 border-t border-gray-700/80 px-3 py-3 text-left text-sm text-gray-100 transition-colors hover:bg-gray-700/70"><Hand className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Diagramas</span><span className="text-xs text-gray-400">{showLeftHandedDiagrams ? 'Canhoto' : 'Destro'}</span><ChevronRight className="h-4 w-4 text-gray-500" /></button> : null}
            <div className="flex items-center gap-3 border-t border-gray-700/80 px-3 py-3 text-sm text-gray-100"><Type className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Texto</span><button type="button" onClick={() => setFontSize((current) => Math.max(10, current - 1))} aria-label="Diminuir fonte" className="text-gray-300 hover:text-white"><Minus className="h-4 w-4" /></button><span className="min-w-9 text-center text-xs text-gray-400">{fontSize}px</span><button type="button" onClick={() => setFontSize((current) => Math.min(24, current + 1))} aria-label="Aumentar fonte" className="text-gray-300 hover:text-white"><Plus className="h-4 w-4" /></button></div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-700/80 bg-gray-800/75 shadow-lg shadow-black/20">
            <button type="button" onClick={() => setMetronomeEnabled((current) => !current)} className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-gray-100 transition-colors hover:bg-gray-700/70"><Gauge className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Metrônomo</span><span className="text-xs text-gray-400">{metronomeEnabled ? `${metronomeBpm} BPM` : 'Desligado'}</span><ChevronRight className="h-4 w-4 text-gray-500" /></button>
            <button type="button" onClick={() => setShowReportModal(true)} className="flex w-full items-center gap-3 border-t border-gray-700/80 px-3 py-3 text-left text-sm text-gray-100 transition-colors hover:bg-gray-700/70"><Flag className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Corrigir Cifra</span><ChevronRight className="h-4 w-4 text-gray-500" /></button>
          </div>
        </aside>
      )}
      <div className={`sticky top-16 z-40 hidden bg-background-primary/95 shadow-lg shadow-black/20 backdrop-blur-sm border-b border-gray-800 -mx-4 px-4 py-3 mb-6 sm:block lg:col-start-1 lg:row-start-1 lg:top-[88px] lg:mx-0 lg:mb-0 lg:rounded-2xl lg:border print:hidden ${isSidebarCollapsed ? 'lg:p-2' : 'lg:hidden'}`}>
        {isSidebarCollapsed && (
          <div className="hidden flex-col items-stretch gap-1.5 lg:flex">
            <button type="button" onClick={() => setIsSidebarCollapsed(false)} title="Expandir barra lateral" aria-label="Expandir barra lateral" className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-primary-500/50 hover:text-white"><PanelLeftOpen className="h-4 w-4" /></button>
            <button type="button" onClick={handlePrint} title="Imprimir" aria-label="Imprimir" className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-primary-500/50 hover:text-white"><Printer className="h-4 w-4" /></button>
            <button type="button" onClick={handleShare} title="Compartilhar" aria-label="Compartilhar" className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-primary-500/50 hover:text-white"><Share2 className="h-4 w-4" /></button>
            <button type="button" onClick={() => setAutoScrollSpeed((current) => current === 0 ? 1 : 0)} title="Rolagem" aria-label="Rolagem" className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-primary-500/50 hover:text-white"><ScrollText className="h-4 w-4" /></button>
            {supportsTwoColumnLayout ? <button type="button" onClick={() => setUseTwoColumnLayout((current) => !current)} title="Dividir em colunas" aria-label="Dividir em colunas" className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-primary-500/50 hover:text-white"><Columns className="h-4 w-4" /></button> : null}
            <button type="button" onClick={() => setShowOptions(true)} title="Instrumento" aria-label="Instrumento" className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-primary-500/50 hover:text-white"><GiGuitar className="h-4 w-4" /></button>
            <button type="button" onClick={() => setShowKeySelector(true)} title="Tom" aria-label="Tom" className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-primary-500/50 hover:text-white"><Music className="h-4 w-4" /></button>
            <span title={cifra.capo > 0 ? `Capotraste: ${cifra.capo}ª casa` : 'Sem capotraste'} className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300"><Target className="h-4 w-4" /></span>
            <span title={isCifraV2(cifra) && cifra.tuning ? `Afinação: ${cifra.tuning}` : 'Afinação padrão'} className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300"><Settings2 className="h-4 w-4" /></span>
            <button type="button" onClick={() => setShowChords((current) => !current)} title="Acordes" aria-label="Acordes" className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-primary-500/50 hover:text-white"><Music className="h-4 w-4" /></button>
            {(selectedInstrument === 'violao' || selectedInstrument === 'ukulele') ? <button type="button" onClick={() => setUseSimplifiedChords((current) => !current)} title="Modo simplificado" aria-label="Modo simplificado" className={`flex h-9 w-full items-center justify-center rounded-lg border transition-colors ${useSimplifiedChords ? 'border-primary-500/60 bg-primary-500/15 text-primary-300' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-primary-500/50 hover:text-white'}`}><Target className="h-4 w-4" /></button> : null}
            {selectedInstrument !== 'teclado' ? <button type="button" onClick={() => setShowLeftHandedDiagrams((current) => !current)} title="Diagramas" aria-label="Diagramas" className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-primary-500/50 hover:text-white"><Hand className="h-4 w-4" /></button> : null}
            <button type="button" onClick={() => setShowOptions(true)} title="Texto" aria-label="Texto" className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-primary-500/50 hover:text-white"><Type className="h-4 w-4" /></button>
            <button type="button" onClick={() => setMetronomeEnabled((current) => !current)} title="Metrônomo" aria-label="Metrônomo" className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-primary-500/50 hover:text-white"><Gauge className="h-4 w-4" /></button>
            <button type="button" onClick={() => setShowReportModal(true)} title="Corrigir Cifra" aria-label="Corrigir Cifra" className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-primary-500/50 hover:text-white"><Flag className="h-4 w-4" /></button>
          </div>
        )}
        <div className={`mb-4 space-y-2 border-b border-gray-800 pb-4 lg:space-y-2 lg:hidden ${isSidebarCollapsed ? 'lg:mb-2 lg:pb-2' : ''}`}>
          <div className={`flex items-center justify-between px-1 ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>Recursos</p>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Encolher barra lateral'}
              title={isSidebarCollapsed ? 'Expandir barra lateral' : 'Encolher barra lateral'}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-primary-500/50 hover:text-white"
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>
          {isCifraV2(cifra) ? (
            <>
              <button type="button" onClick={() => void handleToggleFavorite()} disabled={isFavoriteLoading} title={engagement?.isFavorited ? 'Favoritada' : 'Favoritar'} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''} ${engagement?.isFavorited ? 'border-red-500/50 bg-red-500/15 text-red-300' : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-red-500/40 hover:text-white'}`}>
                <Heart className={`h-4 w-4 ${engagement?.isFavorited ? 'fill-current' : ''}`} /> <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>{engagement?.isFavorited ? 'Favoritada' : 'Favoritar'}</span>
              </button>
              <button type="button" onClick={() => setShowReportModal(true)} title="Reportar problema" className={`flex w-full items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-left text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}><Flag className="h-4 w-4" /> <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Reportar problema</span></button>
            </>
          ) : null}
          {relatedHymn ? <Link to={buildHinoUrl(relatedHymn.id, relatedHymn.titulo, relatedHymn.numero)} title="Ouvir este hino" className={`flex w-full items-center gap-2 rounded-xl border border-primary-500/40 bg-primary-500/10 px-3 py-2 text-sm text-primary-300 transition-colors hover:bg-primary-500/20 ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}><Play className="h-4 w-4" /> <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Ouvir este hino</span></Link> : null}
          {relatedLyric ? <Link to={buildHinarioUrl(relatedLyric.numero, relatedLyric.titulo)} title="Letra no Hinário" className={`flex w-full items-center gap-2 rounded-xl border border-primary-500/40 bg-primary-500/10 px-3 py-2 text-sm text-primary-300 transition-colors hover:bg-primary-500/20 ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}><Music className="h-4 w-4" /> <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Letra no Hinário</span></Link> : null}
          <Link to={instrumentHubUrl} title={`Mais cifras de ${instrumentLabel}`} className={`flex w-full items-center gap-2 rounded-xl border border-primary-500/40 bg-primary-500/10 px-3 py-2 text-sm text-primary-300 transition-colors hover:bg-primary-500/20 ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}><Music className="h-4 w-4" /> <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Mais cifras de {instrumentLabel}</span></Link>
          <Link to="/cifras" title="Todas as cifras" className={`flex w-full items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}><ListMusic className="h-4 w-4" /> <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Todas as cifras</span></Link>
          <Link to="/hinario" title="Letras do Hinário" className={`flex w-full items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}><BookOpen className="h-4 w-4" /> <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Letras do Hinário</span></Link>
          <Link to="/cifras-hinos-ccb" title="Cifras de Hinos" className={`flex w-full items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}><Library className="h-4 w-4" /> <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Cifras de Hinos</span></Link>
          {hinarioRange ? <Link to={hinarioRange.path} title={hinarioRange.label} className={`flex w-full items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}><BookOpen className="h-4 w-4" /> <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>{hinarioRange.label}</span></Link> : null}
        </div>
        <div className={`flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible lg:flex-col lg:items-stretch lg:overflow-visible lg:hidden ${isSidebarCollapsed ? 'lg:gap-1.5' : ''}`}>
          {/* Transpose controls */}
          <div className={`flex shrink-0 items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg ${isSidebarCollapsed ? 'lg:flex-col lg:gap-0' : ''}`}>
            <button onClick={transposeDown} title="Diminuir tom" aria-label="Diminuir tom" className={`px-3 py-2 hover:bg-gray-700 transition-colors text-white ${isSidebarCollapsed ? 'lg:w-full lg:rounded-t-lg' : 'rounded-l-lg'}`}>
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowKeySelector(!showKeySelector)}
              className={`px-3 py-2 hover:bg-gray-700 transition-colors text-sm font-medium min-w-[60px] text-center ${isSidebarCollapsed ? 'lg:hidden' : ''}`}
            >
              <span className="text-gray-400 text-xs">Tom </span>
              <span className="text-primary-400 font-bold">{selectedKey}</span>
            </button>
            <button onClick={transposeUp} title="Aumentar tom" aria-label="Aumentar tom" className={`px-3 py-2 hover:bg-gray-700 transition-colors text-white ${isSidebarCollapsed ? 'lg:w-full lg:rounded-b-lg' : 'rounded-r-lg'}`}>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {editorialPreferredKey ? (
            <button
              onClick={() => setSelectedKey(editorialPreferredKey)}
              title={`Tom editorial ${editorialPreferredKey}`}
              className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${isSidebarCollapsed ? 'lg:flex lg:w-full lg:justify-center' : ''} ${
                selectedKey === editorialPreferredKey
                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-primary-500/40'
              }`}
            >
              <Music className={`h-4 w-4 ${isSidebarCollapsed ? '' : 'hidden'}`} />
              <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Tom editorial {editorialPreferredKey}</span>
            </button>
          ) : null}

          {/* Auto scroll */}
          <button
            onClick={() => setAutoScrollSpeed(prev => prev === 0 ? 1 : prev === 1 ? 2 : prev === 2 ? 3 : 0)}
            title={autoScrollSpeed > 0 ? `Rolagem ${autoScrollSpeed}x` : 'Ativar rolagem automática'}
            className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${isSidebarCollapsed ? 'lg:flex lg:w-full lg:justify-center' : ''} ${
              autoScrollSpeed > 0
                ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <ScrollText className={`w-4 h-4 ${isSidebarCollapsed ? '' : 'inline mr-1'}`} />
            <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>{autoScrollSpeed > 0 ? `${autoScrollSpeed}x` : 'Rolagem'}</span>
          </button>

          {/* Toggle chords */}
          <button
            onClick={() => setShowChords(!showChords)}
            title={showChords ? 'Ocultar acordes' : 'Mostrar acordes'}
            className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${isSidebarCollapsed ? 'lg:flex lg:w-full lg:justify-center' : ''} ${
              showChords
                ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}
          >
            <Music className={`h-4 w-4 ${isSidebarCollapsed ? '' : 'hidden'}`} />
            <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Acordes</span>
          </button>

          <button
            onClick={() => setMetronomeEnabled((current) => !current)}
            title={metronomeEnabled ? `Metrônomo ${metronomeBpm} BPM` : 'Iniciar metrônomo'}
            className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${isSidebarCollapsed ? 'lg:flex lg:w-full lg:justify-center' : ''} ${
              metronomeEnabled
                ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <Gauge className={`w-4 h-4 ${isSidebarCollapsed ? '' : 'inline mr-1'}`} />
            <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>{metronomeEnabled ? `${metronomeBpm} BPM` : 'Metrônomo'}</span>
          </button>

          {selectedInstrument !== 'teclado' ? (
            <button
              onClick={() => setShowLeftHandedDiagrams((current) => !current)}
              title={showLeftHandedDiagrams ? 'Desativar modo canhoto' : 'Ativar modo canhoto'}
              className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${isSidebarCollapsed ? 'lg:flex lg:w-full lg:justify-center' : ''} ${
                showLeftHandedDiagrams
                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <Hand className={`w-4 h-4 ${isSidebarCollapsed ? '' : 'inline mr-1'}`} />
              <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Canhoto</span>
            </button>
          ) : null}

          {supportsTwoColumnLayout ? (
            <button
              onClick={() => setUseTwoColumnLayout((current) => !current)}
              title={useTwoColumnLayout ? 'Usar uma coluna' : 'Usar duas colunas'}
              className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${isSidebarCollapsed ? 'lg:flex lg:w-full lg:justify-center' : ''} ${
                useTwoColumnLayout
                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <Eye className={`w-4 h-4 ${isSidebarCollapsed ? '' : 'inline mr-1'}`} />
              <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>2 colunas</span>
            </button>
          ) : null}

          {supportsStudyTools ? (
            <button
              onClick={() => {
                setStudyModeEnabled((current) => {
                  const next = !current;
                  if (!next) {
                    setFocusedSectionIndex(null);
                  }
                  return next;
                });
              }}
              title={studyModeEnabled ? 'Desativar modo estudo' : 'Ativar modo estudo'}
              className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${isSidebarCollapsed ? 'lg:flex lg:w-full lg:justify-center' : ''} ${
                studyModeEnabled
                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <Target className={`w-4 h-4 ${isSidebarCollapsed ? '' : 'inline mr-1'}`} />
              <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Estudo</span>
            </button>
          ) : null}

          {/* Options */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            title="Opções da cifra"
            aria-label="Opções da cifra"
            className={`shrink-0 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors sm:ml-auto ${isSidebarCollapsed ? 'lg:flex lg:w-full lg:justify-center lg:px-2' : ''}`}
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Key selector dropdown */}
        {showKeySelector && (
          <div className="absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 rounded-b-xl p-4 shadow-2xl z-30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Tom</h3>
              <button onClick={() => setShowKeySelector(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_KEYS.filter(k => !k.includes('m')).map(k => (
                <button
                  key={k}
                  onClick={() => { setSelectedKey(k); setShowKeySelector(false); }}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    k === selectedKey
                      ? 'bg-primary-500 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-3 mb-2">Menores</p>
            <div className="flex flex-wrap gap-2">
              {ALL_KEYS.filter(k => k.includes('m')).map(k => (
                <button
                  key={k}
                  onClick={() => { setSelectedKey(k); setShowKeySelector(false); }}
                  className={`px-3 h-10 rounded-lg text-sm font-medium transition-colors ${
                    k === selectedKey
                      ? 'bg-primary-500 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Options panel */}
        {showOptions && (
          <div className="absolute top-full left-4 right-4 z-30 rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-2xl sm:left-auto sm:right-4 sm:w-64">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Opções da cifra</h3>
              <button onClick={() => setShowOptions(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <button onClick={handlePrint} className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm">
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button onClick={handleShare} className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm">
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
              <div className="border-t border-gray-700 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs">Metrônomo</p>
                    <p className="text-white font-medium">{metronomeBpm} BPM · {measureBeats}/4</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMetronomeEnabled((current) => !current)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      metronomeEnabled
                        ? 'border-primary-500 bg-primary-500 text-black'
                        : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-primary-500/40 hover:text-white'
                    }`}
                  >
                    {metronomeEnabled ? 'Parar' : 'Iniciar'}
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button onClick={() => setMetronomeBpm((current) => Math.max(40, current - 2))} className="p-1 bg-gray-800 rounded text-white">
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="range"
                    min={40}
                    max={180}
                    step={1}
                    value={metronomeBpm}
                    onChange={(event) => setMetronomeBpm(Number(event.target.value))}
                    className="flex-1 accent-primary-500"
                  />
                  <button onClick={() => setMetronomeBpm((current) => Math.min(180, current + 2))} className="p-1 bg-gray-800 rounded text-white">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-3">
                <p className="text-gray-400 text-xs mb-2">Tamanho da fonte</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setFontSize(prev => Math.max(10, prev - 1))} className="p-1 bg-gray-800 rounded text-white">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-white text-sm min-w-[30px] text-center">{fontSize}px</span>
                  <button onClick={() => setFontSize(prev => Math.min(24, prev + 1))} className="p-1 bg-gray-800 rounded text-white">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-3 space-y-2">
                {selectedInstrument !== 'teclado' ? (
                  <button
                    type="button"
                    onClick={() => setShowLeftHandedDiagrams((current) => !current)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors ${
                      showLeftHandedDiagrams
                        ? 'border-primary-500/50 bg-primary-500/10 text-primary-300'
                        : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-primary-500/40 hover:text-white'
                    }`}
                  >
                    <span>Montagem para canhoto</span>
                    <Hand className="w-4 h-4" />
                  </button>
                ) : null}
                {supportsTwoColumnLayout ? (
                  <button
                    type="button"
                    onClick={() => setUseTwoColumnLayout((current) => !current)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors ${
                      useTwoColumnLayout
                        ? 'border-primary-500/50 bg-primary-500/10 text-primary-300'
                        : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-primary-500/40 hover:text-white'
                    }`}
                  >
                    <span>Leitura em duas colunas</span>
                    <Eye className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
              {cifra.capo > 0 && (
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-gray-400 text-xs">Capotraste</p>
                  <p className="text-white font-medium">{cifra.capo}ª casa</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <main className="min-w-0 lg:col-start-2 lg:row-start-1">
        <header className="mb-6 hidden sm:block print:hidden">
          <Link to="/cifras" className="mb-4 inline-flex items-center gap-2 text-primary-400 transition-colors hover:text-primary-300 print:hidden">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">{headerCifraTitle}</h1>
          <nav aria-label="Breadcrumb" className="mt-2 flex items-center gap-1 text-sm">
            <Link to="/cifras" className="text-primary-400 transition-colors hover:text-primary-300">Cifras</Link>
            <span className="text-gray-600">/</span>
            <Link to={instrumentHubUrl} className="text-gray-300 transition-colors hover:text-primary-300">{instrumentLabel}</Link>
          </nav>
        </header>
        {renderChordDiagrams('mb-5')}
      {/* Cifra Content */}
      <div
        ref={contentRef}
        className="font-mono leading-[1.62] tracking-[-0.01em] sm:leading-relaxed sm:tracking-normal print:text-[17px] print:leading-[1.6]"
        style={{ fontSize: `${fontSize}px` }}
      >
        {/* Key info */}
        <div className="mb-7 hidden sm:block">
          <span className="text-gray-400">Tom: </span>
          <span className="text-primary-400 font-bold text-lg">{selectedKey}</span>
          {cifra.capo > 0 && (
            <span className="text-gray-500 ml-4">Capo: {cifra.capo}ª casa</span>
          )}
          {isCifraV2(cifra) && cifra.tuning ? (
            <span className="text-gray-500 ml-4">Afinação: {cifra.tuning}</span>
          ) : null}
        </div>

        {/* Lines */}
        {isCifraV2(cifra) && structuredSections.length > 0 ? (
          <div className={shouldRenderTwoColumns ? 'lg:columns-2 lg:gap-8' : 'space-y-8'}>
            {visibleStructuredSections.map(({ section, index: sectionIndex }) => {
              const sectionContent = transposeCifraContent(
                serializeSectionLines(section.content_ast),
                semitones,
                selectedKey,
              );

              return (
                <section
                  key={section.id}
                  id={getSectionAnchor(section.section_label, sectionIndex)}
                  className={`scroll-mt-28 sm:scroll-mt-32 ${shouldRenderTwoColumns ? 'mb-8' : ''}`}
                  style={shouldRenderTwoColumns ? { breakInside: 'avoid-column' } : undefined}
                >
                  {section.section_label ? (
                    <div className="mb-3 text-base font-medium text-gray-500 sm:font-bold sm:text-white print:font-medium print:text-[#252525]">
                      {section.section_label}
                    </div>
                  ) : null}
                  <div className="space-y-1">
                    {sectionContent.split('\n').map((line, lineIndex) =>
                      renderLine(line, `${section.id}-${lineIndex}`),
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          transposedContent.split('\n').map((line, idx) => renderLine(line, idx))
        )}
      </div>

      {supportsStudyTools ? (
        <div className="mb-6 hidden rounded-2xl sm:block border border-primary-500/20 bg-primary-500/5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-400" />
                <h2 className="text-lg font-semibold text-white">Modo estudo</h2>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Foque por seção, mantenha o pulso com o metrônomo e adapte a leitura para estudo ou ensaio.
              </p>
              {editorialStudySectionLabel ? (
                <p className="mt-2 text-xs text-primary-300">
                  Abertura editorial: {editorialStudySectionLabel}
                  {isCifraV2(cifra) && cifra.default_study_sync_audio ? ' · sync com áudio' : ''}
                  {isCifraV2(cifra) && cifra.default_study_loop_section ? ' · loop da seção' : ''}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStudyModeEnabled((current) => !current)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  studyModeEnabled
                    ? 'border-primary-500 bg-primary-500 text-black'
                    : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-primary-500/40 hover:text-white'
                }`}
              >
                <Target className="w-4 h-4" />
                {studyModeEnabled ? 'Estudo ativo' : 'Ativar estudo'}
              </button>
              <button
                type="button"
                onClick={() => setMetronomeEnabled((current) => !current)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  metronomeEnabled
                    ? 'border-primary-500 bg-primary-500 text-black'
                    : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-primary-500/40 hover:text-white'
                }`}
              >
                <Gauge className="w-4 h-4" />
                {metronomeEnabled ? 'Parar metrônomo' : 'Iniciar metrônomo'}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
            <div className="rounded-2xl border border-white/10 bg-background-primary p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Seções</p>
                  <p className="mt-1 text-sm text-white">Selecione uma parte específica ou estude a cifra inteira.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFocusedSectionIndex(null);
                    setStudyModeEnabled(true);
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    focusedSectionIndex === null
                      ? 'border-primary-500/50 bg-primary-500/10 text-primary-300'
                      : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-primary-500/40 hover:text-white'
                  }`}
                >
                  Todas
                </button>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {structuredSectionItems.map(({ section, index }) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setStudyModeEnabled(true);
                      setFocusedSectionIndex(index);
                      setTimeout(() => scrollToSection(index), 80);
                    }}
                    className={`shrink-0 rounded-full border px-3 py-2 text-sm transition-colors ${
                      focusedSectionIndex === index
                        ? 'border-primary-500 bg-primary-500 text-black'
                        : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-primary-500/40 hover:text-white'
                    }`}
                  >
                    {section.section_label || `Seção ${index + 1}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-background-primary p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Pulso e leitura</p>
                  <p className="mt-1 text-sm text-white">
                    {metronomeBpm} BPM · {measureBeats}/4 · {showLeftHandedDiagrams ? 'Canhoto ativo' : 'Destro'} · {shouldRenderTwoColumns ? '2 colunas' : '1 coluna'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => restartFocusedSection()}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reiniciar leitura
                </button>
              </div>
              {relatedHymnTrack ? (
                <div className="mt-4 rounded-2xl border border-primary-500/15 bg-primary-500/5 p-4">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Áudio relacionado</p>
                      <p className="mt-1 text-sm text-white">
                        Use o hino publicado como guia de ensaio. A sincronização usa os marcadores editoriais quando disponíveis e cai para estimativa só como fallback.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlayRelatedTrack()}
                        disabled={isRelatedTrackLoading || !canPlayRelatedTrack}
                        className="inline-flex items-center gap-2 rounded-full border border-primary-500 bg-primary-500 px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRelatedTrackActive && isPlayerPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isRelatedTrackActive && isPlayerPlaying ? 'Pausar áudio' : 'Ouvir hino'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRestartRelatedTrack()}
                        disabled={isRelatedTrackLoading || !canPlayRelatedTrack}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Recomeçar áudio
                      </button>
                      {focusedSectionIndex !== null ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (!isRelatedTrackActive) {
                              handlePlayRelatedTrack({ seekToFocusedSection: true });
                              return;
                            }

                            seekToSectionStart(focusedSectionIndex);
                            if (!isPlayerPlaying) {
                              resume();
                            }
                          }}
                          disabled={isRelatedTrackLoading || !canPlayRelatedTrack}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Ir para este trecho
                        </button>
                      ) : null}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setSyncStudyWithAudio((current) => !current)}
                        disabled={!canPlayRelatedTrack || !effectiveRelatedDuration}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors ${
                          syncStudyWithAudio
                            ? 'border-primary-500/50 bg-primary-500/10 text-primary-300'
                            : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-primary-500/40 hover:text-white'
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <span>Seguir áudio por seção</span>
                        <Music className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoopFocusedSection((current) => {
                            const next = !current;
                            if (next && focusedSectionIndex !== null) {
                              seekToSectionStart(focusedSectionIndex);
                              if (isRelatedTrackActive && !isPlayerPlaying) {
                                resume();
                              }
                            }
                            return next;
                          });
                        }}
                        disabled={focusedSectionIndex === null || !canPlayRelatedTrack || !effectiveRelatedDuration}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors ${
                          loopFocusedSection
                            ? 'border-primary-500/50 bg-primary-500/10 text-primary-300'
                            : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-primary-500/40 hover:text-white'
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <span>Loop desta seção</span>
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    {focusedSectionWindow ? (
                      <p className="text-xs text-gray-400">
                        {focusedSectionHasEditorialTiming ? 'Trecho editorial' : 'Trecho estimado'}: {Math.floor(focusedSectionWindow.start)}s até {Math.ceil(focusedSectionWindow.end)}s do áudio publicado.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <div className="mt-4 flex items-center gap-3">
                <button onClick={() => setMetronomeBpm((current) => Math.max(40, current - 2))} className="rounded-lg bg-gray-800 p-2 text-white transition-colors hover:bg-gray-700">
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min={40}
                  max={180}
                  step={1}
                  value={metronomeBpm}
                  onChange={(event) => setMetronomeBpm(Number(event.target.value))}
                  className="flex-1 accent-primary-500"
                />
                <button onClick={() => setMetronomeBpm((current) => Math.min(180, current + 2))} className="rounded-lg bg-gray-800 p-2 text-white transition-colors hover:bg-gray-700">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {selectedInstrument !== 'teclado' ? (
                  <button
                    type="button"
                    onClick={() => setShowLeftHandedDiagrams((current) => !current)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                      showLeftHandedDiagrams
                        ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                        : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-primary-500/40 hover:text-white'
                    }`}
                  >
                    <Hand className="w-4 h-4" />
                    {showLeftHandedDiagrams ? 'Canhoto ativo' : 'Ativar canhoto'}
                  </button>
                ) : null}
                {supportsTwoColumnLayout ? (
                  <button
                    type="button"
                    onClick={() => setUseTwoColumnLayout((current) => !current)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                      useTwoColumnLayout
                        ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                        : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-primary-500/40 hover:text-white'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    {useTwoColumnLayout ? 'Desativar 2 colunas' : 'Ativar 2 colunas'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isCifraV2(cifra) && structuredSections.length > 1 ? (
        <div className="mb-6 hidden rounded-2xl sm:block border border-white/10 bg-background-secondary p-5">
          <h2 className="text-lg font-semibold text-white">Navegacao por secoes</h2>
          <p className="text-text-muted text-sm mt-2">
            Pule direto para introducao, estrofes, coro e demais partes publicadas desta cifra.
          </p>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {structuredSectionItems.map(({ section, index }) => (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  if (studyModeEnabled) {
                    setFocusedSectionIndex(index);
                  }
                  scrollToSection(index);
                }}
                className={`shrink-0 rounded-full border px-3 py-2 text-sm transition-colors ${
                  focusedSectionIndex === index
                    ? 'border-primary-500 bg-primary-500 text-black'
                    : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-primary-500/40 hover:text-white'
                }`}
              >
                {section.section_label || `Secao ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      </main>
      </div>

      {/* Mobile quick controls */}
      <div className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#111313]/95 px-2 py-3 shadow-2xl shadow-black/60 backdrop-blur-xl sm:hidden print:hidden">
        <button
          type="button"
          onClick={() => setShowOptions(true)}
          className="flex flex-col items-center gap-1.5 text-[11px] font-medium text-primary-400"
        >
          <Music className="h-5 w-5" />
          Tom
        </button>
        <button
          type="button"
          onClick={() => setAutoScrollSpeed(prev => prev === 0 ? 1 : prev === 1 ? 2 : prev === 2 ? 3 : 0)}
          className={`flex flex-col items-center gap-1.5 text-[11px] font-medium ${autoScrollSpeed > 0 ? 'text-primary-400' : 'text-gray-400'}`}
        >
          <ScrollText className="h-5 w-5" />
          Rolagem
        </button>
        <button
          type="button"
          onClick={() => setShowChords((current) => !current)}
          className={`flex flex-col items-center gap-1.5 text-[11px] font-medium ${showChords ? 'text-primary-400' : 'text-gray-400'}`}
        >
          <Settings2 className="h-5 w-5" />
          Acordes
        </button>
        <button
          type="button"
          onClick={() => setMetronomeEnabled((current) => !current)}
          className={`flex flex-col items-center gap-1.5 text-[11px] font-medium ${metronomeEnabled ? 'text-primary-400' : 'text-gray-400'}`}
        >
          <Gauge className="h-5 w-5" />
          Metrônomo
        </button>
        <button
          type="button"
          onClick={() => setShowOptions(true)}
          className="flex flex-col items-center gap-1.5 text-[11px] font-medium text-gray-400"
        >
          <Settings2 className="h-5 w-5" />
          Opções
        </button>
      </div>

      {showOptions ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/60 px-3 pb-3 sm:hidden print:hidden" onClick={() => setShowOptions(false)}>
          <div
            className="w-full rounded-[2rem] border border-white/10 bg-[#161818]/95 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-16 rounded-full bg-white/30" />
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-[-0.03em] text-white">Ajustes rápidos</h2>
                <p className="mt-1 text-sm text-gray-400">Controle a cifra sem sair do modo tocar.</p>
              </div>
              <button type="button" onClick={() => setShowOptions(false)} className="rounded-full bg-white/10 p-2 text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-[1fr,64px,84px,64px] items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-white">
                <span className="px-4 py-4 text-sm font-medium text-gray-200">Transposição (Tom)</span>
                <button type="button" onClick={transposeDown} className="h-full border-l border-white/10 text-primary-400">−</button>
                <button type="button" onClick={() => setShowKeySelector((current) => !current)} className="h-full border-l border-white/10 text-base font-bold">{selectedKey}</button>
                <button type="button" onClick={transposeUp} className="h-full border-l border-white/10 text-2xl text-primary-400">+</button>
              </div>

              {showKeySelector ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="grid grid-cols-6 gap-2">
                    {ALL_KEYS.map((keyName) => (
                      <button
                        key={keyName}
                        type="button"
                        onClick={() => { setSelectedKey(keyName); setShowKeySelector(false); }}
                        className={`h-10 rounded-xl text-sm font-bold ${keyName === selectedKey ? 'bg-primary-500 text-black' : 'bg-white/[0.06] text-gray-200'}`}
                      >
                        {keyName}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-[1fr,64px,84px,64px] items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-white">
                <span className="px-4 py-4 text-sm font-medium text-gray-200">Fonte (Cifra)</span>
                <button type="button" onClick={() => setFontSize(prev => Math.max(12, prev - 1))} className="h-full border-l border-white/10 text-primary-400">A−</button>
                <span className="border-l border-white/10 py-4 text-center text-sm font-bold">{Math.round((fontSize / 16) * 100)}%</span>
                <button type="button" onClick={() => setFontSize(prev => Math.min(24, prev + 1))} className="h-full border-l border-white/10 text-primary-400">A+</button>
              </div>

              <div className="grid grid-cols-[1fr,1.3fr,90px] items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-white">
                <span className="px-4 py-4 text-sm font-medium text-gray-200">Rolagem</span>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={1}
                  value={autoScrollSpeed}
                  onChange={(event) => setAutoScrollSpeed(Number(event.target.value))}
                  className="accent-primary-500"
                />
                <span className="border-l border-white/10 py-4 text-center text-sm font-bold">{autoScrollSpeed === 0 ? 'Off' : `${autoScrollSpeed}x`}</span>
              </div>

              <div className="grid grid-cols-[1fr,1.4fr] items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-white">
                <span className="px-4 py-4 text-sm font-medium text-gray-200">Instrumento</span>
                <select
                  value={selectedInstrument}
                  onChange={e => handleInstrumentChange(e.target.value)}
                  className="h-full border-l border-white/10 bg-[#161818] px-4 py-4 text-sm font-bold outline-none"
                >
                  {instrumentOptions.map(i => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleShare}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-gray-200"
                >
                  Compartilhar
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-gray-200"
                >
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showReportModal && isCifraV2(cifra) ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 px-4 py-4 sm:items-center">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Reportar problema na cifra</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Seu relato entra na fila de revisão editorial do módulo novo de cifras.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 transition-colors hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Tipo de problema</label>
                <select
                  value={reportType}
                  onChange={(event) => setReportType(event.target.value as CifraReportType)}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                >
                  {REPORT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Descreva o problema</label>
                <textarea
                  value={reportMessage}
                  onChange={(event) => setReportMessage(event.target.value)}
                  rows={5}
                  placeholder="Exemplo: o acorde do refrão está em tom diferente da gravação."
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Email para contato (opcional)</label>
                <input
                  type="email"
                  value={reporterEmail}
                  onChange={(event) => setReporterEmail(event.target.value)}
                  placeholder="voce@email.com"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="rounded-xl border border-gray-700 px-4 py-3 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmittingReport}
                onClick={() => void handleSubmitReport()}
                className="rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-primary-600 disabled:opacity-60"
              >
                {isSubmittingReport ? 'Enviando...' : 'Enviar denúncia'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
    </>
  );
};


export default CifraPage;
