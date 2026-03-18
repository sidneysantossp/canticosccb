import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Plus, Save, Send, Trash2, Upload } from 'lucide-react';

import AlertModal from '@/components/ui/AlertModal';
import {
  createCifraChordShape,
  createCifraSong,
  createCifraVersion,
  fetchCifraEngagementSnapshot,
  fetchCifraChordShapeVariants,
  fetchCifraReportsByVersion,
  fetchCifraSongById,
  fetchCifraVersionById,
  fetchCifraVersionSections,
  findCifraChordShapePreset,
  parsePlainTextSectionLines,
  publishCifraVersion,
  saveCifraVersionDraft,
  serializeSectionLines,
  submitCifraVersionForReview,
  updateCifraChordShape,
  updateCifraReportStatus,
  type CifraChordShapePreset,
  type CifraEngagementSnapshot,
  type CifraVersionSectionDraft,
} from '@/lib/admin/cifrasV2AdminApi';
import {
  CIFRA_V2_ARRANGEMENTS,
  CIFRA_V2_INSTRUMENTS,
  type CifraChordShape,
  type CifraReport,
  type CifraReportStatus,
  type CifraSectionKey,
  type CifraSourceType,
} from '@/types/cifras-v2';
import { extractChords } from '@/utils/chordUtils';

type EditableSection = {
  key: CifraSectionKey;
  label: string;
  text: string;
};

type EditableChordShape = {
  id: string | null;
  chordName: string;
  variationName: string;
  frets: string;
  fingers: string;
  barres: string;
  notes: string;
  tuning: string;
  stringCount: string;
  baseFret: string;
  priority: string;
  isLeftHandedSupported: boolean;
  isActive: boolean;
};

const DIFFICULTY_OPTIONS = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'basico', label: 'Basico' },
  { value: 'intermediario', label: 'Intermediario' },
  { value: 'avancado', label: 'Avancado' },
] as const;

const PUBLICATION_OPTIONS = [
  { value: 'community', label: 'Comunidade' },
  { value: 'reviewed', label: 'Revisada' },
  { value: 'official', label: 'Oficial' },
] as const;

const SECTION_KEY_OPTIONS: Array<{ value: CifraSectionKey; label: string }> = [
  { value: 'intro', label: 'Intro' },
  { value: 'verse', label: 'Verse' },
  { value: 'chorus', label: 'Chorus' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'ending', label: 'Ending' },
  { value: 'turnaround', label: 'Turnaround' },
  { value: 'custom', label: 'Custom' },
];

const REPORT_STATUS_LABELS: Record<CifraReportStatus, string> = {
  open: 'Aberta',
  triaged: 'Triada',
  resolved: 'Resolvida',
  dismissed: 'Descartada',
};

const DEFAULT_TUNING_BY_INSTRUMENT = {
  violao: 'E A D G B E',
  guitarra: 'E A D G B E',
  ukulele: 'G C E A',
  teclado: 'C D E F G A B',
  cavaco: 'D G B D',
  outro: '',
} as const;

function getDefaultStringCount(instrument: string): string {
  switch (instrument) {
    case 'ukulele':
    case 'cavaco':
      return '4';
    case 'teclado':
      return '7';
    default:
      return '6';
  }
}

function createEmptyChordShape(instrument: string, chordName = ''): EditableChordShape {
  return {
    id: null,
    chordName,
    variationName: 'default',
    frets: '',
    fingers: '',
    barres: '',
    notes: '',
    tuning: DEFAULT_TUNING_BY_INSTRUMENT[instrument as keyof typeof DEFAULT_TUNING_BY_INSTRUMENT] || '',
    stringCount: getDefaultStringCount(instrument),
    baseFret: '1',
    priority: '0',
    isLeftHandedSupported: false,
    isActive: true,
  };
}

