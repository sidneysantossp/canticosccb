import { compositoresApi } from '@/lib/api-client';

export type ActiveComposer = {
  id: string;
  nome: string;
  nome_artistico: string;
  email?: string;
  verificado?: boolean;
  status?: string;
  usuario_id?: string;
};

type ResolveActiveComposerParams = {
  userId?: string | null;
  userEmail?: string | null;
  managingComposerId?: string | number | null;
};

function normalizeComposer(data: any): ActiveComposer | null {
  if (!data?.id) return null;

  return {
    id: String(data.id),
    nome: data.nome || data.name || '',
    nome_artistico: data.nome_artistico || data.artistic_name || data.nome || data.name || '',
    email: data.email || undefined,
    verificado: data.verificado === true || data.verificado === 1 || data.verified === true,
    status: data.status || undefined,
    usuario_id: data.usuario_id || data.user_id ? String(data.usuario_id || data.user_id) : undefined,
  };
}

export async function resolveActiveComposer(params: ResolveActiveComposerParams): Promise<ActiveComposer | null> {
  const { userId, userEmail, managingComposerId } = params;

  if (managingComposerId) {
    const managed = await compositoresApi.get(String(managingComposerId));
    return normalizeComposer(managed.data);
  }

  if (!userId) return null;

  const own = await compositoresApi.getByUsuarioId(String(userId), userEmail || undefined);
  return normalizeComposer(own.data);
}
