/**
 * Upload Helper - Supabase Storage
 * Substitui upload PHP da VPS
 */
import { supabase } from './supabase-auth';

export interface UploadResult {
  fileName: string;
  type: string;
  size: number;
  path: string;
  url: string;
}

/**
 * Upload de arquivo para Supabase Storage
 */
export async function uploadFile(
  file: File, 
  type: 'hinos' | 'albuns' | 'avatars' | 'covers' | 'banners'
): Promise<string> {
  try {
    console.log('📤 Iniciando upload Supabase:', { fileName: file.name, size: file.size, type });
    
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'bin';
    const uniqueName = `${timestamp}_${Math.random().toString(36).substring(7)}.${ext}`;
    
    // Definir bucket e path baseado no tipo
    const bucket = 'images';
    const path = `${type}/${uniqueName}`;
    
    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Erro no upload Supabase:', error);
      throw new Error(error.message || 'Falha no upload');
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    console.log('✅ Upload concluído:', urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('❌ Erro no upload:', error);
    throw new Error(error.message || 'Falha ao enviar arquivo');
  }
}

/**
 * Upload de áudio com extração de duração
 */
export async function uploadAudio(file: File): Promise<{ url: string; duration: string }> {
  try {
    // Upload do arquivo
    const url = await uploadFile(file, 'hinos');
    
    // Extrair duração
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;
    
    await new Promise<void>((resolve, reject) => {
      audio.onloadedmetadata = () => resolve();
      audio.onerror = () => reject(new Error('Não foi possível ler a duração'));
    });
    
    const secs = Math.round(audio.duration || 0);
    URL.revokeObjectURL(objectUrl);
    
    const mm = Math.floor(secs / 60).toString().padStart(2, '0');
    const ss = Math.floor(secs % 60).toString().padStart(2, '0');
    const duration = `${mm}:${ss}`;
    
    return { url, duration };
  } catch (error: any) {
    console.error('❌ Erro no upload de áudio:', error);
    throw error;
  }
}

/**
 * Upload de imagem/capa
 */
export async function uploadCover(file: File, type: 'albuns' | 'covers' = 'covers'): Promise<string> {
  return uploadFile(file, type);
}

/**
 * Upload de avatar
 */
export async function uploadAvatar(file: File): Promise<string> {
  return uploadFile(file, 'avatars');
}

/**
 * Upload de banner
 */
export async function uploadBanner(file: File): Promise<string> {
  return uploadFile(file, 'banners');
}

/**
 * Deletar arquivo do Supabase Storage
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('images')
      .remove([path]);
    
    if (error) throw error;
  } catch (error) {
    console.error('❌ Erro ao deletar arquivo:', error);
    throw error;
  }
}

export default {
  uploadFile,
  uploadAudio,
  uploadCover,
  uploadAvatar,
  uploadBanner,
  deleteFile,
};
