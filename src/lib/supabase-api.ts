/**
 * Cliente API - Supabase
 * Substitui completamente o backend PHP
 */
import { supabase } from './supabase-auth';

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
  let query = supabase
    .from('hinos')
    .select('*')
    .eq('ativo', true)
    .eq('status', 'published');

  if (params?.categoria) {
    query = query.eq('categoria', params.categoria);
  }
  if (params?.compositor_id) {
    query = query.eq('compositor_id', params.compositor_id);
  }
  if (params?.search) {
    query = query.ilike('titulo', `%${params.search}%`);
  }
  if (params?.order) {
    const [col, dir] = params.order.split('.');
    query = query.order(col, { ascending: dir === 'asc' });
  } else {
    query = query.order('created_at', { ascending: false });
  }
  if (params?.limit) {
    query = query.limit(params.limit);
  }
  if (params?.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getHinoById(id: string) {
  const { data, error } = await supabase
    .from('hinos')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
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
  let query = supabase
    .from('compositores')
    .select('*')
    .eq('is_approved', true);

  if (params?.verified) {
    query = query.eq('verified', true);
  }
  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,artistic_name.ilike.%${params.search}%`);
  }
  if (params?.limit) {
    query = query.limit(params.limit);
  }

  query = query.order('name', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCompositorById(id: string) {
  const { data, error } = await supabase
    .from('compositores')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getCompositorBySlug(slug: string) {
  const { data, error } = await supabase
    .from('compositores')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) throw error;
  return data;
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
  let query = supabase
    .from('albums')
    .select('*')
    .eq('is_published', true)
    .eq('active', true);

  if (params?.compositor_id) {
    query = query.eq('composer_id', params.compositor_id);
  }
  if (params?.limit) {
    query = query.limit(params.limit);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getAlbumById(id: string) {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
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
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('ativo', true)
    .order('nome', { ascending: true });
  
  if (error) throw error;
  return data || [];
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
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true });
  
  if (error) throw error;
  return data || [];
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

export async function getUsuarioById(id: number) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUsuario(id: number, dados: Record<string, any>) {
  const { data, error } = await supabase
    .from('usuarios')
    .update(dados)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== SEGUIDORES ====================

export async function followCompositor(userId: number, compositorId: string) {
  const { data, error } = await supabase
    .from('seguidores')
    .insert({ usuario_id: userId, compositor_id: compositorId })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function unfollowCompositor(userId: number, compositorId: string) {
  const { error } = await supabase
    .from('seguidores')
    .delete()
    .eq('usuario_id', userId)
    .eq('compositor_id', compositorId);
  
  if (error) throw error;
}

export async function isFollowing(userId: number, compositorId: string) {
  const { data } = await supabase
    .from('seguidores')
    .select('id')
    .eq('usuario_id', userId)
    .eq('compositor_id', compositorId)
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
