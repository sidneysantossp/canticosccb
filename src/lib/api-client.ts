/**
 * Cliente API - Substitui Supabase
 * Usa backend PHP + MySQL
 */

// Detectar ambiente local (incluindo IPs privados como 192.168.x.x)
const isLocalDevelopment = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.startsWith('172.')
);
const API_BASE_URL = isLocalDevelopment
  ? '/api'
  : ((import.meta as any)?.env?.VITE_API_BASE_URL || 'https://canticosccb.com.br/api');

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Função auxiliar para fazer requisições HTTP
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      ...(options.headers as any),
    };
    // Só envia Content-Type quando houver corpo (evita preflight em GET)
    if (options.body) headers['Content-Type'] = 'application/json';
    const url = `${API_BASE_URL}${endpoint}`;
    if (typeof window !== 'undefined') {
      console.log('API request →', options.method || 'GET', url);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Ler como texto e tentar parsear JSON para evitar erro "Unexpected token <" quando o backend retorna HTML
    const text = await response.text();
    let parsed: any = undefined;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      // não é JSON
      parsed = {};
    }

    if (!response.ok) {
      // tentar extrair mensagem significativa
      const errMsg = (parsed && (parsed.error || parsed.message)) || text || 'Erro na requisição';
      return { error: typeof errMsg === 'string' ? errMsg : 'Erro na requisição' };
    }

    return { data: parsed } as any;
  } catch (error) {
    console.error('Erro na requisição:', error);
    return { error: 'Erro de conexão com o servidor' };
  }
}

/**
 * Upload de arquivo
 */
async function uploadFile(
  endpoint: string,
  file: File,
  fieldName: string = 'file'
): Promise<ApiResponse<{ filename: string; url: string; size: number }>> {
  try {
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    const text = await response.text();
    let parsed: any = {};
    try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = {}; }

    if (!response.ok) {
      const errMsg = (parsed && (parsed.error || parsed.message)) || text || 'Erro no upload';
      return { error: typeof errMsg === 'string' ? errMsg : 'Erro no upload' };
    }

    return { data: parsed } as any;
  } catch (error) {
    console.error('Erro no upload:', error);
    return { error: 'Erro de conexão durante upload' };
  }
}

// ============================================
// HINOS
// ============================================

export interface Hino {
  id: number;
  numero?: number;
  titulo: string;
  compositor?: string;
  categoria?: string;
  audio_url: string;
  cover_url?: string;
  duracao?: string;
  letra?: string;
  tags?: string;
  ativo: number;
  created_at?: string;
  updated_at?: string;
}

