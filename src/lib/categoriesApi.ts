import { apiFetch, getApiUrl } from '@/lib/api-helper';

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  background_color?: string;
  description?: string;
  image_url?: string;
  ativo?: number;
};

function mapCategory(raw: any): CategoryRecord {
  return {
    id: String(raw.id),
    name: String(raw.nome ?? raw.name ?? ''),
    slug: String(raw.slug ?? ''),
    background_color: String(raw.background_color ?? raw.cor ?? '#6366f1'),
    description: raw.descricao ?? raw.description ?? undefined,
    image_url: raw.imagem_url ?? raw.image_url ?? undefined,
    ativo: raw.ativo != null ? Number(raw.ativo) : undefined,
  };
}

export const getAll = async (params?: { search?: string; page?: number; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  const res = await apiFetch(`/api/categorias/index.php?${query.toString()}`);
  if (!res.ok) return [] as CategoryRecord[];
  const json = await res.json().catch(() => ({}));
  const list = Array.isArray(json)
    ? json
    : Array.isArray(json?.categorias)
      ? json.categorias
      : Array.isArray(json?.data)
        ? json.data
        : [];
  return (list as any[]).map(mapCategory);
};

export const fetchActiveCategories = async () => {
  const all = await getAll({ limit: 100 });
  return all.filter((c) => c.ativo === 1 || c.ativo === undefined);
};

export const getById = async (id: number | string) => {
  const res = await apiFetch(`/api/categorias/${encodeURIComponent(String(id))}`);
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json ? mapCategory(json) : null;
};

export const create = async (data: Partial<CategoryRecord>) => {
  const payload = {
    nome: data.name ?? (data as any).nome,
    slug: data.slug,
    descricao: data.description ?? (data as any).descricao,
    imagem_url: data.image_url ?? (data as any).imagem_url,
    ativo: data.ativo ?? 1,
  } as any;
  const res = await fetch(getApiUrl('/api/categorias/index.php'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { success: false, error: await res.text().catch(() => 'Erro ao criar') } as any;
  const json = await res.json().catch(() => ({}));
  return { success: true, data: mapCategory(json) } as any;
};

export const update = async (id: number | string, data: Partial<CategoryRecord>) => {
  const payload = {
    nome: data.name ?? (data as any).nome,
    slug: data.slug,
    descricao: data.description ?? (data as any).descricao,
    imagem_url: data.image_url ?? (data as any).imagem_url,
    ativo: data.ativo,
  } as any;
  const res = await fetch(getApiUrl(`/api/categorias/${encodeURIComponent(String(id))}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { success: false, error: await res.text().catch(() => 'Erro ao atualizar') } as any;
  const json = await res.json().catch(() => ({}));
  return { success: true, data: mapCategory(json) } as any;
};

export const deleteItem = async (id: number | string) => {
  const res = await fetch(getApiUrl(`/api/categorias/${encodeURIComponent(String(id))}`), {
    method: 'DELETE',
  });
  if (!res.ok) return { success: false, error: await res.text().catch(() => 'Erro ao deletar') } as any;
  const json = await res.json().catch(() => ({}));
  return { success: true, data: json } as any;
};
