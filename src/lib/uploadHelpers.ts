import { uploadAvatar, uploadCover } from './uploadHelper';
import { getCurrentUser } from './auth-client';
import { supabaseUpdate, getSupabaseStorageUrl } from './supabaseRest';

/**
 * Upload de avatar do usuário e atualização no banco de dados
 */
export async function uploadUserAvatar(userId: number | string, file: File): Promise<string> {
  try {
    console.log('📸 uploadUserAvatar - Starting upload:', { userId, fileName: file.name });
    
    // 1. Fazer upload do arquivo para o servidor
    const fileName = await uploadAvatar(file);
    console.log('✅ File uploaded:', fileName);
    
    // 2. Construir URL completa do avatar usando Supabase Storage
    const avatarUrl = getSupabaseStorageUrl('avatars', fileName);
    console.log('📸 Avatar URL:', avatarUrl);
    
    // 3. Atualizar avatar_url no banco de dados via Supabase
    console.log('💾 Updating user avatar_url in database...');
    try {
      await supabaseUpdate('users', { id: `eq.${userId}` }, { avatar_url: avatarUrl });
      console.log('✅ Database updated successfully');
    } catch (e) {
      console.warn('⚠️ Database update failed:', e);
    }
    
    // 4. Persistir no localStorage para sobreviver a refresh
    try {
      const current = getCurrentUser ? getCurrentUser() : null;
      if (current && Number(current.id) === Number(userId)) {
        const updated = { ...current, avatar_url: avatarUrl } as any;
        localStorage.setItem('user', JSON.stringify(updated));
        console.log('💾 LocalStorage user atualizado com novo avatar_url');
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
export async function uploadComposerBanner(composerId: number, file: File): Promise<string> {
  try {
    console.log('🖼️ uploadComposerBanner - Starting upload:', { composerId, fileName: file.name });

    // 1. Fazer upload do arquivo (usa covers por ser imagem larga)
    const fileName = await uploadCover(file, 'covers');
    console.log('✅ File uploaded:', fileName);

    // 2. Construir URL completa usando Supabase Storage
    const bannerUrl = getSupabaseStorageUrl('covers', fileName);
    console.log('🖼️ Banner URL:', bannerUrl);

    // 3. Atualizar no banco via Supabase
    console.log('💾 Updating composer banner_url in database...');
    await supabaseUpdate('composers', { id: `eq.${composerId}` }, { banner_url: bannerUrl });
    console.log('✅ Database updated successfully');
    return bannerUrl;
  } catch (error: any) {
    console.error('❌ uploadComposerBanner error:', error);
    throw new Error(error.message || 'Erro ao fazer upload do banner');
  }
}

/**
 * Upload de avatar do compositor
 */
export async function uploadComposerAvatar(composerId: number, file: File): Promise<string> {
  try {
    console.log('📸 uploadComposerAvatar - Starting upload:', { composerId, fileName: file.name });
    
    // 1. Fazer upload do arquivo
    const fileName = await uploadAvatar(file);
    console.log('✅ File uploaded:', fileName);
    
    // 2. Construir URL completa usando Supabase Storage
    const avatarUrl = getSupabaseStorageUrl('avatars', fileName);
    console.log('📸 Avatar URL:', avatarUrl);
    
    // 3. Atualizar no banco via Supabase
    console.log('💾 Updating composer avatar_url in database...');
    await supabaseUpdate('composers', { id: `eq.${composerId}` }, { photo_url: avatarUrl });
    console.log('✅ Database updated successfully');
    return avatarUrl;
  } catch (error: any) {
    console.error('❌ uploadComposerAvatar error:', error);
    throw new Error(error.message || 'Erro ao fazer upload do avatar');
  }
}
