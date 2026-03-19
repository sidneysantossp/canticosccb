import { supabaseDelete, supabaseFetch, supabaseInsert, supabaseUpdate } from '@/lib/supabaseRest';
import type { CifraLineNode, CifraSectionKey, CifraVersionSection } from '@/types/cifras-v2';

import { mapCifraVersionSectionRow, normalizeLineNodes } from './mappers';

export interface CreateCifraVersionSectionInput {
  versionId: string;
  sectionOrder: number;
  sectionKey: CifraSectionKey;
  sectionLabel: string;
  cueStartSeconds?: number | null;
  cueEndSeconds?: number | null;
  loopStartSeconds?: number | null;
  loopEndSeconds?: number | null;
  contentAst: CifraLineNode[];
  plainText?: string;
  chordsIndex?: string[];
}

export type UpdateCifraVersionSectionInput = Partial<CreateCifraVersionSectionInput>;

function buildSectionPayload(data: CreateCifraVersionSectionInput | UpdateCifraVersionSectionInput) {
  const payload: Record<string, unknown> = {};

  if (data.versionId !== undefined) payload.version_id = data.versionId;
  if (data.sectionOrder !== undefined) payload.section_order = data.sectionOrder;
  if (data.sectionKey !== undefined) payload.section_key = data.sectionKey;
  if (data.sectionLabel !== undefined) payload.section_label = data.sectionLabel?.trim();
  if (data.cueStartSeconds !== undefined) payload.cue_start_seconds = data.cueStartSeconds;
  if (data.cueEndSeconds !== undefined) payload.cue_end_seconds = data.cueEndSeconds;
  if (data.loopStartSeconds !== undefined) payload.loop_start_seconds = data.loopStartSeconds;
  if (data.loopEndSeconds !== undefined) payload.loop_end_seconds = data.loopEndSeconds;
  if (data.contentAst !== undefined) payload.content_ast = normalizeLineNodes(data.contentAst);
  if (data.plainText !== undefined) payload.plain_text = data.plainText;
  if (data.chordsIndex !== undefined) payload.chords_index = data.chordsIndex;

  return payload;
}

export async function fetchCifraVersionSections(versionId: string): Promise<CifraVersionSection[]> {
  const rows = await supabaseFetch<any>('cifra_version_sections', {
    version_id: `eq.${versionId}`,
    select: '*',
    order: 'section_order.asc',
  });

  return rows.map(mapCifraVersionSectionRow);
}

export async function createCifraVersionSection(data: CreateCifraVersionSectionInput): Promise<CifraVersionSection | null> {
  const row = await supabaseInsert<any>('cifra_version_sections', buildSectionPayload(data));
  return row ? mapCifraVersionSectionRow(row) : null;
}

export async function updateCifraVersionSection(id: string, data: UpdateCifraVersionSectionInput): Promise<CifraVersionSection | null> {
  const rows = await supabaseUpdate<any>('cifra_version_sections', { id: `eq.${id}` }, buildSectionPayload(data));
  return rows[0] ? mapCifraVersionSectionRow(rows[0]) : null;
}

export async function replaceCifraVersionSections(
  versionId: string,
  sections: CreateCifraVersionSectionInput[],
): Promise<CifraVersionSection[]> {
  await supabaseDelete('cifra_version_sections', { version_id: `eq.${versionId}` });

  const inserted: CifraVersionSection[] = [];

  for (const section of sections) {
    const row = await createCifraVersionSection(section);
    if (row) {
      inserted.push(row);
    }
  }

  return inserted.sort((left, right) => left.section_order - right.section_order);
}
