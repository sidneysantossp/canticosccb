/**
 * DEPRECATED - Este arquivo foi substituído por supabase-api.ts
 * Mantido para compatibilidade com imports existentes
 */
export * from './supabase-api';
export { default } from './supabase-api';

// Re-export funções de upload
export { uploadFile, uploadAudio, uploadCover, uploadAvatar } from './supabase-upload';
