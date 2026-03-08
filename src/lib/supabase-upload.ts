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
  type: 'hinos' | 'albuns' | 'avatars' | 'covers' | 'banners' | 'imports' | 'exports'
): Promise<string> {
  try {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    console.log(`📤 Iniciando upload Supabase (REST API): ${file.name} (${sizeMB} MB) tipo: ${type}`);

    // Limites de tamanho por tipo
    const maxSizes: Record<string, number> = {
      avatars: 5,   // 5 MB
      covers: 10,   // 10 MB
      banners: 10,  // 10 MB
      albuns: 10,   // 10 MB
      imports: 25,  // 25 MB
      exports: 25,  // 25 MB
      hinos: 500,   // 500 MB (áudio)
    };
    const maxMB = maxSizes[type] || 50;
    if (file.size > maxMB * 1024 * 1024) {
      throw new Error(`Arquivo muito grande (${sizeMB} MB). Máximo permitido: ${maxMB} MB`);
    }

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Configuração do Supabase não encontrada');
    }
    
    // Pegar token via getSession com timeout de 3s
    let accessToken = SUPABASE_ANON_KEY;
    try {
      console.log('🔑 Obtendo sessão...');
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
      const result = await Promise.race([sessionPromise, timeoutPromise]);
      if (result && (result as any)?.data?.session?.access_token) {
        accessToken = (result as any).data.session.access_token;
        console.log('✅ Token de autenticação encontrado');
      } else {
        console.warn('⚠️ Sem sessão ativa ou timeout, usando anon key');
      }
    } catch (e) {
      console.warn('⚠️ Erro ao obter sessão, usando anon key');
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
    
    const doUpload = async (token: string): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      try {
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': file.type,
            'x-upsert': 'true',
          },
          body: file,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    try {
      console.log('📤 Enviando arquivo...');
      let response = await doUpload(accessToken);
      
      // Se falhar com token do usuário, tentar com anon key
      if (!response.ok && accessToken !== SUPABASE_ANON_KEY) {
        console.warn(`⚠️ Upload falhou com user token (${response.status}), tentando com anon key...`);
        response = await doUpload(SUPABASE_ANON_KEY);
      }
      
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
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout no upload (30s) - verifique sua conexão');
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
