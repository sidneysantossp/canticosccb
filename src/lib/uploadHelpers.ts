import { uploadAvatar, uploadCover } from './uploadHelper';
import { getCurrentUser } from './auth-client';
import { supabaseUpdate } from './supabaseRest';

/**
 * Upload de avatar do usuário e atualização no banco de dados
 */
export async function uploadUserAvatar(userId: number | string, file: File): Promise<string> {
  try {
    // 1. Fazer upload do arquivo (retorna URL pública completa)
    const avatarUrl = await uploadAvatar(file);

    // 2. Atualizar avatar_url no banco de dados via Supabase
    try {
      await supabaseUpdate('users', { id: `eq.${userId}` }, { avatar_url: avatarUrl });
    } catch (e) {
      console.warn('⚠️ Database update failed:', e);
    }
    
    // 3. Persistir no localStorage para sobreviver a refresh
    try {
      const current = getCurrentUser ? getCurrentUser() : null;
      if (current && String(current.id) === String(userId)) {
        const updated = { ...current, avatar_url: avatarUrl } as any;
        localStorage.setItem('user', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('⚠️ Falha ao atualizar localStorage user:', e);
    }
    
    return avatarUrl;
  } catch (error: any) {
    console.error('❌ uploadUserAvatar error:', error);
    throw new Error(error.message || 'Erro ao fazer upload do avatar');
  }
}

/**
 * Upload de banner do compositor
 */
export async function uploadComposerBanner(composerId: string | number, file: File): Promise<string> {
  try {
    // 1. Fazer upload do arquivo (retorna URL pública completa)
    const bannerUrl = await uploadCover(file, 'covers');

    // 3. Atualizar no banco via Supabase
    await supabaseUpdate('composers', { id: `eq.${composerId}` }, { banner_url: bannerUrl });
    return bannerUrl;
  } catch (error: any) {
    console.error('❌ uploadComposerBanner error:', error);
    throw new Error(error.message || 'Erro ao fazer upload do banner');
  }
}

/**
 * Upload de avatar do compositor
 */
export async function uploadComposerAvatar(composerId: string | number, file: File): Promise<string> {
  try {
    // 1. Fazer upload do arquivo (retorna URL pública completa)
    const avatarUrl = await uploadAvatar(file);

    // 3. Atualizar no banco via Supabase (ambos os campos para consistência)
    await supabaseUpdate('composers', { id: `eq.${composerId}` }, { photo_url: avatarUrl, avatar_url: avatarUrl });
    return avatarUrl;
  } catch (error: any) {
    console.error('❌ uploadComposerAvatar error:', error);
    throw new Error(error.message || 'Erro ao fazer upload do avatar');
  }
}
