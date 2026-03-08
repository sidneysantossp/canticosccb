import { getSiteConfigMap, slugifyAdminText, upsertSiteConfigEntries } from '@/lib/admin/adminTableUtils';

const CONFIG_KEY = 'admin_tags';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTagData {
  name: string;
  slug?: string;
}

const fallbackId = () => `tag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const parseTags = (value?: string): Tag[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((row: any) => ({
        id: String(row?.id || fallbackId()),
        name: String(row?.name || '').trim(),
        slug: String(row?.slug || '').trim(),
        created_at: row?.created_at || new Date().toISOString(),
        updated_at: row?.updated_at || row?.created_at || new Date().toISOString(),
      }))
      .filter((tag) => tag.name && tag.slug);
  } catch {
    return [];
  }
};

const loadTags = async (): Promise<Tag[]> => {
  const config = await getSiteConfigMap([CONFIG_KEY]);
  return parseTags(config[CONFIG_KEY]).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
};

const saveTags = async (tags: Tag[]) => {
  await upsertSiteConfigEntries({
    [CONFIG_KEY]: JSON.stringify(tags),
  });
};

export const generateSlug = (name: string) => slugifyAdminText(name);

export const getAllTags = async (): Promise<Tag[]> => loadTags();

export const getTagById = async (id: string): Promise<Tag | null> => {
  const tags = await loadTags();
  return tags.find((tag) => tag.id === id) || null;
};

export const createTag = async (data: CreateTagData): Promise<{ success: boolean; tag: Tag }> => {
  const tags = await loadTags();
  const now = new Date().toISOString();
  const slug = generateSlug(data.slug || data.name);

  if (!data.name.trim() || !slug) {
    throw new Error('Nome e slug são obrigatórios.');
  }

  if (tags.some((tag) => tag.slug === slug)) {
    throw new Error('Já existe uma tag com este slug.');
  }

  const tag: Tag = {
    id: fallbackId(),
    name: data.name.trim(),
    slug,
    created_at: now,
    updated_at: now,
  };

  await saveTags([...tags, tag]);
  return { success: true, tag };
};

export const updateTag = async (id: string, data: CreateTagData): Promise<{ success: boolean; tag: Tag }> => {
  const tags = await loadTags();
  const slug = generateSlug(data.slug || data.name);

  if (!data.name.trim() || !slug) {
    throw new Error('Nome e slug são obrigatórios.');
  }

  if (tags.some((tag) => tag.id !== id && tag.slug === slug)) {
    throw new Error('Já existe uma tag com este slug.');
  }

  let updatedTag: Tag | null = null;
  const updatedTags = tags.map((tag) => {
    if (tag.id !== id) return tag;

    updatedTag = {
      ...tag,
      name: data.name.trim(),
      slug,
      updated_at: new Date().toISOString(),
    };

    return updatedTag;
  });

  if (!updatedTag) {
    throw new Error('Tag não encontrada.');
  }

  await saveTags(updatedTags);
  return { success: true, tag: updatedTag };
};

export const deleteTag = async (id: string): Promise<{ success: boolean }> => {
  const tags = await loadTags();
  await saveTags(tags.filter((tag) => tag.id !== id));
  return { success: true };
};
