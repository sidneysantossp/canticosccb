/**
 * Cliente API - Supabase
 * Substitui completamente o backend PHP
 */
import { supabase } from './supabase-auth';
import { supabaseFetch } from './supabaseRest';

// ==================== HINOS ====================

export interface Hino {
  id: string;
  numero: number;
  titulo: string;
  compositor_nome?: string;
  compositor_id?: string;
  categoria?: string;
  cover_url?: string;
  audio_url?: string;
  duracao?: string;
  letra?: string;
  status?: string;
  ativo?: boolean;
  views_count?: number;
  plays_count?: number;
  likes_count?: number;
  created_at?: string;
}

export async function getHinos(params?: {
  limit?: number;
  offset?: number;
  categoria?: string;
  compositor_id?: string;
  search?: string;
  order?: string;
}) {
  const filters: Record<string, string> = {
    select: '*',
    ativo: 'eq.true',
    status: 'eq.published',
    order: params?.order || 'created_at.desc',
  };

  if (params?.categoria) {
    filters.categoria = `eq.${params.categoria}`;
  }
  if (params?.compositor_id) {
    filters.compositor_id = `eq.${params.compositor_id}`;
  }
  if (params?.search) {
    filters.titulo = `ilike.%${params.search}%`;
  }
  if (params?.limit) {
    filters.limit = String(params.limit);
  }
  if (params?.offset) {
    filters.offset = String(params.offset);
  }

  return await supabaseFetch<any>('hinos', filters);
}

export async function getHinoById(id: string) {
  const rows = await supabaseFetch<any>('hinos', {
    select: '*',
    id: `eq.${id}`,
    limit: '1',
  });

  if (!rows.length) throw new Error('Hino não encontrado');
  return rows[0];
}

