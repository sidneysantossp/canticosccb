import { extractChords } from '@/utils/chordUtils';
import type {
  CifraLineNode,
  CifraPublicationLabel,
  CifraReviewStatus,
  CifraSectionKey,
  CifraSectionNode,
  CifraVersion,
  CifraVersionStatus,
} from '@/types/cifras-v2';

import {
  replaceCifraVersionSections,
  type CreateCifraVersionSectionInput,
} from './cifraSectionsRepository';
import { fetchCifraVersionById, updateCifraVersion, type UpdateCifraVersionInput } from './cifraVersionsRepository';
import { normalizeSectionNode } from './mappers';
import { supabaseFetch, supabaseInsert, supabaseUpdate } from '@/lib/supabaseRest';

export interface CifraVersionSectionDraft {
  key?: CifraSectionKey;
  label: string;
  order?: number;
  cueStartSeconds?: number | null;
  cueEndSeconds?: number | null;
  loopStartSeconds?: number | null;
  loopEndSeconds?: number | null;
  lines: CifraLineNode[];
}

export interface PersistCifraVersionInput {
  versionId: string;
  sections: CifraVersionSectionDraft[];
  versionPatch?: Partial<UpdateCifraVersionInput>;
  status?: CifraVersionStatus;
  publicationLabel?: CifraPublicationLabel;
  reviewStatus?: CifraReviewStatus;
  reviewNotes?: string | null;
  changeSummary?: string | null;
  actorId?: string | null;
  markAsPrimary?: boolean;
  publishedAt?: string | null;
}

export interface CifraPublicationSnapshot {
  sections: CifraSectionNode[];
  sectionRows: CreateCifraVersionSectionInput[];
  bodyText: string;
  bodyAst: { sections: CifraSectionNode[] };
  chordsIndex: string[];
  sectionsCount: number;
  linesCount: number;
}

function normalizeDraftSections(sections: CifraVersionSectionDraft[]): CifraSectionNode[] {
  return sections
    .map((section, index) =>
      normalizeSectionNode(
        {
          key: section.key ?? 'custom',
          label: section.label,
          order: section.order ?? index + 1,
          cueStartSeconds: section.cueStartSeconds ?? null,
          cueEndSeconds: section.cueEndSeconds ?? null,
          loopStartSeconds: section.loopStartSeconds ?? null,
          loopEndSeconds: section.loopEndSeconds ?? null,
          lines: section.lines,
        },
        index + 1,
      ),
    )
    .sort((left, right) => left.order - right.order)
    .map((section, index) => ({ ...section, order: index + 1 }));
}

function stringifyLine(line: CifraLineNode): string {
  if (line.text?.trim()) {
    return line.text.trim();
  }

  if (!line.segments?.length) {
    return '';
  }

  return line.segments
    .map((segment) => {
      const parts = [segment.chord?.trim(), segment.lyric?.trim()].filter(Boolean);
      return parts.join(' ');
    })
    .join(' ')
    .trim();
}

function extractLineChords(line: CifraLineNode): string[] {
  const directChords = line.segments
    ?.map((segment) => segment.chord?.trim() || '')
    .filter((item): item is string => item.length > 0) ?? [];

  const fromText = line.text ? extractChords(line.text) : [];
  return [...new Set([...directChords, ...fromText])];
}

export function buildCifraPublicationSnapshot(sections: CifraVersionSectionDraft[]): CifraPublicationSnapshot {
  const normalizedSections = normalizeDraftSections(sections);
  const allChords = new Set<string>();
  let linesCount = 0;

  const sectionRows = normalizedSections.map((section, index) => {
    const plainLines = section.lines
      .map((line) => {
        const lineText = stringifyLine(line);
        extractLineChords(line).forEach((chord) => allChords.add(chord));
        if (lineText) {
          linesCount += 1;
        }
        return lineText;
      })
      .filter(Boolean);

    return {
      versionId: '',
      sectionOrder: index + 1,
      sectionKey: section.key,
      sectionLabel: section.label,
      cueStartSeconds: section.cueStartSeconds ?? null,
      cueEndSeconds: section.cueEndSeconds ?? null,
      loopStartSeconds: section.loopStartSeconds ?? null,
      loopEndSeconds: section.loopEndSeconds ?? null,
      contentAst: section.lines,
      plainText: plainLines.join('\n'),
      chordsIndex: Array.from(new Set(section.lines.flatMap((line) => extractLineChords(line)))).sort(),
    };
  });

  const bodyText = normalizedSections
    .map((section) => {
      const sectionLines = section.lines.map(stringifyLine).filter(Boolean);
      return [`[${section.label}]`, ...sectionLines].join('\n');
    })
    .join('\n\n')
    .trim();

  return {
    sections: normalizedSections,
    sectionRows,
    bodyText,
    bodyAst: { sections: normalizedSections },
    chordsIndex: Array.from(allChords).sort(),
    sectionsCount: normalizedSections.length,
    linesCount,
  };
}

