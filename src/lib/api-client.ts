/**
 * API Client - Compatibilidade
 * Re-exporta funções do Supabase para manter compatibilidade
 */
export * from './supabase-api';
export { default } from './supabase-api';

// Re-export funções de upload
export { uploadFile, uploadAudio, uploadCover, uploadAvatar } from './supabase-upload';

// ==================== STUBS PARA COMPATIBILIDADE ====================
// Estas funções retornam dados vazios para não quebrar imports existentes

export const hinosApi = {
  getAll: async () => [],
  getById: async () => null,
  create: async () => ({}),
  update: async () => ({}),
  delete: async () => {},
};

export const compositoresApi = {
  getAll: async () => [],
  getById: async () => null,
  getBySlug: async () => null,
  create: async () => ({}),
  update: async () => ({}),
  delete: async () => {},
};

export const albunsApi = {
  getAll: async () => [],
  getById: async () => null,
  create: async () => ({}),
  update: async () => ({}),
  delete: async () => {},
};

export const categoriasApi = {
  getAll: async () => [],
  getById: async () => null,
  create: async () => ({}),
  update: async () => ({}),
  delete: async () => {},
};

export const usuariosApi = {
  getAll: async () => [],
  getById: async () => null,
  update: async () => ({}),
};

export const bannersApi = {
  getAll: async () => [],
  getById: async () => null,
  create: async () => ({}),
  update: async () => ({}),
  delete: async () => {},
};

export const documentReviewsApi = {
  getAll: async () => [],
  getById: async () => null,
  create: async () => ({}),
  update: async () => ({}),
};

export const compositorGerentesApi = {
  getAll: async () => [],
  getById: async () => null,
  create: async () => ({}),
  delete: async () => {},
};

export interface DocumentReview {
  id: string;
  status: string;
  created_at: string;
}