export async function createHino(hino: Partial<Hino>) {
  const { data, error } = await supabase
    .from('hinos')
    .insert(hino)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateHino(id: string, hino: Partial<Hino>) {
  const { data, error } = await supabase
    .from('hinos')
    .update(hino)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteHino(id: string) {
  const { error } = await supabase
    .from('hinos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ==================== COMPOSITORES ====================

export interface Compositor {
  id: string;
  name: string;
  artistic_name?: string;
  bio?: string;
  photo_url?: string;
  verified?: boolean;
  is_approved?: boolean;
  is_trending?: boolean;
  followers_count?: number;
  created_at?: string;
}

export async function getCompositores(params?: {
  limit?: number;
  search?: string;
  verified?: boolean;
}) {
  const filters: Record<string, string> = {
    select: '*',
    order: 'name.asc',
  };

  // A view já contém apenas compositores aprovados e verificados.
  if (params?.search) {
    filters.or = `(name.ilike.%${params.search}%,artistic_name.ilike.%${params.search}%)`;
  }
  if (params?.limit) {
    filters.limit = String(params.limit);
  }

  return await supabaseFetch<any>('composer_public_profiles', filters);
}

export async function getCompositorById(id: string) {
  const rows = await supabaseFetch<any>('composer_public_profiles', {
    select: '*',
    id: `eq.${id}`,
    limit: '1',
  });

  if (!rows.length) throw new Error('Compositor não encontrado');
  return rows[0];
}

export async function getCompositorBySlug(slug: string) {
  const rows = await supabaseFetch<any>('composer_public_profiles', {
    select: '*',
    slug: `eq.${slug}`,
    limit: '1',
  });

  if (!rows.length) throw new Error('Compositor não encontrado');
  return rows[0];
}

// ==================== ALBUMS ====================

export interface Album {
  id: string;
  title: string;
  artist?: string;
  description?: string;
  cover_url?: string;
  release_year?: number;
  total_tracks?: number;
  is_published?: boolean;
  active?: boolean;
  created_at?: string;
}

export async function getAlbums(params?: {
  limit?: number;
  compositor_id?: string;
}) {
  const filters: Record<string, string> = {
    select: '*',
    is_published: 'eq.true',
    order: 'created_at.desc',
  };

  if (params?.compositor_id) {
    filters.composer_id = `eq.${params.compositor_id}`;
  }
  if (params?.limit) {
    filters.limit = String(params.limit);
  }

  const rows = await supabaseFetch<any>('albums', filters);
  return (rows || []).filter((album: any) => album.active !== false);
}

export async function getAlbumById(id: string) {
  const rows = await supabaseFetch<any>('albums', {
    select: '*',
    id: `eq.${id}`,
    limit: '1',
  });

  if (!rows.length) throw new Error('Álbum não encontrado');
  return rows[0];
}

// ==================== CATEGORIAS ====================

export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  imagem_url?: string;
  ativo?: boolean;
}

export async function getCategorias() {
  return await supabaseFetch<any>('categorias', {
    select: '*',
    ativo: 'eq.true',
    order: 'nome.asc',
  });
}

// ==================== BANNERS ====================

export interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  button_text?: string;
  gradient_overlay?: string;
  position?: number;
  is_active?: boolean;
}

export async function getBanners() {
  return await supabaseFetch<any>('banners', {
    select: '*',
    is_active: 'eq.true',
    order: 'position.asc',
  });
}

// ==================== FAVORITOS ====================

export async function getFavoritos(userId: number) {
  const { data, error } = await supabase
    .from('favoritos')
    .select('*, hinos(*)')
    .eq('usuario_id', userId);
  
  if (error) throw error;
  return data || [];
}

export async function addFavorito(userId: number, hinoId: string) {
  const { data, error } = await supabase
    .from('favoritos')
    .insert({ usuario_id: userId, hino_id: hinoId })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function removeFavorito(userId: number, hinoId: string) {
  const { error } = await supabase
    .from('favoritos')
    .delete()
    .eq('usuario_id', userId)
    .eq('hino_id', hinoId);
  
  if (error) throw error;
}

// ==================== PLAYLISTS ====================

export interface Playlist {
  id: string;
  nome: string;
  descricao?: string;
  cover_url?: string;
  usuario_id: number;
  publica?: boolean;
  created_at?: string;
}

export async function getPlaylists(userId: number) {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('usuario_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createPlaylist(playlist: Partial<Playlist>) {
  const { data, error } = await supabase
    .from('playlists')
    .insert(playlist)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== HISTÓRICO ====================

export async function getHistorico(userId: number, limit = 50) {
  const { data, error } = await supabase
    .from('historico')
    .select('*, hinos(*)')
    .eq('usuario_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

export async function addHistorico(userId: number, hinoId: string) {
  const { data, error } = await supabase
    .from('historico')
    .insert({ usuario_id: userId, hino_id: hinoId })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== PLAYS ====================

export async function registerPlay(hinoId: string, userId?: number) {
  // Incrementar contador de plays
  const { error } = await supabase.rpc('increment_plays', { hino_id: hinoId });
  
  if (error) {
    // Fallback: atualizar diretamente
    await supabase
      .from('hinos')
      .update({ plays_count: supabase.rpc('increment', { x: 1 }) })
      .eq('id', hinoId);
  }
  
  // Registrar no histórico se tiver usuário
  if (userId) {
    await addHistorico(userId, hinoId);
  }
}

// ==================== USUÁRIOS ====================

export async function getUsuarioById(id: string | number) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUsuario(id: string | number, dados: Record<string, any>) {
  const { data, error } = await supabase
    .from('users')
    .update(dados)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== SEGUIDORES ====================

export async function followCompositor(userId: string | number, compositorId: string) {
  const { data, error } = await supabase
    .from('user_follows')
    .insert({ user_id: userId, composer_id: compositorId })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function unfollowCompositor(userId: string | number, compositorId: string) {
  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('user_id', userId)
    .eq('composer_id', compositorId);
  
  if (error) throw error;
}

export async function isFollowing(userId: string | number, compositorId: string) {
  const { data } = await supabase
    .from('user_follows')
    .select('id')
    .eq('user_id', userId)
    .eq('composer_id', compositorId)
    .single();
  
  return !!data;
}

// Export default
export default {
  // Hinos
  getHinos,
  getHinoById,
  createHino,
  updateHino,
  deleteHino,
  // Compositores
  getCompositores,
  getCompositorById,
  getCompositorBySlug,
  // Albums
  getAlbums,
  getAlbumById,
  // Categorias
  getCategorias,
  // Banners
  getBanners,
  // Favoritos
  getFavoritos,
  addFavorito,
  removeFavorito,
  // Playlists
  getPlaylists,
  createPlaylist,
  // Histórico
  getHistorico,
  addHistorico,
  // Plays
  registerPlay,
  // Usuários
  getUsuarioById,
  updateUsuario,
  // Seguidores
  followCompositor,
  unfollowCompositor,
  isFollowing,
};
