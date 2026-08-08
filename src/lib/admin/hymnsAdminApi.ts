/**
 * Hymns Admin API - Connected to MySQL Backend
 */
import { hinosAPI } from '@/lib/mysql';

export interface Hymn {
  id: string;
  number: number;
  title: string;
  category: string;
  composer_name: string;
  cover_url: string;
  audio_url: string;
  duration: string;
  lyrics: string;
  status: 'published' | 'draft' | 'archived';
  allow_download: boolean;
  is_featured: boolean;
  plays_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Map MySQL hino to Hymn interface
 */
function mapHinoToHymn(hino: any): Hymn {
  return {
    id: String(hino.id),
    number: hino.numero || 0,
    title: hino.titulo || '',
    category: hino.categoria || 'Cantados',
    composer_name: hino.compositor || 'Desconhecido',
    cover_url: hino.capa_url || '',
    audio_url: hino.audio_url || '',
    duration: hino.duracao || '0:00',
    lyrics: hino.letra || '',
    status: hino.ativo ? 'published' : 'draft',
    allow_download: true,
    is_featured: hino.destaque || false,
    plays_count: hino.plays || 0,
    likes_count: hino.likes || 0,
    created_at: hino.created_at || new Date().toISOString(),
    updated_at: hino.updated_at || new Date().toISOString()
  };
}

/**
 * Get all hymns from MySQL
 */
export const getAllHymns = async (): Promise<Hymn[]> => {
  try {
    console.log('📡 getAllHymns: Fetching from MySQL API...');
    const response = await hinosAPI.list();
    console.log('✅ getAllHymns: Received', response.hinos.length, 'hinos');
    
    const hymns = response.hinos.map(mapHinoToHymn);
    console.log('✅ getAllHymns: Mapped to', hymns.length, 'hymns');
    
    return hymns;
  } catch (error) {
    console.error('❌ getAllHymns error:', error);
    throw error;
  }
};

/**
 * Get hymn by ID
 */
export const getHymnById = async (id: string): Promise<Hymn | null> => {
  try {
    const hino = await hinosAPI.get(Number(id));
    return mapHinoToHymn(hino);
  } catch (error) {
    console.error('❌ getHymnById error:', error);
    return null;
  }
};

/**
 * Create new hymn
 */
export const createHymn = async (data: Partial<Hymn>): Promise<{ success: boolean; hymn?: Hymn }> => {
  try {
    const hinoData = {
      numero: data.number || 0,
      titulo: data.title || '',
      categoria: data.category || 'Cantados',
      compositor: data.composer_name || 'Desconhecido',
      capa_url: data.cover_url || '',
      audio_url: data.audio_url || '',
      duracao: data.duration || '0:00',
      letra: data.lyrics || '',
      ativo: data.status === 'published',
      destaque: data.is_featured || false
    };
    
    const hino = await hinosAPI.create(hinoData);
    return { success: true, hymn: mapHinoToHymn(hino) };
  } catch (error) {
    console.error('❌ createHymn error:', error);
    return { success: false };
  }
};

/**
 * Update hymn
 */
export const updateHymn = async (id: string, data: Partial<Hymn>): Promise<{ success: boolean }> => {
  try {
    const hinoData: any = {};
    
    if (data.number !== undefined) hinoData.numero = data.number;
    if (data.title !== undefined) hinoData.titulo = data.title;
    if (data.category !== undefined) hinoData.categoria = data.category;
    if (data.composer_name !== undefined) hinoData.compositor = data.composer_name;
    if (data.cover_url !== undefined) hinoData.capa_url = data.cover_url;
    if (data.audio_url !== undefined) hinoData.audio_url = data.audio_url;
    if (data.duration !== undefined) hinoData.duracao = data.duration;
    if (data.lyrics !== undefined) hinoData.letra = data.lyrics;
    if (data.status !== undefined) hinoData.ativo = data.status === 'published';
    if (data.is_featured !== undefined) hinoData.destaque = data.is_featured;
    
    await hinosAPI.update(Number(id), hinoData);
    return { success: true };
  } catch (error) {
    console.error('❌ updateHymn error:', error);
    return { success: false };
  }
};

/**
 * Delete hymn
 */
export const deleteHymn = async (id: string): Promise<{ success: boolean }> => {
  try {
    await hinosAPI.delete(Number(id));
    return { success: true };
  } catch (error) {
    console.error('❌ deleteHymn error:', error);
    return { success: false };
  }
};

/**
 * Bulk update hymns
 */
export const bulkUpdateHymns = async (ids: string[], data: Partial<Hymn>): Promise<{ success: boolean }> => {
  try {
    // Update each hymn individually
    await Promise.all(ids.map(id => updateHymn(id, data)));
    return { success: true };
  } catch (error) {
    console.error('❌ bulkUpdateHymns error:', error);
    return { success: false };
  }
};

/**
 * Toggle hymn featured status
 */
export const toggleHymnFeatured = async (id: string, featured: boolean): Promise<{ success: boolean }> => {
  return updateHymn(id, { is_featured: featured });
};
export const getSiteSettings = async (..._args: any[]) => ({});
export const updateSiteSettings = async (..._args: any[]) => ({ success: true });
export const getComments = async (..._args: any[]) => [];
export const deleteComment = async (..._args: any[]) => ({ success: true });
export const approveComment = async (..._args: any[]) => ({ success: true });
export const getClaims = async (..._args: any[]) => [];
export const getCopyrightClaims = async (..._args: any[]) => [];
export const updateClaim = async (..._args: any[]) => ({ success: true });
export const getRoyalties = async (..._args: any[]) => [];
export const processPayment = async (..._args: any[]) => ({ success: true });
export const getAllPlaylists = async (..._args: any[]) => [];
export const createPlaylist = async (..._args: any[]) => ({ success: true });
export const updatePlaylist = async (..._args: any[]) => ({ success: true });
export const deletePlaylist = async (..._args: any[]) => ({ success: true });
export type SiteSettings = any;
export type Comment = any;
export type Claim = any;
export type CopyrightClaim = any;
export type Royalty = any;
export type Playlist = any;
