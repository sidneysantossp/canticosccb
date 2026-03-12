/**
 * API para Avisos da Plataforma (platform_notices)
 */
import { supabaseDelete, supabaseFetch, supabaseInsert, supabaseUpdate } from './supabaseRest';

export interface PlatformNotice {
  id: string;
  title: string;
  content: string;
  published_at: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface NoticesListResult {
  notices: PlatformNotice[];
  total: number;
}

export const noticesApi = {
  /**
   * Listar avisos públicos (ativos) com paginação
   */
  listPublic: async (page = 1, limit = 15): Promise<NoticesListResult> => {
    try {
      const offset = (page - 1) * limit;
      const rows = await supabaseFetch<PlatformNotice>('platform_notices', {
        is_active: 'eq.true',
        select: 'id,title,content,published_at,created_at',
        order: 'published_at.desc',
        limit: String(limit),
        offset: String(offset),
      });

      // Buscar total para paginação
      let total = rows.length;
      try {
        const allRows = await supabaseFetch<{ id: string }>('platform_notices', {
          is_active: 'eq.true',
          select: 'id',
        });
        total = allRows.length;
      } catch {}

      return { notices: rows || [], total };
    } catch (error: any) {
      console.error('[noticesApi.listPublic] Error:', error?.message);
      return { notices: [], total: 0 };
    }
  },

  /**
   * Buscar aviso por ID (público)
   */
  getById: async (id: string): Promise<PlatformNotice | null> => {
    try {
      const rows = await supabaseFetch<PlatformNotice>('platform_notices', {
        id: `eq.${id}`,
        is_active: 'eq.true',
        select: '*',
        limit: '1',
      });
      return rows?.[0] || null;
    } catch (error: any) {
      console.error('[noticesApi.getById] Error:', error?.message);
      return null;
    }
  },

  /**
   * Admin: Listar todos os avisos (ativos e inativos)
   */
  listAll: async (page = 1, limit = 20): Promise<NoticesListResult> => {
    try {
      const offset = (page - 1) * limit;
      const rows = await supabaseFetch<PlatformNotice>('platform_notices', {
        select: '*',
        order: 'published_at.desc',
        limit: String(limit),
        offset: String(offset),
      });

      let total = rows.length;
      try {
        const allRows = await supabaseFetch<{ id: string }>('platform_notices', {
          select: 'id',
        });
        total = allRows.length;
      } catch {}

      return { notices: rows || [], total };
    } catch (error: any) {
      console.error('[noticesApi.listAll] Error:', error?.message);
      return { notices: [], total: 0 };
    }
  },

  /**
   * Admin: Buscar aviso por ID (qualquer status)
   */
  getByIdAdmin: async (id: string): Promise<PlatformNotice | null> => {
    try {
      const rows = await supabaseFetch<PlatformNotice>('platform_notices', {
        id: `eq.${id}`,
        select: '*',
        limit: '1',
      });
      return rows?.[0] || null;
    } catch (error: any) {
      console.error('[noticesApi.getByIdAdmin] Error:', error?.message);
      return null;
    }
  },

  /**
   * Admin: Criar aviso
   */
  create: async (data: { title: string; content: string; published_at?: string; is_active?: boolean }): Promise<PlatformNotice | null> => {
    try {
      const result = await supabaseInsert('platform_notices', {
        title: data.title,
        content: data.content,
        published_at: data.published_at || new Date().toISOString(),
        is_active: data.is_active ?? true,
      });
      return result?.[0] || result || null;
    } catch (error: any) {
      console.error('[noticesApi.create] Error:', error?.message);
      return null;
    }
  },

  /**
   * Admin: Atualizar aviso
   */
  update: async (id: string, data: { title?: string; content?: string; published_at?: string; is_active?: boolean }): Promise<boolean> => {
    try {
      await supabaseUpdate('platform_notices', { id: `eq.${id}` }, {
        ...data,
        updated_at: new Date().toISOString(),
      });
      return true;
    } catch (error: any) {
      console.error('[noticesApi.update] Error:', error?.message);
      return false;
    }
  },

  /**
   * Admin: Excluir aviso
   */
  delete: async (id: string): Promise<boolean> => {
    try {
      await supabaseDelete('platform_notices', { id: `eq.${id}` });
      return true;
    } catch (error: any) {
      console.error('[noticesApi.delete] Error:', error?.message);
      return false;
    }
  },
};
