/**
 * Upload Helper
 */
import { supabase } from './supabase-auth';
import { normalizeMediaUploadType, resolveMediaUploadFolder, type MediaUploadType } from './mediaUpload';

export interface UploadResult {
  fileName: string;
  type: string;
  size: number;
  path: string;
  url: string;
}

export interface SignedR2UploadPayload {
  signedUrl: string;
  publicUrl: string;
  method?: string;
  fileName?: string;
  key?: string;
  folder?: string;
}

interface ArchiveToR2UploadInput {
  archiveUrl: string;
  fileName: string;
  contentType?: string;
  type: MediaUploadType;
}

interface SignedR2BatchUploadInput {
  file: File;
  type: MediaUploadType;
  expiresIn?: number;
}

function sanitizeBearerToken(value: string): string {
  return String(value || '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/[^A-Za-z0-9._-]/g, '');
}

export async function extractAudioDuration(file: File, timeoutMs: number = 10000): Promise<string> {
  const audio = document.createElement('audio');
  const objectUrl = URL.createObjectURL(file);
  audio.preload = 'metadata';
  audio.src = objectUrl;

  return new Promise<string>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeoutId);
      audio.onloadedmetadata = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      URL.revokeObjectURL(objectUrl);
    };

    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout ao ler a duração do áudio (${Math.round(timeoutMs / 1000)}s)`));
    }, timeoutMs);

    audio.onloadedmetadata = () => {
      const secs = Math.round(audio.duration || 0);
      cleanup();

      const mm = Math.floor(secs / 60).toString().padStart(2, '0');
      const ss = Math.floor(secs % 60).toString().padStart(2, '0');
      resolve(`${mm}:${ss}`);
    };

    audio.onerror = () => {
      cleanup();
      reject(new Error('Não foi possível ler a duração'));
    };
  });
}

/**
 * Upload de arquivo para Supabase Storage
 */
async function getAccessToken(timeoutMs: number = 10000): Promise<string> {
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_ANON_KEY) {
    throw new Error('Configuração do Supabase não encontrada');
  }

  const readStoredToken = (): string => {
    if (typeof localStorage === 'undefined') return '';

    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;

        const raw = localStorage.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);
        const token = sanitizeBearerToken(parsed?.access_token || parsed?.currentSession?.access_token || '');
        if (token) return String(token);
      }
    } catch {
      return '';
    }

    return '';
  };

  const isExpired = (token: string): boolean => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1]));
      if (!payload?.exp) return false;
      return (payload.exp * 1000) < (Date.now() + 30000);
    } catch {
      return false;
    }
  };

  const withTimeout = async <T,>(promise: Promise<T>, fallback: T): Promise<T> => {
    const timeoutPromise = new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  };

  let accessToken = sanitizeBearerToken(readStoredToken());

  if (accessToken && accessToken !== SUPABASE_ANON_KEY && !isExpired(accessToken)) {
    return accessToken;
  }

  if (accessToken && accessToken !== SUPABASE_ANON_KEY && isExpired(accessToken)) {
    try {
      const refreshResult = await withTimeout(
        supabase.auth.refreshSession(),
        { data: { session: null }, error: new Error('refresh-timeout') } as any
      );
      const refreshedToken = sanitizeBearerToken(refreshResult?.data?.session?.access_token || '');
      if (refreshedToken) {
        return refreshedToken;
      }
    } catch {
      // Fallback para getSession logo abaixo.
    }
  }

  try {
    const sessionResult = await withTimeout(
      supabase.auth.getSession(),
      { data: { session: null }, error: new Error('session-timeout') } as any
    );
    const sessionToken = sanitizeBearerToken(sessionResult?.data?.session?.access_token || '');
    if (sessionToken) {
      return sessionToken;
    }
  } catch {
    // Ignorar e cair no retorno final.
  }

  return accessToken || '';
}

async function signR2Upload(file: File, type: MediaUploadType) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('Sua sessão expirou. Faça login novamente para enviar arquivos.');
  }

  const response = await fetch('/api/r2-upload-sign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      type,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || 'Falha ao preparar o upload no R2');
  }

  return payload as {
    signedUrl: string;
    publicUrl: string;
    method?: string;
  };
}

export async function uploadArchiveMediaToR2(input: ArchiveToR2UploadInput): Promise<string> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('Sua sessão expirou. Faça login novamente para enviar arquivos.');
  }

  const response = await fetch('/api/archive-r2-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      archiveUrl: input.archiveUrl,
      fileName: input.fileName,
      contentType: input.contentType || 'application/octet-stream',
      type: input.type,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || 'Falha ao enviar mídia do acervo para o R2');
  }

  if (!payload?.publicUrl) {
    throw new Error('O servidor não retornou a URL pública da mídia enviada.');
  }

  return String(payload.publicUrl);
}

export async function signR2UploadBatch(
  inputs: SignedR2BatchUploadInput[],
  options?: { expiresIn?: number }
): Promise<SignedR2UploadPayload[]> {
  if (inputs.length === 0) return [];

  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('Sua sessão expirou. Faça login novamente para enviar arquivos.');
  }

  const response = await fetch('/api/r2-upload-sign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      expiresIn: options?.expiresIn,
      files: inputs.map((input) => ({
        type: input.type,
        fileName: input.file.name,
        contentType: input.file.type || 'application/octet-stream',
        size: input.file.size,
        expiresIn: input.expiresIn,
      })),
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || 'Falha ao preparar o upload em lote no R2');
  }

  if (!Array.isArray(payload?.uploads) || payload.uploads.length !== inputs.length) {
    throw new Error('O servidor não retornou assinaturas válidas para todas as faixas.');
  }

  return payload.uploads as SignedR2UploadPayload[];
}

export async function uploadFileWithSignedR2Url(
  file: File,
  payload: SignedR2UploadPayload
): Promise<string> {
  const method = payload.method || 'PUT';

  let response: Response;
  try {
    response = await fetch(payload.signedUrl, {
      method,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });
  } catch (error: any) {
    const message = String(error?.message || error || '');
    if (/failed to fetch|networkerror|load failed/i.test(message)) {
      throw new Error('Upload bloqueado pelo navegador. Configure a política de CORS do bucket canticos-media para permitir PUT do domínio canticosccb.com.br.');
    }
    throw error;
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Upload no R2 falhou: ${response.status}${errorText ? ` - ${errorText}` : ''}`);
  }

  return payload.publicUrl;
}