async function appendRevisionHistory(
  versionId: string,
  snapshot: Record<string, unknown>,
  changeSummary?: string | null,
  actorId?: string | null,
) {
  const rows = await supabaseFetch<any>('cifra_revision_history', {
    version_id: `eq.${versionId}`,
    select: 'revision_number',
    order: 'revision_number.desc',
    limit: '1',
  });

  const nextRevision = rows[0]?.revision_number ? Number(rows[0].revision_number) + 1 : 1;

  await supabaseInsert('cifra_revision_history', {
    version_id: versionId,
    revision_number: nextRevision,
    change_summary: changeSummary?.trim() || null,
    snapshot,
    created_by: actorId ?? null,
  });
}

async function upsertReviewQueue(
  versionId: string,
  status: CifraReviewStatus,
  actorId?: string | null,
  reviewNotes?: string | null,
) {
  const currentRows = await supabaseFetch<any>('cifra_review_queue', {
    version_id: `eq.${versionId}`,
    select: '*',
    order: 'created_at.desc',
    limit: '1',
  });

  const payload = {
    version_id: versionId,
    status,
    reviewer_id: actorId ?? null,
    review_notes: reviewNotes?.trim() || null,
  };

  if (currentRows[0]?.id) {
    await supabaseUpdate('cifra_review_queue', { id: `eq.${currentRows[0].id}` }, payload);
    return;
  }

  await supabaseInsert('cifra_review_queue', payload);
}

async function demoteSiblingPrimaryVersions(version: CifraVersion) {
  await supabaseUpdate(
    'cifra_versions',
    {
      song_id: `eq.${version.song_id}`,
      instrument: `eq.${version.instrument}`,
      is_primary: 'eq.true',
    },
    { is_primary: false },
  );
}

async function persistVersionContent(input: PersistCifraVersionInput): Promise<CifraVersion | null> {
  const version = await fetchCifraVersionById(input.versionId);
  if (!version) {
    throw new Error(`Cifra version ${input.versionId} nao encontrada`);
  }

  const publication = buildCifraPublicationSnapshot(input.sections);
  const now = input.publishedAt ?? new Date().toISOString();

  if (input.markAsPrimary) {
    await demoteSiblingPrimaryVersions(version);
  }

  const versionPatch: UpdateCifraVersionInput = {
    ...input.versionPatch,
    songId: version.song_id,
    title: input.versionPatch?.title ?? version.title,
    instrument: input.versionPatch?.instrument ?? version.instrument,
    arrangementType: input.versionPatch?.arrangementType ?? version.arrangement_type,
    difficultyLevel: input.versionPatch?.difficultyLevel ?? version.difficulty_level,
    tuning: input.versionPatch?.tuning ?? version.tuning,
    capo: input.versionPatch?.capo ?? version.capo,
    originalKey: input.versionPatch?.originalKey ?? version.original_key,
    preferredKey: input.versionPatch?.preferredKey ?? version.preferred_key,
    tempoBpm: input.versionPatch?.tempoBpm ?? version.tempo_bpm,
    timeSignature: input.versionPatch?.timeSignature ?? version.time_signature,
    introNotes: input.versionPatch?.introNotes ?? version.intro_notes,
    bodyText: publication.bodyText,
    bodyAst: publication.bodyAst,
    chordsIndex: publication.chordsIndex,
    sectionsCount: publication.sectionsCount,
    linesCount: publication.linesCount,
    status: input.status ?? version.status,
    publicationLabel: input.publicationLabel ?? version.publication_label,
    isPrimary: input.markAsPrimary ?? version.is_primary,
    isActive: input.versionPatch?.isActive ?? version.is_active,
    isSearchable: input.versionPatch?.isSearchable ?? version.is_searchable,
    publishedAt: (input.status ?? version.status) === 'published' ? now : input.versionPatch?.publishedAt ?? version.published_at,
    updatedBy: input.actorId ?? version.updated_by,
    publicSlug: input.versionPatch?.publicSlug ?? version.public_slug,
  };

  const updatedVersion = await updateCifraVersion(version.id, versionPatch);
  if (!updatedVersion) {
    throw new Error(`Nao foi possivel atualizar a cifra ${version.id}`);
  }

  await replaceCifraVersionSections(
    version.id,
    publication.sectionRows.map((section) => ({
      ...section,
      versionId: version.id,
    })),
  );

  await appendRevisionHistory(
    version.id,
    {
      version: updatedVersion,
      sections: publication.sections,
    },
    input.changeSummary,
    input.actorId,
  );

  if (input.reviewStatus) {
    await upsertReviewQueue(version.id, input.reviewStatus, input.actorId, input.reviewNotes);
  }

  return updatedVersion;
}

export async function saveCifraVersionDraft(input: PersistCifraVersionInput): Promise<CifraVersion | null> {
  return persistVersionContent({
    ...input,
    status: input.status ?? 'draft',
  });
}

export async function submitCifraVersionForReview(input: PersistCifraVersionInput): Promise<CifraVersion | null> {
  return persistVersionContent({
    ...input,
    status: 'in_review',
    reviewStatus: input.reviewStatus ?? 'pending',
  });
}

export async function publishCifraVersion(input: PersistCifraVersionInput): Promise<CifraVersion | null> {
  return persistVersionContent({
    ...input,
    status: 'published',
    reviewStatus: input.reviewStatus ?? 'approved',
    publishedAt: input.publishedAt ?? new Date().toISOString(),
  });
}