function parseNumberList(value: string): number[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function parseStringList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringifyList(values: unknown): string {
  if (!Array.isArray(values)) {
    return '';
  }

  return values.join(', ');
}

function mapChordShapeToEditorForm(shape: CifraChordShape): EditableChordShape {
  return {
    id: shape.id,
    chordName: shape.chord_name,
    variationName: shape.variation_name || 'default',
    frets: stringifyList(shape.fingering.frets ?? shape.fingering.positions ?? shape.fingering.strings),
    fingers: stringifyList(shape.fingering.fingers),
    barres: stringifyList(shape.fingering.barres),
    notes: stringifyList(shape.fingering.notes),
    tuning: typeof shape.fingering.tuning === 'string'
      ? shape.fingering.tuning
      : DEFAULT_TUNING_BY_INSTRUMENT[shape.instrument],
    stringCount: String(shape.fingering.stringCount ?? getDefaultStringCount(shape.instrument)),
    baseFret: String(shape.base_fret || 1),
    priority: String(shape.priority ?? 0),
    isLeftHandedSupported: shape.is_left_handed_supported,
    isActive: shape.is_active,
  };
}

function mapChordPresetToEditorForm(preset: CifraChordShapePreset): EditableChordShape {
  return {
    id: null,
    chordName: preset.chord_name,
    variationName: preset.variation_name || 'default',
    frets: stringifyList((preset.fingering as Record<string, unknown>).frets ?? (preset.fingering as Record<string, unknown>).positions ?? (preset.fingering as Record<string, unknown>).strings),
    fingers: stringifyList((preset.fingering as Record<string, unknown>).fingers),
    barres: stringifyList((preset.fingering as Record<string, unknown>).barres),
    notes: stringifyList((preset.fingering as Record<string, unknown>).notes),
    tuning: typeof (preset.fingering as Record<string, unknown>).tuning === 'string'
      ? ((preset.fingering as Record<string, unknown>).tuning as string)
      : DEFAULT_TUNING_BY_INSTRUMENT[preset.instrument],
    stringCount: String((preset.fingering as Record<string, unknown>).stringCount ?? getDefaultStringCount(preset.instrument)),
    baseFret: String(preset.base_fret || 1),
    priority: String(preset.priority ?? 0),
    isLeftHandedSupported: Boolean(preset.is_left_handed_supported),
    isActive: preset.is_active !== false,
  };
}

const AdminCifraV2Editor: React.FC = () => {
  const navigate = useNavigate();
  const { versionId } = useParams<{ versionId: string }>();
  const isCreateMode = !versionId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engagement, setEngagement] = useState<CifraEngagementSnapshot | null>(null);
  const [reports, setReports] = useState<CifraReport[]>([]);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [isLoadingChordShapes, setIsLoadingChordShapes] = useState(false);
  const [isSavingInlineShape, setIsSavingInlineShape] = useState(false);
  const [chordShapeVariants, setChordShapeVariants] = useState<Record<string, CifraChordShape[]>>({});
  const [selectedChordName, setSelectedChordName] = useState('');
  const [selectedShapeId, setSelectedShapeId] = useState('');
  const [inlineShapeForm, setInlineShapeForm] = useState<EditableChordShape>(createEmptyChordShape('violao'));
  const [songId, setSongId] = useState('');
  const [songForm, setSongForm] = useState({
    title: '',
    canonicalSlug: '',
    composerName: '',
    subtitle: '',
    hinoId: '',
    hinarioNumero: '',
    sourceType: 'avulso' as CifraSourceType,
    coverUrl: '',
  });
  const [form, setForm] = useState({
    title: '',
    instrument: 'violao',
    arrangementType: 'completa',
    difficultyLevel: 'intermediario',
    originalKey: 'C',
    preferredKey: '',
    capo: 0,
    tuning: 'standard',
    tempoBpm: '',
    timeSignature: '',
    introNotes: '',
    publicationLabel: 'community',
    isPrimary: true,
    isActive: true,
    isSearchable: true,
    publicSlug: '',
  });
  const [sections, setSections] = useState<EditableSection[]>([]);
  const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    void loadEditor();
  }, [versionId]);

  const loadEditor = async () => {
    if (!versionId) {
      setEngagement(null);
      setReports([]);
      setSongId('');
      setSongForm({
        title: '',
        canonicalSlug: '',
        composerName: '',
        subtitle: '',
        hinoId: '',
        hinarioNumero: '',
        sourceType: 'avulso',
        coverUrl: '',
      });
      setForm({
        title: '',
        instrument: 'violao',
        arrangementType: 'completa',
        difficultyLevel: 'intermediario',
        originalKey: 'C',
        preferredKey: '',
        capo: 0,
        tuning: 'standard',
        tempoBpm: '',
        timeSignature: '',
        introNotes: '',
        publicationLabel: 'community',
        isPrimary: true,
        isActive: true,
        isSearchable: true,
        publicSlug: '',
      });
      setSections([{ key: 'verse', label: 'Corpo', text: '' }]);
      setSelectedChordName('');
      setSelectedShapeId('');
      setInlineShapeForm(createEmptyChordShape('violao'));
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const version = await fetchCifraVersionById(versionId);
      if (!version) {
        setError('Versão de cifra não encontrada.');
        return;
      }

      const [song, versionSections] = await Promise.all([
        fetchCifraSongById(version.song_id),
        fetchCifraVersionSections(version.id),
      ]);

      setSongId(version.song_id);
      setSongForm({
        title: song?.title || version.title,
        canonicalSlug: song?.canonical_slug || '',
        composerName: song?.composer_name || '',
        subtitle: song?.subtitle || '',
        hinoId: song?.hino_id || '',
        hinarioNumero: song?.hinario_numero ? String(song.hinario_numero) : '',
        sourceType: song?.source_type || 'avulso',
        coverUrl: song?.cover_url || '',
      });
      setForm({
        title: version.title,
        instrument: version.instrument,
        arrangementType: version.arrangement_type,
        difficultyLevel: version.difficulty_level,
        originalKey: version.original_key,
        preferredKey: version.preferred_key || '',
        capo: version.capo,
        tuning: version.tuning,
        tempoBpm: version.tempo_bpm ? String(version.tempo_bpm) : '',
        timeSignature: version.time_signature || '',
        introNotes: version.intro_notes || '',
        publicationLabel: version.publication_label,
        isPrimary: version.is_primary,
        isActive: version.is_active,
        isSearchable: version.is_searchable,
        publicSlug: version.public_slug,
      });
      setSections(
        versionSections.length > 0
          ? versionSections.map((section) => ({
              key: section.section_key,
              label: section.section_label,
              text: serializeSectionLines(section.content_ast),
            }))
          : [{ key: 'verse', label: 'Corpo', text: '' }],
      );

      const [engagementSnapshot, reportRows] = await Promise.all([
        fetchCifraEngagementSnapshot(version.id),
        fetchCifraReportsByVersion(version.id),
      ]);
      setEngagement(engagementSnapshot);
      setReports(reportRows);
    } catch (editorError: any) {
      console.error('Erro ao carregar editor de cifra v2:', editorError);
      setError(editorError?.message || 'Erro ao carregar editor de cifra v2.');
    } finally {
      setIsLoading(false);
    }
  };

  const sectionDrafts = useMemo<CifraVersionSectionDraft[]>(
    () =>
      sections.map((section, index) => ({
        key: section.key,
        label: section.label.trim() || `Secao ${index + 1}`,
        order: index + 1,
        lines: parsePlainTextSectionLines(section.text),
      })),
    [sections],
  );

  const detectedChords = useMemo(() => {
    const sectionText = sections
      .map((section) => section.text.trim())
      .filter(Boolean)
      .join('\n\n');

    return extractChords(sectionText);
  }, [sections]);

  const fetchDetectedChordShapes = async (instrument: string, chords: string[]) => {
    if (chords.length === 0) {
      return {};
    }

    return fetchCifraChordShapeVariants(instrument as any, chords);
  };

  useEffect(() => {
    let isMounted = true;

    const loadChordShapes = async () => {
      if (detectedChords.length === 0) {
        if (isMounted) {
          setChordShapeVariants({});
        }
        return;
      }

      try {
        setIsLoadingChordShapes(true);
        const variants = await fetchDetectedChordShapes(form.instrument, detectedChords);
        if (isMounted) {
          setChordShapeVariants(variants);
        }
      } catch (shapeError) {
        console.error('Erro ao carregar shapes detectados da cifra:', shapeError);
        if (isMounted) {
          setChordShapeVariants({});
        }
      } finally {
        if (isMounted) {
          setIsLoadingChordShapes(false);
        }
      }
    };

    void loadChordShapes();

    return () => {
      isMounted = false;
    };
  }, [detectedChords, form.instrument]);

  const chordsWithShapeCount = useMemo(
    () => detectedChords.filter((chord) => (chordShapeVariants[chord]?.length ?? 0) > 0).length,
    [chordShapeVariants, detectedChords],
  );

  const chordPresetSuggestions = useMemo<Record<string, CifraChordShapePreset>>(
    () =>
      Object.fromEntries(
        detectedChords
          .map((chord) => {
            const preset = findCifraChordShapePreset(form.instrument as any, chord);
            return preset ? [chord, preset] : null;
          })
          .filter((entry): entry is [string, CifraChordShapePreset] => Boolean(entry)),
      ),
    [detectedChords, form.instrument],
  );

  const missingChordsWithPresetCount = useMemo(
    () => detectedChords.filter((chord) => (chordShapeVariants[chord]?.length ?? 0) === 0 && Boolean(chordPresetSuggestions[chord])).length,
    [chordPresetSuggestions, chordShapeVariants, detectedChords],
  );

  const selectedChordVariants = useMemo(
    () => (selectedChordName ? chordShapeVariants[selectedChordName] || [] : []),
    [chordShapeVariants, selectedChordName],
  );

  const selectedChordPreset = selectedChordName ? chordPresetSuggestions[selectedChordName] || null : null;

  useEffect(() => {
    if (detectedChords.length === 0) {
      setSelectedChordName('');
      setSelectedShapeId('');
      setInlineShapeForm(createEmptyChordShape(form.instrument));
      return;
    }

    setSelectedChordName((current) => (detectedChords.includes(current) ? current : detectedChords[0]));
  }, [detectedChords, form.instrument]);

  useEffect(() => {
    if (!selectedChordName) {
      setSelectedShapeId('');
      setInlineShapeForm(createEmptyChordShape(form.instrument));
      return;
    }

    const variants = chordShapeVariants[selectedChordName] || [];

    if (selectedShapeId) {
      const selectedShape = variants.find((variant) => variant.id === selectedShapeId);
      if (selectedShape) {
        setInlineShapeForm(mapChordShapeToEditorForm(selectedShape));
        return;
      }
    }

    if (variants[0]) {
      setSelectedShapeId(variants[0].id);
      setInlineShapeForm(mapChordShapeToEditorForm(variants[0]));
      return;
    }

    setSelectedShapeId('');
    setInlineShapeForm(createEmptyChordShape(form.instrument, selectedChordName));
  }, [chordShapeVariants, form.instrument, selectedChordName, selectedShapeId]);

  const createVersionForNewSong = async () => {
    const canonicalSongTitle = songForm.title.trim() || form.title.trim();
    if (!canonicalSongTitle) {
      throw new Error('Informe o título canônico da música antes de salvar.');
    }

    const versionTitle = form.title.trim() || canonicalSongTitle;
    const createdSong = await createCifraSong({
      title: canonicalSongTitle,
      canonicalSlug: songForm.canonicalSlug || undefined,
      composerName: songForm.composerName || null,
      subtitle: songForm.subtitle || null,
      hinoId: songForm.hinoId || null,
      hinarioNumero: songForm.hinarioNumero ? Number(songForm.hinarioNumero) : null,
      sourceType: songForm.sourceType,
      coverUrl: songForm.coverUrl || null,
      isActive: true,
      isIndexable: true,
      metadata: {
        created_via: 'admin_cifra_v2_editor',
      },
    });

    if (!createdSong) {
      throw new Error('Não foi possível criar a música canônica da cifra.');
    }

    const createdVersion = await createCifraVersion({
      songId: createdSong.id,
      publicSlug: form.publicSlug || undefined,
      title: versionTitle,
      instrument: form.instrument as any,
      arrangementType: form.arrangementType as any,
      difficultyLevel: form.difficultyLevel as any,
      originalKey: form.originalKey,
      preferredKey: form.preferredKey || null,
      capo: Number(form.capo) || 0,
      tuning: form.tuning || 'standard',
      tempoBpm: form.tempoBpm ? Number(form.tempoBpm) : null,
      timeSignature: form.timeSignature || null,
      introNotes: form.introNotes || null,
      publicationLabel: form.publicationLabel as any,
      isPrimary: form.isPrimary,
      isActive: form.isActive,
      isSearchable: form.isSearchable,
      status: 'draft',
    });

    if (!createdVersion) {
      throw new Error('Não foi possível criar a primeira versão da cifra.');
    }

    setSongId(createdSong.id);
    setSongForm((current) => ({
      ...current,
      title: createdSong.title,
      canonicalSlug: createdSong.canonical_slug,
    }));

    return {
      songId: createdSong.id,
      versionId: createdVersion.id,
    };
  };

  const handlePersist = async (mode: 'draft' | 'review' | 'publish') => {
    try {
      setIsSaving(true);
      setError(null);

      let targetVersionId = versionId;
      let resolvedSongId = songId;
      if (!targetVersionId) {
        const createdResources = await createVersionForNewSong();
        targetVersionId = createdResources.versionId;
        resolvedSongId = createdResources.songId;
      }

      if (!targetVersionId) {
        throw new Error('Não foi possível identificar a versão a ser persistida.');
      }

      const payload = {
        versionId: targetVersionId,
        sections: sectionDrafts,
        markAsPrimary: form.isPrimary,
        versionPatch: {
          songId: resolvedSongId,
          title: form.title,
          instrument: form.instrument as any,
          arrangementType: form.arrangementType as any,
          difficultyLevel: form.difficultyLevel as any,
          originalKey: form.originalKey,
          preferredKey: form.preferredKey || null,
          capo: Number(form.capo) || 0,
          tuning: form.tuning,
          tempoBpm: form.tempoBpm ? Number(form.tempoBpm) : null,
          timeSignature: form.timeSignature || null,
          introNotes: form.introNotes || null,
          publicationLabel: form.publicationLabel as any,
          isPrimary: form.isPrimary,
          isActive: form.isActive,
          isSearchable: form.isSearchable,
          publicSlug: form.publicSlug,
        },
      };

      const result =
        mode === 'publish'
          ? await publishCifraVersion(payload)
          : mode === 'review'
            ? await submitCifraVersionForReview(payload)
            : await saveCifraVersionDraft(payload);

      if (!result) {
        throw new Error('Não foi possível persistir a versão v2.');
      }

      if (isCreateMode && targetVersionId) {
        navigate(`/admin/cifras-v2/versions/${targetVersionId}/edit`, { replace: true });
      }

      setAlert({
        isOpen: true,
        title: isCreateMode ? 'Cifra criada' : 'Versão atualizada',
        message:
          mode === 'publish'
            ? isCreateMode
              ? 'A nova cifra foi criada e publicada no modelo v2.'
              : 'A cifra foi publicada no modelo v2.'
            : mode === 'review'
              ? isCreateMode
                ? 'A nova cifra foi criada e enviada para revisão.'
                : 'A cifra foi enviada para revisão.'
              : isCreateMode
                ? 'A nova cifra foi criada como rascunho no modelo v2.'
                : 'O rascunho da cifra foi salvo com sucesso.',
        type: 'success',
      });

      if (!isCreateMode) {
        await loadEditor();
      }
    } catch (persistError: any) {
      console.error('Erro ao persistir cifra v2:', persistError);
      setAlert({
        isOpen: true,
        title: 'Erro ao salvar',
        message: persistError?.message || 'Não foi possível persistir a cifra v2.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSection = (index: number, patch: Partial<EditableSection>) => {
    setSections((current) =>
      current.map((section, sectionIndex) => (sectionIndex === index ? { ...section, ...patch } : section)),
    );
  };

  const addSection = () => {
    setSections((current) => [
      ...current,
      {
        key: 'custom',
        label: `Secao ${current.length + 1}`,
        text: '',
      },
    ]);
  };

  const removeSection = (index: number) => {
    setSections((current) => current.filter((_, sectionIndex) => sectionIndex !== index));
  };

  const handleCreateInlineVariation = (chordName = selectedChordName) => {
    setSelectedChordName(chordName);
    setSelectedShapeId('');
    setInlineShapeForm(createEmptyChordShape(form.instrument, chordName));
  };

  const handleApplyPresetToInlineShape = (chordName = selectedChordName) => {
    const preset = chordPresetSuggestions[chordName];
    if (!preset) {
      return;
    }

    setSelectedChordName(chordName);
    setSelectedShapeId('');
    setInlineShapeForm(mapChordPresetToEditorForm(preset));
  };

  const handleSaveInlineShape = async () => {
    if (!selectedChordName) {
      return;
    }

    try {
      setIsSavingInlineShape(true);

      const payload = {
        instrument: form.instrument as any,
        chord_name: selectedChordName,
        variation_name: inlineShapeForm.variationName.trim() || 'default',
        base_fret: Number(inlineShapeForm.baseFret || 1) || 1,
        priority: Number(inlineShapeForm.priority || 0) || 0,
        is_left_handed_supported: inlineShapeForm.isLeftHandedSupported,
        is_active: inlineShapeForm.isActive,
        fingering: {
          frets: parseNumberList(inlineShapeForm.frets),
          fingers: parseNumberList(inlineShapeForm.fingers),
          barres: parseNumberList(inlineShapeForm.barres),
          notes: parseStringList(inlineShapeForm.notes),
          tuning: inlineShapeForm.tuning.trim(),
          stringCount: Number(inlineShapeForm.stringCount || 0) || undefined,
        },
      };

      const savedShape = inlineShapeForm.id
        ? await updateCifraChordShape(inlineShapeForm.id, payload)
        : await createCifraChordShape(payload);

      const refreshedVariants = await fetchDetectedChordShapes(form.instrument, detectedChords);
      setChordShapeVariants(refreshedVariants);
      setSelectedChordName(savedShape.chord_name);
      setSelectedShapeId(savedShape.id);
      setInlineShapeForm(mapChordShapeToEditorForm(savedShape));
      setAlert({
        isOpen: true,
        title: inlineShapeForm.id ? 'Shape atualizado' : 'Shape criado',
        message: inlineShapeForm.id
          ? `A variação ${savedShape.variation_name} foi atualizada no editor rápido.`
          : `A nova variação ${savedShape.variation_name} foi criada para ${savedShape.chord_name}.`,
        type: 'success',
      });
    } catch (shapeError: any) {
      console.error('Erro ao salvar shape inline da cifra:', shapeError);
      setAlert({
        isOpen: true,
        title: 'Erro ao salvar shape',
        message: shapeError?.message || 'Não foi possível salvar a variação do acorde.',
        type: 'error',
      });
    } finally {
      setIsSavingInlineShape(false);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: CifraReportStatus) => {
    if (!versionId) {
      return;
    }

    try {
      setUpdatingReportId(reportId);
      await updateCifraReportStatus(reportId, status);
      const [engagementSnapshot, reportRows] = await Promise.all([
        fetchCifraEngagementSnapshot(versionId),
        fetchCifraReportsByVersion(versionId),
      ]);
      setEngagement(engagementSnapshot);
      setReports(reportRows);
      setAlert({
        isOpen: true,
        title: 'Denúncia atualizada',
        message: `O status da denúncia foi alterado para ${REPORT_STATUS_LABELS[status].toLowerCase()}.`,
        type: 'success',
      });
    } catch (reportError: any) {
      console.error('Erro ao atualizar denúncia da cifra:', reportError);
      setAlert({
        isOpen: true,
        title: 'Erro ao atualizar denúncia',
        message: reportError?.message || 'Não foi possível atualizar o status da denúncia.',
        type: 'error',
      });
    } finally {
      setUpdatingReportId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <button
          onClick={() => navigate('/admin/cifras')}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            onClick={() => navigate('/admin/cifras')}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para cifras
          </button>
          <h1 className="text-3xl font-bold text-white">{isCreateMode ? 'Nova Cifra V2' : 'Editor Cifra V2'}</h1>
          <p className="text-gray-400 mt-2">
            {isCreateMode
              ? 'Crie a música canônica, a primeira versão e a estrutura editorial da cifra em um único fluxo.'
              : 'Edite seções, publicação e metadados da versão estruturada da cifra.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/cifras"
            className="inline-flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <Eye className="w-4 h-4" />
            Listagem
          </Link>
          <button
            onClick={() => void handlePersist('draft')}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-60 text-white rounded-xl transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar rascunho
          </button>
          <button
            onClick={() => void handlePersist('review')}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-semibold rounded-xl transition-colors"
          >
            <Send className="w-4 h-4" />
            Enviar revisão
          </button>
          <button
            onClick={() => void handlePersist('publish')}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-black font-semibold rounded-xl transition-colors"
          >
            <Upload className="w-4 h-4" />
            Publicar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-6">
        <div className="space-y-6">
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-5">Música canônica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Título da música</label>
                <input
                  type="text"
                  value={songForm.title}
                  onChange={(event) => setSongForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Slug canônico</label>
                <input
                  type="text"
                  value={songForm.canonicalSlug}
                  onChange={(event) => setSongForm((current) => ({ ...current, canonicalSlug: event.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Compositor / artista</label>
                <input
                  type="text"
                  value={songForm.composerName}
                  onChange={(event) => setSongForm((current) => ({ ...current, composerName: event.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subtítulo</label>
                <input
                  type="text"
                  value={songForm.subtitle}
                  onChange={(event) => setSongForm((current) => ({ ...current, subtitle: event.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hino ID relacionado</label>
                <input
                  type="text"
                  value={songForm.hinoId}
                  onChange={(event) => setSongForm((current) => ({ ...current, hinoId: event.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Número no hinário</label>
                <input
                  type="number"
                  value={songForm.hinarioNumero}
                  onChange={(event) => setSongForm((current) => ({ ...current, hinarioNumero: event.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Origem</label>
                <select
                  value={songForm.sourceType}
                  onChange={(event) => setSongForm((current) => ({ ...current, sourceType: event.target.value as CifraSourceType }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                >
                  <option value="avulso">Avulso</option>
                  <option value="hinario">Hinário</option>
                  <option value="album">Álbum</option>
                  <option value="playlist">Playlist</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Capa (URL)</label>
                <input
                  type="text"
                  value={songForm.coverUrl}
                  onChange={(event) => setSongForm((current) => ({ ...current, coverUrl: event.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-5">Metadados da versão</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Título da versão</label>
                <input type="text" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Slug público</label>
                <input type="text" value={form.publicSlug} onChange={(event) => setForm((current) => ({ ...current, publicSlug: event.target.value }))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Instrumento</label>
                <select value={form.instrument} onChange={(event) => setForm((current) => ({ ...current, instrument: event.target.value }))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white">
                  {CIFRA_V2_INSTRUMENTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Arranjo</label>
                <select value={form.arrangementType} onChange={(event) => setForm((current) => ({ ...current, arrangementType: event.target.value }))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white">
                  {CIFRA_V2_ARRANGEMENTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Dificuldade</label>
                <select value={form.difficultyLevel} onChange={(event) => setForm((current) => ({ ...current, difficultyLevel: event.target.value }))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white">
                  {DIFFICULTY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Selo editorial</label>
                <select value={form.publicationLabel} onChange={(event) => setForm((current) => ({ ...current, publicationLabel: event.target.value }))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white">
                  {PUBLICATION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tom original</label>
                <input type="text" value={form.originalKey} onChange={(event) => setForm((current) => ({ ...current, originalKey: event.target.value }))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tom preferencial</label>
                <input type="text" value={form.preferredKey} onChange={(event) => setForm((current) => ({ ...current, preferredKey: event.target.value }))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Capotraste</label>
                <input type="number" value={form.capo} onChange={(event) => setForm((current) => ({ ...current, capo: Number(event.target.value) || 0 }))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Afinação</label>
                <input type="text" value={form.tuning} onChange={(event) => setForm((current) => ({ ...current, tuning: event.target.value }))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">BPM</label>
                <input type="number" value={form.tempoBpm} onChange={(event) => setForm((current) => ({ ...current, tempoBpm: event.target.value }))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Compasso</label>
                <input type="text" value={form.timeSignature} onChange={(event) => setForm((current) => ({ ...current, timeSignature: event.target.value }))} placeholder="4/4" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Notas de introdução</label>
              <textarea value={form.introNotes} onChange={(event) => setForm((current) => ({ ...current, introNotes: event.target.value }))} rows={3} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-gray-700 text-gray-300">
                <input type="checkbox" checked={form.isPrimary} onChange={(event) => setForm((current) => ({ ...current, isPrimary: event.target.checked }))} />
                Versão principal
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-gray-700 text-gray-300">
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
                Ativa
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-gray-700 text-gray-300">
                <input type="checkbox" checked={form.isSearchable} onChange={(event) => setForm((current) => ({ ...current, isSearchable: event.target.checked }))} />
                Pesquisável
              </label>
            </div>
          </div>

          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold text-white">Seções</h2>
                <p className="text-gray-400 text-sm mt-1">Cada seção mantém texto e acordes estruturados separadamente.</p>
              </div>
              <button onClick={addSection} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors">
                <Plus className="w-4 h-4" />
                Adicionar seção
              </button>
            </div>

            <div className="space-y-4">
              {sections.map((section, index) => (
                <div key={`${index}-${section.label}`} className="border border-gray-700 rounded-xl p-4 bg-black/20">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr,220px,auto] gap-3 items-start">
                    <input type="text" value={section.label} onChange={(event) => updateSection(index, { label: event.target.value })} className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
                    <select value={section.key} onChange={(event) => updateSection(index, { key: event.target.value as CifraSectionKey })} className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white">
                      {SECTION_KEY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <button onClick={() => removeSection(index)} disabled={sections.length === 1} className="inline-flex items-center justify-center p-3 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-400 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <textarea value={section.text} onChange={(event) => updateSection(index, { text: event.target.value })} rows={10} className="mt-3 w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono text-sm whitespace-pre" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Contexto da música</h2>
            <div className="space-y-2 text-sm text-gray-300">
              <p>Título canônico: <span className="text-white">{songForm.title || 'Não definido'}</span></p>
              <p>Slug da música: <span className="text-white">{songForm.canonicalSlug || 'Não definido'}</span></p>
              <p>Song ID: <span className="text-white break-all">{songId || 'Será criado ao salvar'}</span></p>
              <p>Version ID: <span className="text-white break-all">{versionId || 'Será criado ao salvar'}</span></p>
            </div>
          </div>

          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Resumo da estrutura</h2>
            <div className="space-y-3 text-sm text-gray-300">
              <p>Seções no editor: <span className="text-white">{sectionDrafts.length}</span></p>
              <p>Linhas totais: <span className="text-white">{sectionDrafts.reduce((sum, section) => sum + section.lines.length, 0)}</span></p>
              <p>Blocos prontos para publicação: <span className="text-white">{sectionDrafts.filter((section) => section.lines.length > 0).length}</span></p>
            </div>
          </div>

          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Acordes detectados</h2>
                <p className="text-sm text-gray-400 mt-1">
                  O editor lê o conteúdo atual e mostra as variações já cadastradas para {form.instrument}.
                </p>
              </div>
              <Link
                to="/admin/cifras-v2/shapes"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
              >
                Abrir dicionário
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border border-gray-700 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Detectados</p>
                <p className="mt-1 text-2xl font-bold text-white">{detectedChords.length}</p>
              </div>
              <div className="rounded-xl border border-gray-700 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Com shapes</p>
                <p className="mt-1 text-2xl font-bold text-primary-300">{chordsWithShapeCount}</p>
              </div>
              <div className="rounded-xl border border-gray-700 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Pendentes</p>
                <p className="mt-1 text-2xl font-bold text-amber-300">{Math.max(detectedChords.length - chordsWithShapeCount, 0)}</p>
              </div>
            </div>

            {missingChordsWithPresetCount > 0 ? (
              <div className="mb-4 rounded-xl border border-primary-500/20 bg-primary-500/5 p-4 text-sm text-gray-300">
                {missingChordsWithPresetCount} acorde(s) sem shape salvo já possuem preset compatível para {form.instrument}.
              </div>
            ) : null}

            {isLoadingChordShapes ? (
              <div className="py-8 text-center text-sm text-gray-400">Carregando variações salvas...</div>
            ) : detectedChords.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-700 bg-black/10 p-4 text-sm text-gray-400">
                Adicione linhas de acordes nas seções para detectar shapes e abrir o fluxo de cadastro rapidamente.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {detectedChords.map((chord) => {
                  const variants = chordShapeVariants[chord] || [];
                  const primaryVariant = variants[0];
                  const shapeLink = `/admin/cifras-v2/shapes?instrument=${encodeURIComponent(form.instrument)}&chord=${encodeURIComponent(chord)}`;

                  return (
                    <div key={chord} className="rounded-xl border border-gray-700 bg-black/20 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-white">{chord}</p>
                          <p className="mt-1 text-sm text-gray-400">
                            {variants.length > 0
                              ? `${variants.length} variação(ões) cadastrada(s). Principal: ${primaryVariant?.variation_name || 'default'}.`
                              : 'Nenhum shape salvo para este acorde no instrumento atual.'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedChordName(chord)}
                            className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors ${
                              selectedChordName === chord
                                ? 'border-primary-500/40 bg-primary-500/10 text-primary-200'
                                : 'border-gray-700 text-white hover:bg-gray-800'
                            }`}
                          >
                            Editar aqui
                          </button>
                          <Link
                            to={shapeLink}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-800 transition-colors"
                          >
                            {variants.length > 0 ? 'Gerenciar' : 'Cadastrar shape'}
                          </Link>
                        </div>
                      </div>

                      {variants.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {variants.map((variant) => (
                            <span
                              key={variant.id}
                              className={`rounded-full border px-2.5 py-1 text-xs ${
                                variant.id === primaryVariant?.id
                                  ? 'border-primary-500/30 bg-primary-500/10 text-primary-200'
                                  : 'border-gray-700 bg-gray-900/70 text-gray-300'
                              }`}
                            >
                              {variant.variation_name}
                              {variant.id === primaryVariant?.id ? ' · principal' : ''}
                            </span>
                          ))}
                        </div>
                      ) : chordPresetSuggestions[chord] ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-primary-500/30 bg-primary-500/10 px-2.5 py-1 text-xs text-primary-200">
                            Preset base disponível
                          </span>
                          <button
                            type="button"
                            onClick={() => handleApplyPresetToInlineShape(chord)}
                            className="rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1.5 text-xs text-primary-100 hover:bg-primary-500/20 transition-colors"
                          >
                            Usar preset
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Editor rápido de shape</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Cadastre ou ajuste uma variação sem sair da cifra. O instrumento segue a versão atual.
                </p>
              </div>
              {selectedChordName ? (
                <button
                  type="button"
                  onClick={() => handleCreateInlineVariation()}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nova variação
                </button>
              ) : null}
            </div>

            {detectedChords.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-700 bg-black/10 p-4 text-sm text-gray-400">
                Quando houver acordes detectados nas seções, este editor rápido ficará disponível.
              </div>
            ) : (
              <div className="space-y-4">
                {selectedChordPreset && !inlineShapeForm.id ? (
                  <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">Preset compatível encontrado</p>
                        <p className="mt-1 text-sm text-gray-300">
                          Use o preset base de {selectedChordPreset.chord_name} para acelerar o cadastro desta variação.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetToInlineShape()}
                        className="inline-flex items-center justify-center rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-2 text-sm text-primary-100 hover:bg-primary-500/20 transition-colors"
                      >
                        Aplicar preset
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm text-gray-300">Acorde detectado</span>
                    <select
                      value={selectedChordName}
                      onChange={(event) => {
                        setSelectedChordName(event.target.value);
                        setSelectedShapeId('');
                      }}
                      className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                    >
                      {detectedChords.map((chord) => (
                        <option key={chord} value={chord}>{chord}</option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-gray-300">Variação existente</span>
                    <select
                      value={selectedShapeId || '__new'}
                      onChange={(event) => {
                        if (event.target.value === '__new') {
                          handleCreateInlineVariation();
                          return;
                        }
                        setSelectedShapeId(event.target.value);
                      }}
                      className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                    >
                      <option value="__new">Nova variação</option>
                      {selectedChordVariants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.variation_name} {variant.priority > 0 ? `· prioridade ${variant.priority}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-sm text-gray-300">Variação</span>
                    <input
                      type="text"
                      value={inlineShapeForm.variationName}
                      onChange={(event) => setInlineShapeForm((current) => ({ ...current, variationName: event.target.value }))}
                      className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-gray-300">Base fret</span>
                    <input
                      type="number"
                      min="1"
                      value={inlineShapeForm.baseFret}
                      onChange={(event) => setInlineShapeForm((current) => ({ ...current, baseFret: event.target.value }))}
                      className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-gray-300">Prioridade</span>
                    <input
                      type="number"
                      value={inlineShapeForm.priority}
                      onChange={(event) => setInlineShapeForm((current) => ({ ...current, priority: event.target.value }))}
                      className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm text-gray-300">Frets / posições</span>
                    <input
                      type="text"
                      value={inlineShapeForm.frets}
                      onChange={(event) => setInlineShapeForm((current) => ({ ...current, frets: event.target.value }))}
                      placeholder="0, 2, 2, 1, 0, 0"
                      className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-gray-300">Dedos</span>
                    <input
                      type="text"
                      value={inlineShapeForm.fingers}
                      onChange={(event) => setInlineShapeForm((current) => ({ ...current, fingers: event.target.value }))}
                      placeholder="0, 2, 3, 1, 0, 0"
                      className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm text-gray-300">Barres</span>
                    <input
                      type="text"
                      value={inlineShapeForm.barres}
                      onChange={(event) => setInlineShapeForm((current) => ({ ...current, barres: event.target.value }))}
                      placeholder="1, 1"
                      className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-gray-300">Notas</span>
                    <input
                      type="text"
                      value={inlineShapeForm.notes}
                      onChange={(event) => setInlineShapeForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="A, C, E"
                      className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm text-gray-300">Afinação</span>
                    <input
                      type="text"
                      value={inlineShapeForm.tuning}
                      onChange={(event) => setInlineShapeForm((current) => ({ ...current, tuning: event.target.value }))}
                      className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-gray-300">Qtde. de cordas / notas</span>
                    <input
                      type="number"
                      min="1"
                      value={inlineShapeForm.stringCount}
                      onChange={(event) => setInlineShapeForm((current) => ({ ...current, stringCount: event.target.value }))}
                      className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-xl border border-gray-700 bg-black/20 p-3 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={inlineShapeForm.isLeftHandedSupported}
                      onChange={(event) => setInlineShapeForm((current) => ({ ...current, isLeftHandedSupported: event.target.checked }))}
                    />
                    Suporta canhoto
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-gray-700 bg-black/20 p-3 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={inlineShapeForm.isActive}
                      onChange={(event) => setInlineShapeForm((current) => ({ ...current, isActive: event.target.checked }))}
                    />
                    Shape ativo
                  </label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSaveInlineShape()}
                    disabled={isSavingInlineShape || !selectedChordName}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-3 font-semibold text-black transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {isSavingInlineShape ? 'Salvando...' : inlineShapeForm.id ? 'Atualizar shape' : 'Criar shape'}
                  </button>

                  {selectedChordName ? (
                    <Link
                      to={`/admin/cifras-v2/shapes?instrument=${encodeURIComponent(form.instrument)}&chord=${encodeURIComponent(selectedChordName)}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white hover:bg-gray-700 transition-colors"
                    >
                      Abrir editor completo
                    </Link>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {!isCreateMode ? (
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Uso público</h2>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                <div className="rounded-xl border border-gray-700 bg-black/20 p-4">
                  <p className="text-gray-500">Visualizações</p>
                  <p className="mt-1 text-2xl font-bold text-white">{engagement?.viewsCount?.toLocaleString() ?? 0}</p>
                </div>
                <div className="rounded-xl border border-gray-700 bg-black/20 p-4">
                  <p className="text-gray-500">Favoritos</p>
                  <p className="mt-1 text-2xl font-bold text-white">{engagement?.favoritesCount?.toLocaleString() ?? 0}</p>
                </div>
                <div className="rounded-xl border border-gray-700 bg-black/20 p-4">
                  <p className="text-gray-500">Compartilhamentos</p>
                  <p className="mt-1 text-2xl font-bold text-white">{engagement?.sharesCount?.toLocaleString() ?? 0}</p>
                </div>
                <div className="rounded-xl border border-gray-700 bg-black/20 p-4">
                  <p className="text-gray-500">Impressões</p>
                  <p className="mt-1 text-2xl font-bold text-white">{engagement?.printsCount?.toLocaleString() ?? 0}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                Denúncias totais: <span className="text-white">{engagement?.reportsCount?.toLocaleString() ?? 0}</span>
                {' · '}
                abertas: <span className="text-white">{engagement?.openReportsCount?.toLocaleString() ?? 0}</span>
              </p>
            </div>
          ) : null}

          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Fluxo editorial</h2>
            <ol className="space-y-3 text-sm text-gray-300 list-decimal pl-4">
              <li>Salvar rascunho para manter a estrutura sem publicar.</li>
              <li>Enviar para revisão quando a cifra estiver consistente.</li>
              <li>Publicar quando a versão estiver pronta para consumo público.</li>
            </ol>
          </div>

          {!isCreateMode ? (
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Denúncias recentes</h2>
              {reports.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma denúncia registrada para esta cifra até o momento.</p>
              ) : (
                <div className="space-y-4">
                  {reports.slice(0, 5).map((report) => (
                    <div key={report.id} className="rounded-xl border border-gray-700 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white font-medium">{REPORT_STATUS_LABELS[report.status]}</p>
                          <p className="text-xs uppercase tracking-wide text-gray-500 mt-1">{report.report_type}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(report.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-gray-300 whitespace-pre-wrap">{report.message}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        {report.reporter_email || report.reporter_user_id || 'Sem remetente identificado'}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(['triaged', 'resolved', 'dismissed'] as CifraReportStatus[]).map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={updatingReportId === report.id || report.status === status}
                            onClick={() => void handleUpdateReportStatus(report.id, status)}
                            className="rounded-full border border-gray-700 px-3 py-1.5 text-xs text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white disabled:opacity-50"
                          >
                            {REPORT_STATUS_LABELS[status]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <AlertModal
        isOpen={alert.isOpen}
        onClose={() => setAlert((current) => ({ ...current, isOpen: false }))}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        buttonColor={alert.type === 'error' ? 'red' : alert.type === 'success' ? 'green' : 'blue'}
      />
    </div>
  );
};

export default AdminCifraV2Editor;