export const hinosApi = {
  list: async (params?: {
    search?: string;
    categoria?: string;
    compositor?: string;
    ativo?: number;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.categoria) query.append('categoria', params.categoria);
    if (params?.compositor) query.append('compositor', params.compositor);
    if (params?.ativo !== undefined) query.append('ativo', params.ativo.toString());
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    return request<PaginatedResponse<Hino>>(`/hinos?${query}`);
  },

  get: async (id: number) => {
    return request<Hino>(`/hinos/${id}`);
  },

  create: async (data: Partial<Hino>) => {
    // Usar /hinos.php direto para evitar problema de rewrite POST→GET
    return request<Hino>('/hinos.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<Hino>) => {
    return request<Hino>(`/hinos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return request<{ success: boolean; message: string }>(`/hinos/${id}`, {
      method: 'DELETE',
    });
  },

  // Pendentes de aprovação
  listPending: async () => {
    return request<{ hinos: Hino[]; total: number }>('/hinos/pending.php');
  },

  approve: async (id: number) => {
    return request<{ success: boolean; message: string }>('/hinos/pending.php', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'approve' }),
    });
  },

  reject: async (id: number, motivo: string) => {
    return request<{ success: boolean; message: string }>('/hinos/pending.php', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'reject', motivo }),
    });
  },
};

// ============================================
// COMPOSITORES
// ============================================

export interface Compositor {
  id: number;
  usuario_id?: number;
  nome: string;
  nome_artistico?: string;
  biografia?: string;
  tipo_compositor?: string;
  telefone?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  localizacao?: string; // campo agregado opcional
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  avatar_url?: string;
  banner_url?: string;
  // Preferências de notificações (tinyint 0/1 no MySQL)
  notif_email_followers?: number;
  notif_email_comments?: number;
  notif_email_analytics?: number;
  notif_push_new_followers?: number;
  notif_push_milestones?: number;
  verificado?: number;
  ativo?: number;
  created_at?: string;
  updated_at?: string;
}

export const compositoresApi = {
  list: async (params?: { search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    // Usar index.php explicitamente para evitar redirects do Apache
    return request<PaginatedResponse<Compositor>>(`/compositores/index.php?${query}`);
  },

  get: async (id: number) => {
    return request<Compositor>(`/compositores/index.php?id=${id}`);
  },

  // Buscar compositor pelo usuario_id (quando o id do compositor não é o mesmo do usuário)
  getByUsuarioId: async (usuarioId: number) => {
    return request<Compositor>(`/compositores/index.php?usuario_id=${usuarioId}`);
  },

  create: async (data: Partial<Compositor>) => {
    return request<Compositor>('/compositores/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<Compositor>) => {
    return request<Compositor>(`/compositores/index.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return request<{ success: boolean; message: string }>(`/compositores/index.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// ÁLBUNS
// ============================================

export interface Album {
  id: number;
  titulo: string;
  title?: string; // Alias para titulo
  descricao?: string;
  description?: string; // Alias para descricao
  cover_url?: string;
  ano?: number;
  release_date?: string;
  compositor_id?: number;
  artist?: string;
  genre?: string;
  total_tracks?: number;
  status?: 'published' | 'draft';
  ativo: number;
  created_at?: string;
  updated_at?: string;
}

export const albunsApi = {
  list: async (params?: { search?: string; page?: number; limit?: number; compositor_id?: number | string; usuario_id?: number | string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.compositor_id != null) query.append('compositor_id', String(params.compositor_id));
    if (params?.usuario_id != null) query.append('usuario_id', String(params.usuario_id));

    return request<PaginatedResponse<Album>>(`/albuns/index.php?${query}`);
  },

  get: async (id: number) => {
    return request<Album>(`/albuns/index.php?id=${id}`);
  },

  create: async (data: Partial<Album>) => {
    console.log('🚀 Criando álbum:', data);
    const result = await request<Album>('/albuns/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    console.log('📦 Resposta da criação:', result);
    return result;
  },

  update: async (id: number, data: Partial<Album>) => {
    return request<Album>(`/albuns/index.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return request<{ success: boolean; message: string }>(`/albuns/index.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  // Gerenciar hinos do álbum
  listHinos: async (albumId: number) => {
    return request<{ album_id: number; hinos: Hino[]; total: number }>(`/albuns/hinos.php?album_id=${albumId}`);
  },

  addHinos: async (albumId: number, hinoIds: number[]) => {
    return request<{ success: boolean; message: string; added: number }>(`/albuns/hinos.php?album_id=${albumId}`, {
      method: 'POST',
      body: JSON.stringify({ hino_ids: hinoIds }),
    });
  },

  removeHino: async (albumId: number, hinoId: number) => {
    return request<{ success: boolean; message: string }>(`/albuns/hinos.php?album_id=${albumId}&hino_id=${hinoId}`, {
      method: 'DELETE',
    });
  },

  updateOrdem: async (albumId: number, ordem: Array<{ hino_id: number; ordem: number }>) => {
    return request<{ success: boolean; message: string }>(`/albuns/hinos.php?album_id=${albumId}`, {
      method: 'POST',
      body: JSON.stringify({ ordem }),
    });
  },
};

// ============================================
// CATEGORIAS
// ============================================

export interface Categoria {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
  imagem_url?: string;
  ativo: number;
  created_at?: string;
  updated_at?: string;
}

export const categoriasApi = {
  list: async (params?: { search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    // Usar index.php explicitamente para evitar problemas de rewrite (POST/GET)
    return request<PaginatedResponse<Categoria>>(`/categorias/index.php?${query}`);
  },

  get: async (id: number) => {
    return request<Categoria>(`/categorias/${id}`);
  },

  create: async (data: Partial<Categoria>) => {
    return request<Categoria>('/categorias/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<Categoria>) => {
    return request<Categoria>(`/categorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return request<{ success: boolean; message: string }>(`/categorias/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// USUÁRIOS
// ============================================

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  avatar_url?: string;
  tipo: string;
  ativo: number;
  telefone?: string;
  localizacao?: string;
  data_nascimento?: string; // YYYY-MM-DD
  biografia?: string;
  notificacoes_email?: number; // 0 ou 1
  reproducao_automatica?: number; // 0 ou 1
  perfil_publico?: number; // 0 ou 1
  created_at?: string;
  updated_at?: string;
}

export const usuariosApi = {
  list: async (params?: { search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    return request<PaginatedResponse<Usuario>>(`/usuarios/index.php?${query}`);
  },

  get: async (id: number) => {
    return request<Usuario>(`/usuarios/index.php?id=${id}`);
  },

  create: async (data: Partial<Usuario>) => {
    return request<Usuario>('/usuarios/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<Usuario>) => {
    return request<Usuario>(`/usuarios/index.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return request<{ success: boolean; message: string }>(`/usuarios/index.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// UPLOADS
// ============================================

export const uploadApi = {
  audio: async (file: File) => {
    return uploadFile('/upload/audio.php', file, 'audio');
  },

  cover: async (file: File) => {
    return uploadFile('/upload/cover.php', file, 'cover');
  },

  avatar: async (file: File) => {
    return uploadFile('/upload/avatar.php', file, 'avatar');
  },
};

// ============================================
// GERENTES DE COMPOSITORES
// ============================================

export interface CompositorGerente {
  id: number;
  compositor_id: number;
  gerente_usuario_id: number;
  status: 'pendente' | 'ativo' | 'recusado' | 'removido';
  convidado_em: string;
  aceito_em?: string;
  removido_em?: string;
  notas?: string;
  // Dados join
  nome?: string;
  nome_artistico?: string;
  email?: string;
  avatar_url?: string;
  biografia?: string;
}

export const compositorGerentesApi = {
  // Buscar usuário por email
  buscarUsuario: async (email: string) => {
    const response = await request<{ success: boolean; data: { id: number; nome: string; email: string; avatar_url?: string } }>(
      `/compositor-gerentes/index.php?action=buscar-usuario&email=${encodeURIComponent(email)}`
    );
    return response.data;
  },

  // Convidar gerente
  convidar: async (data: { compositor_id: number; email_gerente: string; notas?: string }) => {
    return request<{ success: boolean; convite_id: number; gerente: any }>(
      '/compositor-gerentes/index.php',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  // Aceitar convite
  aceitar: async (id: number) => {
    return request<{ success: boolean; convite: CompositorGerente }>(
      `/compositor-gerentes/index.php/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ acao: 'aceitar' }),
      }
    );
  },

  // Recusar convite
  recusar: async (id: number) => {
    return request<{ success: boolean }>(
      `/compositor-gerentes/index.php/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ acao: 'recusar' }),
      }
    );
  },

  // Remover gerente
  remover: async (id: number) => {
    return request<{ success: boolean }>(
      `/compositor-gerentes/index.php/${id}`,
      {
        method: 'DELETE',
      }
    );
  },

  // Listar gerentes de um compositor
  listarGerentes: async (compositor_id: number) => {
    return request<CompositorGerente[]>(
      `/compositor-gerentes/index.php?action=gerentes-compositor&compositor_id=${compositor_id}`
    );
  },

  // Listar compositores gerenciados por um usuário
  listarCompositores: async (usuario_id: number) => {
    return request<CompositorGerente[]>(
      `/compositor-gerentes/index.php?action=compositores-gerenciados&usuario_id=${usuario_id}`
    );
  },
};

/**
 * 7. Document Reviews (Revisão de documentos)
 */
export interface DocumentReview {
  id: number;
  compositor_id: number;
  document_type: 'rg' | 'cnh' | 'passport' | 'cpf';
  extracted_name?: string;
  expected_name: string;
  similarity?: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  image_path?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  // Campos extras da join
  nome?: string;
  nome_artistico?: string;
}

export const documentReviewsApi = {
  // Listar documentos pendentes
  listPending: async () => {
    return request<{ documents: DocumentReview[] }>(
      `/document-reviews/index.php`
    );
  },

  // Listar documentos de um compositor
  getByCompositor: async (compositorId: number) => {
    return request<{ documents: DocumentReview[] }>(
      `/document-reviews/index.php/compositor/${compositorId}`
    );
  },

  // Revisar documento
  review: async (id: number, data: {
    status: 'approved' | 'rejected';
    admin_notes?: string;
    reviewed_by?: number;
  }) => {
    return request<{ success: boolean; message: string }>(
      `/document-reviews/index.php/${id}/review`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  },
};

// Cliente padrão exportado
export default {
  hinos: hinosApi,
  compositores: compositoresApi,
  albuns: albunsApi,
  categorias: categoriasApi,
  usuarios: usuariosApi,
  upload: uploadApi,
  compositorGerentes: compositorGerentesApi,
  documentReviews: documentReviewsApi,
};
