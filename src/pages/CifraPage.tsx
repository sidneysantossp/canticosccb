import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ScrollText, Settings2, Eye, Printer, Share2, Music, X, Heart, Flag, Gauge, Hand, Target, RefreshCw, Play, Pause, RotateCcw } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import ChordDictionaryCarousel, { ChordPopover } from '@/components/cifras/ChordDictionaryCarousel';
import { generateCifraSchema, generateBreadcrumbSchema } from '@/utils/schemaGenerator';
import { fetchCifraBySlug, incrementCifraViews, type Cifra, INSTRUMENTS, ALL_KEYS } from '@/api/cifras';
import { buildHinoUrl } from '@/utils/slugUrl';
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
  transposeCifraContent,
  getChordDiagram,
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

function buildInstrumentSeoTitle(
  number: number | null,
  title: string,
  instrumentLabel: string,
  fallback?: string | null,
): string {
  if (!number) {
    return fallback?.trim() || `${title} | Cânticos CCB`;
  }

  return `CIFRA Hino ${number} CCB - ${title} - ${instrumentLabel} | Cânticos CCB`;
}

function buildInstrumentSeoDescription(
  number: number | null,
  title: string,
  instrumentLabel: string,
  fallback?: string | null,
): string {
  if (!number) {
    return fallback?.trim() || `Cifra de ${title} para ${instrumentLabel}. Acordes e tom.`;
  }

  return `Cifra Hino ${number} CCB - ${title} para ${instrumentLabel}. Acordes e tom do Hinário 5 CCB.`;
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
  const { slug } = useParams<{ slug: string }>();
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
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); // 0 = off
  const [showOptions, setShowOptions] = useState(false);
  const [showKeySelector, setShowKeySelector] = useState(false);
  const [showLeftHandedDiagrams, setShowLeftHandedDiagrams] = useState(false);
  const [useTwoColumnLayout, setUseTwoColumnLayout] = useState(false);
  const [studyModeEnabled, setStudyModeEnabled] = useState(false);
  const [focusedSectionIndex, setFocusedSectionIndex] = useState<number | null>(null);
  const [syncStudyWithAudio, setSyncStudyWithAudio] = useState(false);
  const [loopFocusedSection, setLoopFocusedSection] = useState(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [metronomeBpm, setMetronomeBpm] = useState(72);

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
  }, [slug]);

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
      const publicData = isAdminPreview
        ? await fetchAdminPreviewCifraPageBySlug(slug)
        : await fetchPublicCifraPageBySlug(slug);
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

      const data = await fetchCifraBySlug(slug);
      if (data) {
        setCifra(data);
        setEngagement(null);
        setSelectedKey(data.original_key);
        setSelectedInstrument(data.instrument);
        setMetronomeBpm(72);
        incrementCifraViews(data.id);
      } else {
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
      navigate(`/cifra/${matchingVersion.slug}`);
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
  const transposedContent = cifra ? transposeCifraContent(cifra.content, semitones, selectedKey) : '';
  const chords = extractChords(transposedContent);
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
      const chordTokens = line.split(/(\s+)/);
      return (
        <div key={idx} className="whitespace-pre text-primary-400 sm:text-primary-400 print:text-primary-600">
          {chordTokens.map((token, tokenIndex) => {
            const shapeOptions = chordShapeVariants[token];
            const selectedShape = shapeOptions?.find(shape => shape.id === selectedShapeIds[token]) || shapeOptions?.[0];
            const isKnownChord = Boolean(selectedShape || getChordDiagram(token));
            return isKnownChord ? (
              <ChordPopover
                key={`${String(idx)}-${tokenIndex}`}
                chord={token}
                shape={selectedShape}
                fallbackDiagram={getChordDiagram(token) || undefined}
                leftHanded={showLeftHandedDiagrams}
              />
            ) : <span key={`${String(idx)}-${tokenIndex}`}>{token}</span>;
          })}
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
  const editorialPreferredKey =
    isCifraV2(cifra) && cifra.preferred_key && cifra.preferred_key !== cifra.original_key
      ? cifra.preferred_key
      : null;
  const studyFacts = isCifraV2(cifra)
    ? [
        { label: 'Instrumento', value: instrumentLabel },
        { label: 'Tom principal', value: selectedKey },
        ...(editorialPreferredKey ? [{ label: 'Tom editorial', value: editorialPreferredKey }] : []),
        ...(cifra.tuning ? [{ label: 'Afinação', value: cifra.tuning }] : []),
        ...(cifra.tempo_bpm ? [{ label: 'Andamento', value: `${cifra.tempo_bpm} BPM` }] : []),
        ...(cifra.time_signature ? [{ label: 'Compasso', value: cifra.time_signature }] : []),
        ...(cifra.difficulty_level ? [{ label: 'Dificuldade', value: cifra.difficulty_level }] : []),
        ...(cifra.capo > 0 ? [{ label: 'Capotraste', value: `${cifra.capo}ª casa` }] : []),
      ]
    : [];
  const instrumentHubMap: Record<string, string> = {
    violao: '/cifras-violao-ccb',
    ukulele: '/cifras-ukulele-ccb',
    teclado: '/cifras-teclado-ccb',
  };
  const instrumentHubUrl = instrumentHubMap[cifra.instrument] || '/cifras';
  const relatedNumber = relatedHymn?.numero || relatedLyric?.numero || (isCifraV2(cifra) ? cifra.hinario_numero : null) || extractHymnNumber(cifra.title);
  const displayCifraTitle = stripTrailingArtistFromTitle(cifra.title, cifra.artist);
  const hinarioRange = getHinarioRangeForNumero(relatedNumber);
  const storedSeoTitle = isCifraV2(cifra) ? cifra.seo_title : null;
  const storedSeoDescription = isCifraV2(cifra) ? cifra.seo_description : null;
  const cifraTitle = buildInstrumentSeoTitle(
    relatedNumber,
    displayCifraTitle,
    instrumentLabel,
    storedSeoTitle,
  );
  const cifraDescription = buildInstrumentSeoDescription(
    relatedNumber,
    displayCifraTitle,
    instrumentLabel,
    storedSeoDescription,
  );
  const cifraKeywords = (isCifraV2(cifra) ? cifra.seo_keywords : null) || [
    cifra.title,
    cifra.artist,
    relatedNumber ? `hino ${relatedNumber} ccb cifra` : null,
    relatedNumber ? `cifra hino ${relatedNumber} ccb` : null,
    relatedNumber ? `letra hino ${relatedNumber} ccb` : null,
    'cifras hinos ccb',
    instrumentLabel,
  ].filter(Boolean).join(', ');
  const renderChordDictionaryCarousel = (className = '') => showChords ? (
    <ChordDictionaryCarousel
      chords={chords}
      chordShapeVariants={chordShapeVariants}
      selectedShapeIds={selectedShapeIds}
      selectedInstrument={selectedInstrument}
      selectedKey={selectedKey}
      originalKey={cifra.original_key}
      instrumentLabel={PUBLIC_INSTRUMENTS.find((entry) => entry.value === selectedInstrument)?.label || selectedInstrument}
      leftHanded={showLeftHandedDiagrams}
      chordOverrides={isCifraV2(cifra) ? cifra.chord_overrides : null}
      onSelectShape={handleShapeSelection}
      className={className}
    />
  ) : null;

  return (
    <>
    <SEOHead
      title={cifraTitle}
      description={cifraDescription}
      keywords={cifraKeywords}
      canonical={`/cifra/${slug}`}
      ogImage={cifra.cover_url}
      schemaData={[
        generateCifraSchema({
          name: displayCifraTitle,
          url: `/cifra/${slug}`,
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
          { name: displayCifraTitle, url: `/cifra/${slug}` },
        ]),
      ]}
    />
    <div className="min-h-screen overflow-x-clip bg-[#080909] px-6 pt-6 pb-36 text-white sm:mx-auto sm:min-h-0 sm:max-w-4xl sm:bg-transparent sm:px-4 sm:py-6 sm:pb-6 sm:text-inherit print:max-w-none print:bg-white print:px-12 print:py-10 print:pb-0 print:text-[#252525]">
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
            <h1 className="text-[28px] font-black leading-[1.02] tracking-[-0.04em] text-white">{displayCifraTitle}</h1>
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
        {renderChordDictionaryCarousel('mt-6 mb-5 sm:hidden')}
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

      {/* Header */}
      <div className="mb-6 hidden sm:block print:hidden">
        <Link to="/cifras" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors print:hidden">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {cifra.cover_url && (
            <img src={cifra.cover_url} alt={displayCifraTitle} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shadow-lg flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{displayCifraTitle}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-500 text-sm mt-1">
              <span>
                {isCifraV2(cifra)
                  ? `Versão ${cifra.publication_label === 'official' ? 'oficial' : cifra.publication_label === 'reviewed' ? 'revisada' : 'publicada'}`
                  : `${cifra.views_count.toLocaleString()} exibições`}
              </span>
              {isCifraV2(cifra) ? <span>{cifra.arrangement_type.replace('_', ' ')}</span> : null}
              {engagement ? <span>{engagement.viewsCount.toLocaleString()} visualizações</span> : null}
              {engagement ? <span>{engagement.favoritesCount.toLocaleString()} favoritos</span> : null}
              {engagement ? <span>{engagement.openReportsCount.toLocaleString()} denúncias abertas</span> : null}
            </div>
            <p className="text-gray-400 text-sm mt-3 leading-relaxed">
              Cifra CCB para {instrumentLabel}, com acordes, troca de tom e navegação para outras cifras e páginas relacionadas.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {isCifraV2(cifra) ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleToggleFavorite()}
                    disabled={isFavoriteLoading}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors sm:w-auto ${
                      engagement?.isFavorited
                        ? 'border-red-500/50 bg-red-500/15 text-red-300'
                        : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-red-500/40 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${engagement?.isFavorited ? 'fill-current' : ''}`} />
                    {engagement?.isFavorited ? 'Favoritada' : 'Favoritar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white sm:w-auto"
                  >
                    <Flag className="w-4 h-4" />
                    Reportar problema
                  </button>
                </>
              ) : null}
              {relatedHymn ? (
                <Link
                  to={buildHinoUrl(relatedHymn.id, relatedHymn.titulo, relatedHymn.numero)}
                  className="inline-flex w-full items-center justify-center rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-sm text-primary-300 transition-colors hover:bg-primary-500/20 sm:w-auto"
                >
                  Ouvir este hino
                </Link>
              ) : null}
              {relatedHymnTrack ? (
                <button
                  type="button"
                  onClick={() => handlePlayRelatedTrack()}
                  disabled={isRelatedTrackLoading || !canPlayRelatedTrack}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary-500 bg-primary-500 px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isRelatedTrackActive && isPlayerPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isRelatedTrackActive && isPlayerPlaying ? 'Pausar áudio' : 'Tocar áudio aqui'}
                </button>
              ) : null}
              {relatedLyric ? (
                <Link
                  to={`/hinario/${relatedLyric.numero}`}
                  className="inline-flex w-full items-center justify-center rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-sm text-primary-300 transition-colors hover:bg-primary-500/20 sm:w-auto"
                >
                  Letra no Hinario
                </Link>
              ) : null}
              <Link
                to={instrumentHubUrl}
                className="inline-flex w-full items-center justify-center rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-sm text-primary-300 transition-colors hover:bg-primary-500/20 sm:w-auto"
              >
                Mais cifras de {instrumentLabel}
              </Link>
              <Link
                to="/cifras"
                className="inline-flex w-full items-center justify-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white sm:w-auto"
              >
                Todas as cifras
              </Link>
              <Link
                to="/hinario"
                className="inline-flex w-full items-center justify-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white sm:w-auto"
              >
                Letras do Hinário
              </Link>
              <Link
                to="/cifras-hinos-ccb"
                className="inline-flex w-full items-center justify-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white sm:w-auto"
              >
                Cifras de Hinos
              </Link>
              {hinarioRange ? (
                <Link
                  to={hinarioRange.path}
                  className="inline-flex w-full items-center justify-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white sm:w-auto"
                >
                  {hinarioRange.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Dicionário e controles permanecem juntos logo abaixo do header no desktop. */}
      <div className="hidden sm:block lg:sticky lg:top-0 z-30 -mx-4 px-4 pt-1 bg-[#080909]/95 sm:bg-background-primary/95 backdrop-blur-md print:hidden">
        {renderChordDictionaryCarousel('mt-0 mb-2 hidden sm:block')}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 pb-3 mb-6 print:hidden">
          <select value={selectedInstrument} onChange={e => handleInstrumentChange(e.target.value)} className="shrink-0 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
            {instrumentOptions.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
          <div className="flex shrink-0 items-center rounded-lg border border-gray-700 bg-gray-800">
            <button onClick={transposeDown} className="rounded-l-lg px-3 py-2 text-white hover:bg-gray-700" aria-label="Diminuir tom"><Minus className="h-4 w-4" /></button>
            <button onClick={() => setShowKeySelector(!showKeySelector)} className="min-w-[74px] px-3 py-2 text-center text-sm"><span className="text-gray-400">Tom </span><span className="font-bold text-primary-400">{selectedKey}</span></button>
            <button onClick={transposeUp} className="rounded-r-lg px-3 py-2 text-white hover:bg-gray-700" aria-label="Aumentar tom"><Plus className="h-4 w-4" /></button>
          </div>
          <div className="flex shrink-0 items-center rounded-lg border border-gray-700 bg-gray-800">
            <button onClick={() => setFontSize(prev => Math.max(10, prev - 1))} className="rounded-l-lg px-3 py-2 text-white hover:bg-gray-700" aria-label="Diminuir fonte">A</button>
            <button onClick={() => setFontSize(prev => Math.min(24, prev + 1))} className="rounded-r-lg px-3 py-2 text-base font-bold text-white hover:bg-gray-700" aria-label="Aumentar fonte">A</button>
          </div>
          <button onClick={() => setAutoScrollSpeed(prev => prev === 0 ? 1 : prev === 1 ? 2 : prev === 2 ? 3 : 0)} className={`shrink-0 rounded-lg border px-3 py-2 text-sm ${autoScrollSpeed > 0 ? 'border-primary-500/50 bg-primary-500/20 text-primary-400' : 'border-gray-700 bg-gray-800 text-gray-400'}`}><ScrollText className="mr-1 inline h-4 w-4" />{autoScrollSpeed > 0 ? `${autoScrollSpeed}x` : 'Rolagem'}</button>
          <button onClick={() => setShowChords(!showChords)} className={`shrink-0 rounded-lg border px-3 py-2 text-sm ${showChords ? 'border-primary-500/50 bg-primary-500/20 text-primary-400' : 'border-gray-700 bg-gray-800 text-gray-400'}`}>Acordes</button>
          <button onClick={() => setMetronomeEnabled(current => !current)} className={`shrink-0 rounded-lg border px-3 py-2 text-sm ${metronomeEnabled ? 'border-primary-500/50 bg-primary-500/20 text-primary-400' : 'border-gray-700 bg-gray-800 text-gray-400'}`}><Gauge className="mr-1 inline h-4 w-4" />Metrônomo</button>
          {selectedInstrument !== 'teclado' ? <button onClick={() => setShowLeftHandedDiagrams(current => !current)} className={`shrink-0 rounded-lg border px-3 py-2 text-sm ${showLeftHandedDiagrams ? 'border-primary-500/50 bg-primary-500/20 text-primary-400' : 'border-gray-700 bg-gray-800 text-gray-400'}`}><Hand className="mr-1 inline h-4 w-4" />Canhoto</button> : null}
          {supportsStudyTools ? <button onClick={() => setStudyModeEnabled(current => !current)} className={`shrink-0 rounded-lg border px-3 py-2 text-sm ${studyModeEnabled ? 'border-primary-500/50 bg-primary-500/20 text-primary-400' : 'border-gray-700 bg-gray-800 text-gray-400'}`}><Target className="mr-1 inline h-4 w-4" />Estudo</button> : null}
          <button onClick={() => setShowOptions(!showOptions)} className="shrink-0 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-400 hover:text-white" aria-label="Abrir opções"><Settings2 className="h-4 w-4" /></button>
        </div>
        {showKeySelector && (
          <div className="mt-2 rounded-xl border border-gray-700 bg-gray-900 p-3 shadow-xl">
            <div className="flex flex-wrap gap-2">
              {ALL_KEYS.map(key => <button key={key} onClick={() => { setSelectedKey(key); setShowKeySelector(false); }} className={`rounded-lg px-3 py-2 text-sm ${key === selectedKey ? 'bg-primary-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>{key}</button>)}
            </div>
          </div>
        )}
      </div>

      {(relatedHymn || relatedLyric) && (
        <div className="mb-6 hidden rounded-2xl sm:block border border-white/10 bg-background-secondary p-5">
          <h2 className="text-lg font-semibold text-white">Letra e audio deste hino</h2>
          <p className="text-text-muted text-sm mt-2">
            Esta cifra agora se conecta diretamente com a pagina do hino e com a letra do Hinario quando a correspondencia foi encontrada.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {relatedHymn ? (
              <Link
                to={buildHinoUrl(relatedHymn.id, relatedHymn.titulo, relatedHymn.numero)}
                className="inline-flex w-full items-center justify-center rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-sm text-primary-300 transition-colors hover:bg-primary-500/20 sm:w-auto"
              >
                Pagina do Hino {relatedHymn.numero || relatedNumber || ''}
              </Link>
            ) : null}
            {relatedHymnTrack ? (
              <button
                type="button"
                onClick={() => handlePlayRelatedTrack()}
                disabled={isRelatedTrackLoading || !canPlayRelatedTrack}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary-500 bg-primary-500 px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isRelatedTrackActive && isPlayerPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isRelatedTrackActive && isPlayerPlaying ? 'Pausar hino' : 'Ouvir enquanto estuda'}
              </button>
            ) : null}
            {relatedLyric ? (
              <Link
                to={`/hinario/${relatedLyric.numero}`}
                className="inline-flex w-full items-center justify-center rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-sm text-primary-300 transition-colors hover:bg-primary-500/20 sm:w-auto"
              >
                Letra do Hino {relatedLyric.numero}
              </Link>
            ) : null}
            <Link
              to="/hinos-ccb"
              className="inline-flex w-full items-center justify-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white sm:w-auto"
            >
              Hinos CCB
            </Link>
            {hinarioRange ? (
              <Link
                to={hinarioRange.path}
                className="inline-flex w-full items-center justify-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white sm:w-auto"
              >
                Faixa {hinarioRange.shortLabel}
              </Link>
            ) : null}
          </div>
        </div>
      )}

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

      {/* Toolbar */}
      <div             className="hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible">
          {/* Instrument selector */}
          <select
            value={selectedInstrument}
            onChange={e => handleInstrumentChange(e.target.value)}
            className="shrink-0 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {instrumentOptions.map(i => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>

          {/* Transpose controls */}
          <div className="flex shrink-0 items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg">
            <button onClick={transposeDown} className="px-3 py-2 hover:bg-gray-700 rounded-l-lg transition-colors text-white">
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowKeySelector(!showKeySelector)}
              className="px-3 py-2 hover:bg-gray-700 transition-colors text-sm font-medium min-w-[60px] text-center"
            >
              <span className="text-gray-400 text-xs">Tom </span>
              <span className="text-primary-400 font-bold">{selectedKey}</span>
            </button>
            <button onClick={transposeUp} className="px-3 py-2 hover:bg-gray-700 rounded-r-lg transition-colors text-white">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {editorialPreferredKey ? (
            <button
              onClick={() => setSelectedKey(editorialPreferredKey)}
              className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${
                selectedKey === editorialPreferredKey
                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-primary-500/40'
              }`}
            >
              Tom editorial {editorialPreferredKey}
            </button>
          ) : null}

          {/* Font size */}
          <div className="flex shrink-0 items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg">
            <button
              onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
              className="px-2 py-2 hover:bg-gray-700 rounded-l-lg transition-colors text-white text-xs"
            >
              A
            </button>
            <button
              onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
              className="px-2 py-2 hover:bg-gray-700 rounded-r-lg transition-colors text-white text-base font-bold"
            >
              A
            </button>
          </div>

          {/* Auto scroll */}
          <button
            onClick={() => setAutoScrollSpeed(prev => prev === 0 ? 1 : prev === 1 ? 2 : prev === 2 ? 3 : 0)}
            className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${
              autoScrollSpeed > 0
                ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <ScrollText className="w-4 h-4 inline mr-1" />
            {autoScrollSpeed > 0 ? `${autoScrollSpeed}x` : 'Rolagem'}
          </button>

          {/* Toggle chords */}
          <button
            onClick={() => setShowChords(!showChords)}
            className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${
              showChords
                ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}
          >
            Acordes
          </button>

          <button
            onClick={() => setMetronomeEnabled((current) => !current)}
            className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${
              metronomeEnabled
                ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <Gauge className="w-4 h-4 inline mr-1" />
            {metronomeEnabled ? `${metronomeBpm} BPM` : 'Metrônomo'}
          </button>

          {selectedInstrument !== 'teclado' ? (
            <button
              onClick={() => setShowLeftHandedDiagrams((current) => !current)}
              className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${
                showLeftHandedDiagrams
                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <Hand className="w-4 h-4 inline mr-1" />
              Canhoto
            </button>
          ) : null}

          {supportsTwoColumnLayout ? (
            <button
              onClick={() => setUseTwoColumnLayout((current) => !current)}
              className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${
                useTwoColumnLayout
                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              2 colunas
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
              className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${
                studyModeEnabled
                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4 inline mr-1" />
              Estudo
            </button>
          ) : null}

          {/* Options */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="shrink-0 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors sm:ml-auto"
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

      {/* Cifra Content */}
      <div className="rounded-3xl border border-white/10 bg-background-secondary p-5 sm:p-7">
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
      </div>

      {isCifraV2(cifra) && studyFacts.length > 0 ? (
        <div className="mt-8 mb-6 hidden rounded-2xl border border-white/10 bg-background-secondary p-5 sm:block">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Visão de estudo</h2>
              <p className="mt-2 text-sm text-text-muted">Resumo rápido da versão publicada para ensaio, estudo por instrumento e leitura em tela pequena.</p>
            </div>
            <Music className="hidden h-5 w-5 text-primary-400 sm:block" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {studyFacts.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-white/10 bg-background-primary px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">{fact.label}</p>
                <p className="mt-2 text-sm font-semibold text-white">{fact.value}</p>
              </div>
            ))}
          </div>
          {cifra.intro_notes ? (
            <div className="mt-4 rounded-2xl border border-primary-500/20 bg-primary-500/10 px-4 py-3 text-sm text-white/90">
              <span className="font-semibold text-primary-300">Observação editorial:</span> {cifra.intro_notes}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Contribution prompt shown at the end of every cifra */}
      <section className="mt-12 border-t border-white/10 pt-6 pb-4 print:hidden" aria-label="Contribua com a correção da cifra">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-medium text-gray-300">A Cifra desse Hino está errada?</p>
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="mt-2 text-left text-base font-bold text-white underline decoration-primary-500/70 underline-offset-4 transition-colors hover:text-primary-300"
              >
                Contribua com a correção
              </button>
            </div>
            <div className="text-sm text-gray-500 sm:text-right">
              Ajude-nos a manter esta cifra correta para toda a comunidade.
            </div>
          </div>
        </div>
      </section>

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

      <section className="mt-10 rounded-3xl border border-white/10 bg-background-secondary p-6 sm:p-8">
        <h2 className="text-xl font-bold text-white">A Cifra deste Hino está errada?</h2>
        <p className="mt-2 max-w-2xl text-gray-400">Contribua com a correção e ajude a melhorar esta cifra para toda a comunidade.</p>
        <button
          type="button"
          onClick={() => {
            const songId = isCifraV2(cifra) ? cifra.song_id : cifra.id;
            const versionId = isCifraV2(cifra) ? cifra.id : null;
            if (!user) {
              navigate(`/login?redirect=${encodeURIComponent(`/cifra/${slug}`)}`);
              return;
            }
            navigate(`/contribuir-cifra?type=correction&songId=${encodeURIComponent(songId)}${versionId ? `&versionId=${encodeURIComponent(versionId)}` : ''}`);
          }}
          className="mt-5 rounded-2xl bg-primary-500 px-5 py-3 font-semibold text-black transition-colors hover:bg-primary-400"
        >
          Contribua com a correção
        </button>
      </section>

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
