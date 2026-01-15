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

export const uploadApi = {
  uploadFile: async () => ({ url: '', fileName: '' }),
  uploadAudio: async () => ({ url: '', fileName: '', duration: '00:00' }),
  uploadCover: async () => ({ url: '', fileName: '' }),
  uploadAvatar: async () => ({ url: '', fileName: '' }),
};

export const playlistsApi = {
  getAll: async () => [],
  getById: async () => null,
  create: async () => ({}),
  update: async () => ({}),
  delete: async () => {},
  addHino: async () => ({}),
  removeHino: async () => {},
};

export const favoritosApi = {
  getAll: async () => [],
  add: async () => ({}),
  remove: async () => {},
  check: async () => false,
};

export const historicoApi = {
  getAll: async () => [],
  add: async () => ({}),
};

export const notificacoesApi = {
  getAll: async () => [],
  markAsRead: async () => ({}),
  delete: async () => {},
};

export interface DocumentReview {
  id: string;
  status: string;
  created_at: string;
}

export interface Hino {
  id: string;
  numero?: number;
  titulo: string;
  compositor?: string;
  compositor_id?: string;
  compositor_nome?: string;
  categoria?: string;
  cover_url?: string;
  audio_url?: string;
  duracao?: string;
  letra?: string;
  status?: string;
  ativo?: boolean;
}
