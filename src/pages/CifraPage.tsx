import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ScrollText, Settings2, Eye, Printer, Share2, Music, X, Heart, Flag, Gauge, Hand, Target, RefreshCw, Play, Pause, RotateCcw } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { generateCifraSchema, generateBreadcrumbSchema } from '@/utils/schemaGenerator';
import { fetchCifraBySlug, incrementCifraViews, type Cifra, INSTRUMENTS, ALL_KEYS } from '@/api/cifras';
import { buildHinoUrl } from '@/utils/slugUrl';
import {
  addCifraFavorite,
  explainCifraChordNameMatch,
  fetchCifraChordShapeVariants,
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
import { CIFRA_V2_INSTRUMENTS, type CifraChordShape, type CifraInstrument, type CifraReportType, type CifraVersionChordOverride, type CifraVersionSection } from '@/types/cifras-v2';
import type { Hino } from '@/types';
import { usePlayerStore } from '@/stores/playerStore';
import {
  isChordLine,
  isSectionLine,
  extractChords,
  getSemitonesBetweenKeys,
  transposeCifraContent,
  getChordDiagram,
  ChordDiagram,
} from '@/utils/chordUtils';

type DisplayCifra = Cifra | PublicCifraPageData;

const PUBLIC_INSTRUMENTS = [
  ...INSTRUMENTS,
  ...CIFRA_V2_INSTRUMENTS.filter((entry) => !INSTRUMENTS.some((legacy) => legacy.value === entry.value)),
];

function isCifraV2(cifra: DisplayCifra | null): cifra is PublicCifraPageData {
  return Boolean(cifra && 'source' in cifra && cifra.source === 'v2');
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

function getEditorialOverrideLabel(override?: CifraVersionChordOverride | null): string | null {
  if (!override) {
    return null;
  }

  return override.applies_to_key?.trim()
    ? `Editorial · ${override.applies_to_key.trim()}`
    : 'Editorial';
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
    () => (isCifraV2(cifra) ? cifra.sections.map((section, index) => ({ section, index })) : []),
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
  const structuredSections = isCifraV2(cifra) ? cifra.sections : [];
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
      const publicData = await fetchPublicCifraPageBySlug(slug);
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
  const visibleChordCards = chords
    .slice(0, 12)
    .map((chord) => {
      const databaseShapes = chordShapeVariants[chord];
      const editorialOverride = isCifraV2(cifra)
        ? resolveCifraVersionChordOverride(cifra.chord_overrides, chord, selectedKey)
        : null;
      if (databaseShapes?.length) {
        const selectedShape = databaseShapes.find((shape) => shape.id === selectedShapeIds[chord]) || databaseShapes[0];
        return {
          chord,
          kind: 'database' as const,
          shapes: databaseShapes,
          selectedShape,
          editorialOverride,
        };
      }

      if (selectedInstrument === 'violao' || selectedInstrument === 'guitarra') {
        const fallbackDiagram = getChordDiagram(chord);
        if (fallbackDiagram) {
          return {
            chord,
            kind: 'fallback' as const,
            diagram: fallbackDiagram,
          };
        }
      }

      return null;
    })
    .filter((item): item is
      | { chord: string; kind: 'database'; shapes: CifraChordShape[]; selectedShape: CifraChordShape; editorialOverride: CifraVersionChordOverride | null }
      | { chord: string; kind: 'fallback'; diagram: ChordDiagram } => Boolean(item));

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
        <div key={idx} className="mt-8 mb-3 text-base font-medium text-[#252525] sm:font-bold sm:text-white print:font-medium print:text-[#252525]">
          {line}
        </div>
      );
    }
    if (isChordLine(line) && showChords) {
      return (
        <div key={idx} className="whitespace-pre font-bold text-[#ff6a00] sm:text-primary-400 print:text-[#ff6a00]">
          {line}
        </div>
      );
    }
    if (isChordLine(line) && !showChords) {
      return null;
    }
    return (
      <div key={idx} className="whitespace-pre-wrap text-[#252525] sm:text-gray-200 print:text-[#252525]">
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
  const hinarioRange = getHinarioRangeForNumero(relatedNumber);
  const cifraTitle = (isCifraV2(cifra) ? cifra.seo_title : null) || (relatedNumber
    ? `Hino ${relatedNumber} CCB - ${cifra.title} | Cifra`
    : `${cifra.title}${cifra.artist ? ` - ${cifra.artist}` : ''} | Cifra`);
  const cifraDescription = (isCifraV2(cifra) ? cifra.seo_description : null) || [
    relatedNumber ? `Cifra do Hino ${relatedNumber} CCB.` : `Cifra de ${cifra.title}.`,
    cifra.artist ? `Artista: ${cifra.artist}.` : '',
    `Tom: ${cifra.original_key}.`,
    `Acordes e navegacao para ${instrumentLabel}.`,
    relatedLyric ? `Letra disponivel no Hinario ${relatedLyric.numero}.` : '',
    relatedHymn ? 'Pagina de audio relacionada disponivel.' : '',
  ].filter(Boolean).join(' ');
  const cifraKeywords = (isCifraV2(cifra) ? cifra.seo_keywords : null) || [
    cifra.title,
    cifra.artist,
    relatedNumber ? `hino ${relatedNumber} ccb cifra` : null,
    relatedNumber ? `cifra hino ${relatedNumber} ccb` : null,
    relatedNumber ? `letra hino ${relatedNumber} ccb` : null,
    'cifras hinos ccb',
    instrumentLabel,
  ].filter(Boolean).join(', ');

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
          name: cifra.title,
          url: `/cifra/${slug}`,
          artist: cifra.artist,
          description: `Cifra e acordes de ${cifra.title} - Tom: ${cifra.original_key}`,
          image: cifra.cover_url,
          datePublished: cifra.created_at,
          dateModified: cifra.updated_at,
          musicalKey: cifra.original_key,
          instrument: cifra.instrument,
        }),
        generateBreadcrumbSchema([
          { name: 'Início', url: '/' },
          { name: 'Cifras', url: '/cifras' },
          { name: cifra.title, url: `/cifra/${slug}` },
        ]),
      ]}
    />
    <div className="min-h-screen bg-[#f8f7f2] px-5 pt-8 pb-36 text-[#252525] sm:mx-auto sm:min-h-0 sm:max-w-4xl sm:bg-transparent sm:px-4 sm:py-6 sm:pb-6 sm:text-inherit print:max-w-none print:bg-white print:px-12 print:py-10 print:pb-0 print:text-[#252525]">
      <div className="mb-14 hidden print:block">
        <div className="flex items-start justify-between gap-8">
          <div>
            <h1 className="text-[34px] font-black leading-tight tracking-[-0.03em] text-[#202124]">{cifra.title}</h1>
            {cifra.artist ? (
              <p className="mt-1 text-[29px] font-black leading-tight text-[#ff6a00]">{cifra.artist}</p>
            ) : null}
          </div>
          <div className="text-right text-2xl font-black text-[#202124]">Cânticos CCB</div>
        </div>
        <div className="mt-10 space-y-6 font-mono text-[17px] leading-relaxed text-[#252525]">
          <p className="font-bold">Tom: <span className="text-[#ff6a00]">{selectedKey}</span>{selectedKey !== cifra.original_key ? ` (forma dos acordes no tom de ${cifra.original_key})` : ''}</p>
          {isCifraV2(cifra) && cifra.tuning ? (
            <p>Afinação: <span className="font-bold text-[#ff6a00]">{cifra.tuning}</span></p>
          ) : null}
          {cifra.capo > 0 ? (
            <p>Capotraste na <span className="font-bold text-[#ff6a00]">{cifra.capo}ª casa</span></p>
          ) : null}
        </div>
      </div>

      {/* Mobile stage header */}
      <div className="mb-7 sm:hidden print:hidden">
        <div className="flex items-start justify-between gap-4">
          <Link
            to="/cifras"
            aria-label="Voltar para cifras"
            className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-[#252525] shadow-sm transition-colors active:scale-95"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-[34px] font-black leading-[0.98] tracking-[-0.05em] text-[#202124]">{cifra.title}</h1>
            {cifra.artist ? (
              <p className="mt-2 text-[25px] font-black leading-tight text-[#ff6a00]">{cifra.artist}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setShowOptions(true)}
            aria-label="Abrir opções da cifra"
            className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-[#252525] shadow-sm transition-colors active:scale-95"
          >
            <Settings2 className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-8 space-y-4 font-mono text-[17px]">
          <button
            type="button"
            onClick={() => setShowOptions(true)}
            className="block text-left font-bold text-[#252525]"
          >
            Tom: <span className="text-[#ff6a00]">{selectedKey}</span>
          </button>
          {cifra.capo > 0 ? (
            <button
              type="button"
              onClick={() => setShowOptions(true)}
              className="block text-left font-normal text-[#252525]"
            >
              Capotraste na <span className="font-bold text-[#ff6a00]">{cifra.capo}ª casa</span>
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
            <img src={cifra.cover_url} alt={cifra.title} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shadow-lg flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{cifra.title}</h1>
            {cifra.artist && (
              <p className="text-primary-400 font-medium mt-1">{cifra.artist}</p>
            )}
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
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-amber-500/40 hover:text-white sm:w-auto"
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

      {isCifraV2(cifra) && studyFacts.length > 0 ? (
        <div className="mb-6 hidden rounded-2xl sm:block border border-white/10 bg-background-secondary p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Visao de estudo</h2>
              <p className="text-text-muted text-sm mt-2">
                Resumo rapido da versao publicada para ensaio, estudo por instrumento e leitura em tela pequena.
              </p>
            </div>
            <Music className="hidden sm:block w-5 h-5 text-primary-400" />
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
              <span className="font-semibold text-primary-300">Observacao editorial:</span> {cifra.intro_notes}
            </div>
          ) : null}
        </div>
      ) : null}

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
                    {section.section.section_label || `Seção ${index + 1}`}
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
      <div className="sticky top-0 z-20 hidden bg-background-primary/95 sm:block backdrop-blur-sm border-b border-gray-800 -mx-4 px-4 py-3 mb-6 print:hidden">
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

      {/* Chord Diagrams */}
      {showChords && visibleChordCards.length > 0 && (
        <div className="mb-7 -mx-1 hidden print:hidden sm:mx-0 sm:mb-6 sm:block">
          <div className="mb-3 hidden items-center justify-between gap-3 sm:flex">
            <div>
              <h2 className="text-base font-semibold text-white">Dicionário de acordes</h2>
              <p className="text-xs text-gray-400">
                Visualização rápida dos acordes detectados para {PUBLIC_INSTRUMENTS.find((entry) => entry.value === selectedInstrument)?.label || selectedInstrument}.
              </p>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
            {visibleChordCards.map((item) => (
              item.kind === 'database' ? (
                <DatabaseChordShapeCard
                  key={`${item.chord}-${item.selectedShape.id}`}
                  chord={item.chord}
                  shapes={item.shapes}
                  selectedShapeId={item.selectedShape.id}
                  onSelectShape={handleShapeSelection}
                  leftHanded={showLeftHandedDiagrams}
                  editorialOverride={item.editorialOverride}
                  matchOptions={{
                    preferredKey: selectedKey,
                    originalKey: cifra.original_key,
                    progression: chords,
                  }}
                />
              ) : (
                <div key={item.chord} className="flex-shrink-0 text-center">
                  <ChordDiagramSVG diagram={item.diagram} leftHanded={showLeftHandedDiagrams} />
                </div>
              )
            ))}
          </div>
        </div>
      )}

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
                    <div className="mb-3 text-base font-medium text-[#252525] sm:font-bold sm:text-white print:font-medium print:text-[#252525]">
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

      {/* Mobile quick controls */}
      <div className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 overflow-hidden rounded-[1.75rem] border border-black/10 bg-white/95 px-2 py-3 shadow-2xl shadow-black/20 backdrop-blur-xl sm:hidden print:hidden">
        <button
          type="button"
          onClick={() => setShowOptions(true)}
          className="flex flex-col items-center gap-1.5 text-[11px] font-medium text-[#118a42]"
        >
          <Music className="h-5 w-5" />
          Tom
        </button>
        <button
          type="button"
          onClick={() => setAutoScrollSpeed(prev => prev === 0 ? 1 : prev === 1 ? 2 : prev === 2 ? 3 : 0)}
          className={`flex flex-col items-center gap-1.5 text-[11px] font-medium ${autoScrollSpeed > 0 ? 'text-[#118a42]' : 'text-gray-700'}`}
        >
          <ScrollText className="h-5 w-5" />
          Rolagem
        </button>
        <button
          type="button"
          onClick={() => setShowChords((current) => !current)}
          className={`flex flex-col items-center gap-1.5 text-[11px] font-medium ${showChords ? 'text-[#ff6a00]' : 'text-gray-700'}`}
        >
          <Settings2 className="h-5 w-5" />
          Acordes
        </button>
        <button
          type="button"
          onClick={() => setMetronomeEnabled((current) => !current)}
          className={`flex flex-col items-center gap-1.5 text-[11px] font-medium ${metronomeEnabled ? 'text-[#118a42]' : 'text-gray-700'}`}
        >
          <Gauge className="h-5 w-5" />
          Metrônomo
        </button>
        <button
          type="button"
          onClick={() => setShowOptions(true)}
          className="flex flex-col items-center gap-1.5 text-[11px] font-medium text-gray-700"
        >
          <Settings2 className="h-5 w-5" />
          Opções
        </button>
      </div>

      {showOptions ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/60 px-3 pb-3 sm:hidden print:hidden" onClick={() => setShowOptions(false)}>
          <div
            className="w-full rounded-[2rem] border border-black/10 bg-white/95 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-16 rounded-full bg-black/20" />
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-[-0.03em] text-[#252525]">Ajustes rápidos</h2>
                <p className="mt-1 text-sm text-gray-600">Controle a cifra sem sair do modo tocar.</p>
              </div>
              <button type="button" onClick={() => setShowOptions(false)} className="rounded-full bg-black/5 p-2 text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-[1fr,64px,84px,64px] items-center overflow-hidden rounded-2xl border border-black/10 bg-black/[0.03] text-[#252525]">
                <span className="px-4 py-4 text-sm font-medium text-gray-800">Transposição (Tom)</span>
                <button type="button" onClick={transposeDown} className="h-full border-l border-black/10 text-[#118a42]">−</button>
                <button type="button" onClick={() => setShowKeySelector((current) => !current)} className="h-full border-l border-black/10 text-base font-bold">{selectedKey}</button>
                <button type="button" onClick={transposeUp} className="h-full border-l border-black/10 text-2xl text-[#118a42]">+</button>
              </div>

              {showKeySelector ? (
                <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-3">
                  <div className="grid grid-cols-6 gap-2">
                    {ALL_KEYS.map((keyName) => (
                      <button
                        key={keyName}
                        type="button"
                        onClick={() => { setSelectedKey(keyName); setShowKeySelector(false); }}
                        className={`h-10 rounded-xl text-sm font-bold ${keyName === selectedKey ? 'bg-[#118a42] text-white' : 'bg-black/[0.04] text-gray-800'}`}
                      >
                        {keyName}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-[1fr,64px,84px,64px] items-center overflow-hidden rounded-2xl border border-black/10 bg-black/[0.03] text-[#252525]">
                <span className="px-4 py-4 text-sm font-medium text-gray-800">Fonte (Cifra)</span>
                <button type="button" onClick={() => setFontSize(prev => Math.max(12, prev - 1))} className="h-full border-l border-black/10 text-[#118a42]">A−</button>
                <span className="border-l border-black/10 py-4 text-center text-sm font-bold">{Math.round((fontSize / 16) * 100)}%</span>
                <button type="button" onClick={() => setFontSize(prev => Math.min(24, prev + 1))} className="h-full border-l border-black/10 text-[#118a42]">A+</button>
              </div>

              <div className="grid grid-cols-[1fr,1.3fr,90px] items-center overflow-hidden rounded-2xl border border-black/10 bg-black/[0.03] text-[#252525]">
                <span className="px-4 py-4 text-sm font-medium text-gray-800">Rolagem</span>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={1}
                  value={autoScrollSpeed}
                  onChange={(event) => setAutoScrollSpeed(Number(event.target.value))}
                  className="accent-primary-500"
                />
                <span className="border-l border-black/10 py-4 text-center text-sm font-bold">{autoScrollSpeed === 0 ? 'Off' : `${autoScrollSpeed}x`}</span>
              </div>

              <div className="grid grid-cols-[1fr,1.4fr] items-center overflow-hidden rounded-2xl border border-black/10 bg-black/[0.03] text-[#252525]">
                <span className="px-4 py-4 text-sm font-medium text-gray-800">Instrumento</span>
                <select
                  value={selectedInstrument}
                  onChange={e => handleInstrumentChange(e.target.value)}
                  className="h-full border-l border-black/10 bg-transparent px-4 py-4 text-sm font-bold outline-none"
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
                  className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm font-semibold text-gray-800"
                >
                  Compartilhar
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm font-semibold text-gray-800"
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

// =============================================
// SVG Chord Diagram Component
// =============================================

interface ChordDiagramSVGProps {
  diagram: ChordDiagram;
  leftHanded?: boolean;
}

function mirrorStringValues<T>(values: T[], stringCount: number, enabled?: boolean): T[] {
  const visible = values.slice(0, stringCount);
  return enabled ? [...visible].reverse() : visible;
}

const ChordDiagramSVG: React.FC<ChordDiagramSVGProps> = ({ diagram, leftHanded = false }) => {
  const { name, baseFret, barres } = diagram;
  const numStrings = 6;
  const numFrets = 5;
  const stringSpacing = 16;
  const fretSpacing = 18;
  const startX = 14;
  const startY = 30;
  const width = startX * 2 + stringSpacing * (numStrings - 1);
  const height = startY + fretSpacing * numFrets + 30;
  const frets = mirrorStringValues(diagram.frets, numStrings, leftHanded);

  return (
    <div className="inline-flex flex-col items-center">
      <span className="text-primary-400 font-bold text-sm mb-1">{name}</span>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="text-gray-300">
        {/* Nut or fret number */}
        {baseFret === 1 ? (
          <rect x={startX - 1} y={startY - 2} width={stringSpacing * (numStrings - 1) + 2} height={3} fill="currentColor" rx={1} />
        ) : (
          <text x={startX - 10} y={startY + fretSpacing / 2 + 4} fontSize="10" fill="#9CA3AF" textAnchor="end">
            {baseFret}fr
          </text>
        )}

        {/* Fret lines */}
        {Array.from({ length: numFrets + 1 }, (_, i) => (
          <line
            key={`fret-${i}`}
            x1={startX}
            y1={startY + i * fretSpacing}
            x2={startX + stringSpacing * (numStrings - 1)}
            y2={startY + i * fretSpacing}
            stroke="#4B5563"
            strokeWidth={1}
          />
        ))}

        {/* String lines */}
        {Array.from({ length: numStrings }, (_, i) => (
          <line
            key={`string-${i}`}
            x1={startX + i * stringSpacing}
            y1={startY}
            x2={startX + i * stringSpacing}
            y2={startY + numFrets * fretSpacing}
            stroke="#6B7280"
            strokeWidth={1}
          />
        ))}

        {/* Barres */}
        {barres.map((barre, idx) => {
          const barreStrings = frets.reduce<number[]>((acc, f, i) => {
            if (f === barre) acc.push(i);
            return acc;
          }, []);
          if (barreStrings.length < 2) return null;
          const first = Math.min(...barreStrings);
          const last = Math.max(...barreStrings);
          const y = startY + (barre - baseFret + 0.5) * fretSpacing;
          return (
            <rect
              key={`barre-${idx}`}
              x={startX + first * stringSpacing - 4}
              y={y - 5}
              width={(last - first) * stringSpacing + 8}
              height={10}
              rx={5}
              fill="#10B981"
              opacity={0.8}
            />
          );
        })}

        {/* Finger dots */}
        {frets.map((fret, stringIdx) => {
          if (fret <= 0) return null;
          // Skip if it's the barre fret (already drawn)
          if (barres.includes(fret)) return null;
          const x = startX + stringIdx * stringSpacing;
          const y = startY + (fret - baseFret + 0.5) * fretSpacing;
          return (
            <circle
              key={`dot-${stringIdx}`}
              cx={x}
              cy={y}
              r={6}
              fill="#10B981"
            />
          );
        })}

        {/* Open/Muted string indicators */}
        {frets.map((fret, stringIdx) => {
          const x = startX + stringIdx * stringSpacing;
          if (fret === 0) {
            return (
              <circle
                key={`open-${stringIdx}`}
                cx={x}
                cy={startY - 10}
                r={4}
                fill="none"
                stroke="#9CA3AF"
                strokeWidth={1.5}
              />
            );
          }
          if (fret === -1) {
            return (
              <text
                key={`muted-${stringIdx}`}
                x={x}
                y={startY - 6}
                fontSize="10"
                fill="#9CA3AF"
                textAnchor="middle"
              >
                ×
              </text>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};

interface FretboardShapeDiagram {
  name: string;
  frets: number[];
  barres: number[];
  baseFret: number;
  fingers: number[];
  stringCount: number;
}

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'number' && Number.isFinite(item)) {
        return item;
      }

      if (typeof item === 'string' && item.trim() !== '' && !Number.isNaN(Number(item))) {
        return Number(item);
      }

      return null;
    })
    .filter((item): item is number => item !== null);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function getInstrumentStringCount(instrument: string): number {
  switch (instrument) {
    case 'ukulele':
    case 'cavaco':
      return 4;
    case 'teclado':
      return 0;
    default:
      return 6;
  }
}

function normalizeDatabaseShape(shape: CifraChordShape): FretboardShapeDiagram | null {
  const frets = asNumberArray(shape.fingering.frets ?? shape.fingering.positions ?? shape.fingering.strings);
  if (frets.length === 0) {
    return null;
  }

  const stringCount = Math.max(
    1,
    Number(shape.fingering.stringCount) || frets.length || getInstrumentStringCount(shape.instrument),
  );

  return {
    name: shape.chord_name,
    frets: frets.slice(0, stringCount),
    barres: asNumberArray(shape.fingering.barres),
    baseFret: Number(shape.fingering.baseFret) || shape.base_fret || 1,
    fingers: asNumberArray(shape.fingering.fingers).slice(0, stringCount),
    stringCount,
  };
}

function buildShapeNotes(shape: CifraChordShape): string[] {
  const notes = asStringArray(shape.fingering.notes);
  const tuning = typeof shape.fingering.tuning === 'string' ? shape.fingering.tuning.trim() : '';
  const summary: string[] = [];

  if (shape.variation_name && shape.variation_name !== 'default') {
    summary.push(`Variacao: ${shape.variation_name}`);
  }

  if (tuning) {
    summary.push(`Afinacao: ${tuning}`);
  }

  if (notes.length > 0) {
    summary.push(`Notas: ${notes.join(' · ')}`);
  }

  return summary;
}

interface FretboardShapeSVGProps {
  diagram: FretboardShapeDiagram;
  leftHanded?: boolean;
}

const FretboardShapeSVG: React.FC<FretboardShapeSVGProps> = ({ diagram, leftHanded = false }) => {
  const { name, baseFret, barres, stringCount } = diagram;
  const numStrings = Math.max(1, stringCount);
  const numFrets = 5;
  const stringSpacing = numStrings <= 4 ? 18 : 16;
  const fretSpacing = 18;
  const startX = 14;
  const startY = 30;
  const width = startX * 2 + stringSpacing * (numStrings - 1);
  const height = startY + fretSpacing * numFrets + 30;
  const frets = mirrorStringValues(diagram.frets, numStrings, leftHanded);

  return (
    <div className="inline-flex flex-col items-center">
      <span className="text-primary-400 font-bold text-sm mb-1">{name}</span>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="text-gray-300">
        {baseFret === 1 ? (
          <rect x={startX - 1} y={startY - 2} width={stringSpacing * (numStrings - 1) + 2} height={3} fill="currentColor" rx={1} />
        ) : (
          <text x={startX - 10} y={startY + fretSpacing / 2 + 4} fontSize="10" fill="#9CA3AF" textAnchor="end">
            {baseFret}fr
          </text>
        )}

        {Array.from({ length: numFrets + 1 }, (_, i) => (
          <line
            key={`fret-${i}`}
            x1={startX}
            y1={startY + i * fretSpacing}
            x2={startX + stringSpacing * (numStrings - 1)}
            y2={startY + i * fretSpacing}
            stroke="#4B5563"
            strokeWidth={1}
          />
        ))}

        {Array.from({ length: numStrings }, (_, i) => (
          <line
            key={`string-${i}`}
            x1={startX + i * stringSpacing}
            y1={startY}
            x2={startX + i * stringSpacing}
            y2={startY + numFrets * fretSpacing}
            stroke="#6B7280"
            strokeWidth={1}
          />
        ))}

        {barres.map((barre, idx) => {
          const barreStrings = frets.reduce<number[]>((acc, fret, stringIdx) => {
            if (fret === barre) {
              acc.push(stringIdx);
            }
            return acc;
          }, []);

          if (barreStrings.length < 2) {
            return null;
          }

          const first = Math.min(...barreStrings);
          const last = Math.max(...barreStrings);
          const y = startY + (barre - baseFret + 0.5) * fretSpacing;

          return (
            <rect
              key={`barre-${idx}`}
              x={startX + first * stringSpacing - 4}
              y={y - 5}
              width={(last - first) * stringSpacing + 8}
              height={10}
              rx={5}
              fill="#10B981"
              opacity={0.8}
            />
          );
        })}

        {frets.map((fret, stringIdx) => {
          if (fret <= 0 || barres.includes(fret)) {
            return null;
          }

          const x = startX + stringIdx * stringSpacing;
          const y = startY + (fret - baseFret + 0.5) * fretSpacing;

          return (
            <circle
              key={`dot-${stringIdx}`}
              cx={x}
              cy={y}
              r={6}
              fill="#10B981"
            />
          );
        })}

        {frets.map((fret, stringIdx) => {
          const x = startX + stringIdx * stringSpacing;
          if (fret === 0) {
            return (
              <circle
                key={`open-${stringIdx}`}
                cx={x}
                cy={startY - 10}
                r={4}
                fill="none"
                stroke="#9CA3AF"
                strokeWidth={1.5}
              />
            );
          }

          if (fret === -1) {
            return (
              <text
                key={`muted-${stringIdx}`}
                x={x}
                y={startY - 6}
                fontSize="10"
                fill="#9CA3AF"
                textAnchor="middle"
              >
                ×
              </text>
            );
          }

          return null;
        })}
      </svg>
    </div>
  );
};

interface DatabaseChordShapeCardProps {
  chord: string;
  shapes: CifraChordShape[];
  selectedShapeId: string;
  onSelectShape: (chord: string, shapeId: string) => void;
  leftHanded?: boolean;
  editorialOverride?: CifraVersionChordOverride | null;
  matchOptions: {
    preferredKey?: string | null;
    originalKey?: string | null;
    progression?: string[] | null;
  };
}

function getShapeVariationLabel(requestedChord: string, shape: CifraChordShape): string {
  const variation = (shape.variation_name || '').trim();
  if (variation && variation.toLowerCase() !== 'default') {
    return variation;
  }

  if (shape.chord_name !== requestedChord) {
    return shape.chord_name;
  }

  return 'Padrao';
}

const DatabaseChordShapeCard: React.FC<DatabaseChordShapeCardProps> = ({
  chord,
  shapes,
  selectedShapeId,
  onSelectShape,
  leftHanded = false,
  editorialOverride,
  matchOptions,
}) => {
  const shape = shapes.find((item) => item.id === selectedShapeId) || shapes[0];
  const diagram = normalizeDatabaseShape(shape);
  const notes = buildShapeNotes(shape);
  const explanation = explainCifraChordNameMatch(chord, shape.chord_name, matchOptions);
  const isPrimaryShape = shapes[0]?.id === shape.id;
  const isEditorialShape = editorialOverride?.preferred_shape_id === shape.id;
  const editorialLabel = getEditorialOverrideLabel(editorialOverride);

  return (
    <div className="flex-shrink-0 rounded-2xl border border-white/10 bg-background-secondary px-4 py-3 text-center min-w-[168px] max-w-[198px]">
      {diagram ? (
        <FretboardShapeSVG diagram={diagram} leftHanded={leftHanded && shape.instrument !== 'teclado'} />
      ) : (
        <div className="flex min-h-[132px] flex-col items-center justify-center">
          <span className="text-primary-400 font-bold text-sm">{shape.chord_name}</span>
          <span className="mt-3 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs text-primary-200">
            Shape salvo no banco
          </span>
        </div>
      )}
      <div className="mt-2 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">{shape.instrument}</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          <span className="rounded-full border border-primary-500/30 bg-primary-500/10 px-2 py-0.5 text-[10px] font-medium text-primary-200">
            {explanation.label}
          </span>
          {leftHanded && shape.instrument !== 'teclado' ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300">
              Canhoto
            </span>
          ) : null}
          {isEditorialShape && editorialLabel ? (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
              {editorialLabel}
            </span>
          ) : null}
          {shapes.length > 1 && isPrimaryShape ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300">
              Principal
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          {explanation.detail}
        </p>
        {notes.slice(0, 2).map((note) => (
          <p key={note} className="text-[11px] text-gray-400 leading-relaxed">
            {note}
          </p>
        ))}
      </div>
      {shapes.length > 1 ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {shapes.map((option) => {
            const isActive = option.id === shape.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectShape(chord, option.id)}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'border-primary-500 bg-primary-500 text-black'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-primary-500/40 hover:text-white'
                }`}
              >
                {getShapeVariationLabel(chord, option)}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default CifraPage;