async function uploadViaR2(file: File, type: MediaUploadType): Promise<string> {
  const payload = await signR2Upload(file, type);
  return uploadFileWithSignedR2Url(file, payload);
}

async function uploadViaSupabaseStorage(
  file: File,
  type: MediaUploadType
): Promise<string> {
  try {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    void sizeMB;
    const folder = resolveMediaUploadFolder(type);

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
    const maxMB = maxSizes[folder] || 50;
    if (file.size > maxMB * 1024 * 1024) {
      throw new Error(`Arquivo muito grande (${sizeMB} MB). Máximo permitido: ${maxMB} MB`);
    }

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Configuração do Supabase não encontrada');
    }
    
    // Pegar token via getSession com timeout de 3s
    let accessToken = (await getAccessToken()) || SUPABASE_ANON_KEY;
    
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'bin';
    const uniqueName = `${timestamp}_${Math.random().toString(36).substring(7)}.${ext}`;
    
    // Definir bucket e path baseado no tipo
    const bucket = 'images';
    const path = `${folder}/${uniqueName}`;
    
    // Upload via REST API com timeout
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
    
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

      // Obter URL pública
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
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

export async function uploadFile(
  file: File,
  type: MediaUploadType
): Promise<string> {
  const normalizedType = normalizeMediaUploadType(type);
  const hasR2MediaBase = Boolean(import.meta.env.VITE_MEDIA_PUBLIC_BASE_URL);

  if (hasR2MediaBase) {
    return uploadViaR2(file, normalizedType);
  }

  return uploadViaSupabaseStorage(file, normalizedType);
}

/**
 * Upload de áudio com extração de duração
 */
export async function uploadAudio(file: File): Promise<{ url: string; duration: string }> {
  try {
    // Upload do arquivo
    const url = await uploadFile(file, 'hinos');

    try {
      const duration = await extractAudioDuration(file);
      return { url, duration };
    } catch (error: any) {
      console.warn('⚠️ Não foi possível extrair a duração do áudio, continuando sem esse campo:', error?.message || error);
      return { url, duration: '' };
    }
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
