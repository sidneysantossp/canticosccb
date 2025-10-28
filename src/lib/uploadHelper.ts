/**
 * Upload Helper - VPS MySQL
 * Substitui Supabase Storage
 */
import { getApiUrl } from './api-helper';

export interface UploadResult {
  fileName: string;
  type: string;
  size: number;
  path: string;
}

/**
 * Upload de arquivo para o VPS
 * @param file Arquivo a ser enviado
 * @param type Tipo de arquivo (hinos, albuns, avatars, covers)
 * @returns Nome do arquivo salvo (apenas o nome, não a URL completa)
 */
export async function uploadFile(file: File, type: 'hinos' | 'albuns' | 'avatars' | 'covers'): Promise<string> {
  try {
    console.log(' Iniciando upload VPS:', { fileName: file.name, size: file.size, type });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await fetch(getApiUrl('/upload.php'), {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Falha no upload');
    }
    
    const result: UploadResult = await response.json();
    console.log('✅ Upload concluído:', result);
    
    // Retorna APENAS o nome do arquivo
    return result.fileName;
  } catch (error: any) {
    console.error('❌ Erro no upload:', error);
    throw new Error(error.message || 'Falha ao enviar arquivo');
  }
}

/**
 * Upload de áudio com extração de duração
 */
export async function uploadAudio(file: File): Promise<{ fileName: string; duration: string }> {
  try {
    // Upload do arquivo
    const fileName = await uploadFile(file, 'hinos');
    
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
    
    return { fileName, duration };
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
