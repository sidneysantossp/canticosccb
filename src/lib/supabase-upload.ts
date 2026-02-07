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
    console.log('📤 Iniciando upload Supabase (REST API):', { fileName: file.name, size: file.size, type });
    
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Configuração do Supabase não encontrada');
    }
    
    // Pegar token do localStorage (mais rápido que getSession)
    let accessToken = SUPABASE_ANON_KEY;
    try {
      const authData = localStorage.getItem('sb-rdogsfrplohxnemvtetn-auth-token');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed?.access_token) {
          accessToken = parsed.access_token;
          console.log('✅ Token de autenticação encontrado');
        }
      }
    } catch (e) {
      console.warn('⚠️ Erro ao ler token, usando anon key');
    }
    
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'bin';
    const uniqueName = `${timestamp}_${Math.random().toString(36).substring(7)}.${ext}`;
    
    // Definir bucket e path baseado no tipo
    const bucket = 'images';
    const path = `${type}/${uniqueName}`;
    
    // Upload via REST API com timeout
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
    console.log('🌐 Upload URL:', uploadUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': file.type,
          'x-upsert': 'false',
        },
        body: file,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro no upload (HTTP):', response.status, errorText);
        throw new Error(`Upload falhou: ${response.status} - ${errorText}`);
      }
      
      console.log('✅ Upload HTTP concluído:', response.status);
      
      // Obter URL pública
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
      console.log('✅ URL pública gerada:', publicUrl);
      
      return publicUrl;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout no upload - verifique sua conexão');
      }
      throw fetchError;
    }
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
