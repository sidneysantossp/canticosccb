import { supabase } from '@/lib/supabase-auth';

export type ContributionStatus = 'pending' | 'in_review' | 'changes_requested' | 'approved' | 'published' | 'rejected';

export interface CifraContribution {
  id: string;
  song_id: string;
  base_version_id: string | null;
  contributor_id: string;
  contribution_type: 'correction' | 'new_version';
  title: string;
  instrument: string;
  original_key: string;
  status: ContributionStatus;
  reviewer_notes: string | null;
  published_version_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  published_at: string | null;
  contributor?: { name: string; avatar_url: string | null } | null;
  song?: { title: string; canonical_slug: string } | null;
}

export async function submitCifraContribution(input: Record<string, unknown>) {
  const { data, error } = await supabase.rpc('submit_cifra_contribution', {
    p_song_id: input.songId,
    p_base_version_id: input.baseVersionId ?? null,
    p_contribution_type: input.contributionType ?? 'new_version',
    p_title: input.title ?? '',
    p_instrument: input.instrument ?? 'violao',
    p_arrangement_type: input.arrangementType ?? 'completa',
    p_difficulty_level: input.difficultyLevel ?? 'intermediario',
    p_tuning: input.tuning ?? 'standard',
    p_capo: input.capo ?? 0,
    p_original_key: input.originalKey ?? 'C',
    p_preferred_key: input.preferredKey ?? null,
    p_tempo_bpm: input.tempoBpm ?? null,
    p_time_signature: input.timeSignature ?? null,
    p_body_text: input.bodyText ?? '',
    p_body_ast: input.bodyAst ?? { sections: [] },
    p_chords_index: input.chordsIndex ?? [],
    p_notes: input.notes ?? null,
  });
  if (error) throw error;
  return data as { ok: boolean; code?: string; id?: string; duplicate_id?: string; status?: ContributionStatus };
}

export async function listMyCifraContributions() {
  const { data, error } = await supabase
    .from('cifra_contributions')
    .select('id, song_id, base_version_id, contributor_id, contribution_type, title, instrument, original_key, status, reviewer_notes, published_version_id, created_at, reviewed_at, published_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CifraContribution[];
}

export async function listCifraContributionsForReview() {
  const { data, error } = await supabase
    .from('cifra_contributions')
    .select('id, song_id, base_version_id, contributor_id, contribution_type, title, instrument, original_key, status, reviewer_notes, published_version_id, created_at, reviewed_at, published_at')
    .in('status', ['pending', 'in_review', 'changes_requested'])
    .order('created_at', { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  const userIds = [...new Set(rows.map(row => row.contributor_id).filter(Boolean))];
  const songIds = [...new Set(rows.map(row => row.song_id).filter(Boolean))];
  const [{ data: users }, { data: songs }] = await Promise.all([
    userIds.length ? supabase.from('users').select('id, name, avatar_url').in('id', userIds) : Promise.resolve({ data: [] }),
    songIds.length ? supabase.from('cifra_songs').select('id, title, canonical_slug').in('id', songIds) : Promise.resolve({ data: [] }),
  ]);
  const usersById = new Map((users ?? []).map(user => [user.id, user]));
  const songsById = new Map((songs ?? []).map(song => [song.id, song]));
  return rows.map(row => ({
    ...row,
    contributor: usersById.get(row.contributor_id) ?? null,
    song: songsById.get(row.song_id) ?? null,
  })) as unknown as CifraContribution[];
}

export async function moderateCifraContribution(id: string, decision: 'approved' | 'rejected' | 'changes_requested', notes?: string) {
  const { data, error } = await supabase.rpc('moderate_cifra_contribution', {
    p_contribution_id: id,
    p_decision: decision,
    p_reviewer_notes: notes ?? null,
  });
  if (error) throw error;
  return data;
}
