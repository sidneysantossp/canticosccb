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
  list: async (params?: { compositor?: string; ativo?: number; limit?: number }) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const filters: Record<string, string> = {
        select: 'id,numero,titulo,compositor_nome,categoria,cover_url,audio_url,duracao,status,ativo,created_at',
        order: 'created_at.desc',
      };

      if (params?.compositor) {
        filters.compositor_nome = `ilike.%${params.compositor}%`;
      }
      if (params?.ativo !== undefined) {
        filters.ativo = `eq.${params.ativo}`;
      }
      if (params?.limit) {
        filters.limit = String(params.limit);
      }

      const rows = await supabaseFetch<any>('hinos', filters);
      return { data: rows, error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },
  listPending: async () => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const filters: Record<string, string> = {
        select: 'id,numero,titulo,compositor_nome,categoria,cover_url,audio_url,duracao,status,ativo,created_at',
        status: 'eq.pending',
        order: 'created_at.desc',
      };

      const rows = await supabaseFetch<any>('hinos', filters);
      return { data: rows, error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },
  getAll: async () => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const rows = await supabaseFetch<any>('hinos', {
        select: '*',
        order: 'created_at.desc',
      });
      return rows;
    } catch (error: any) {
      console.error('Error fetching all hymns:', error);
      return [];
    }
  },
  get: async (id: string | number) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const rows = await supabaseFetch<any>('hinos', {
        id: `eq.${id}`,
        select: '*',
        limit: '1',
      });
      
      if (rows.length > 0) {
        const hino = rows[0];
        
        // Buscar categorias relacionadas
        try {
          const categoriasRows = await supabaseFetch<any>('hino_categorias', {
            hino_id: `eq.${id}`,
            select: 'categoria_id,nome',
          });
          
          // Buscar nomes das categorias
          if (categoriasRows.length > 0) {
            const categoriaIds = categoriasRows.map(r => r.categoria_id).join(',');
            const categorias = await supabaseFetch<any>('categorias', {
              id: `in.(${categoriaIds})`,
              select: 'nome',
            });
            
            hino.categorias = categorias.map(c => c.nome);
            hino.categoria = hino.categorias[0] || ''; // Manter compatibilidade
          }
        } catch (e) {
          console.warn('Error fetching hymn categories:', e);
          hino.categorias = hino.categoria ? [hino.categoria] : [];
        }
        
        return { data: hino, error: null };
      }
      return { data: null, error: 'Hino não encontrado' };
    } catch (error: any) {
      console.error('Error fetching hymn:', error);
      return { data: null, error: error.message };
    }
  },
  create: async (data: any) => {
    const { supabaseInsert, supabaseFetch } = await import('./supabaseRest');
    try {
      // Inserir hino sem categorias primeiro
      const hinoData: Record<string, any> = {
        titulo: data.titulo,
        categoria: data.categorias?.[0] || data.categoria || '',
        status: 'published',
      };
      if (data.numero) hinoData.numero = data.numero;
      if (data.compositor) hinoData.compositor_nome = data.compositor;
      if (data.compositor_nome) hinoData.compositor_nome = data.compositor_nome;
      if (data.compositor_id) hinoData.compositor_id = data.compositor_id;
      if (data.cover_url) hinoData.cover_url = data.cover_url;
      if (data.audio_url) hinoData.audio_url = data.audio_url;
      if (data.duracao) hinoData.duracao = data.duracao;
      if (data.letra) hinoData.letra = data.letra;
      if (data.ativo !== undefined) hinoData.ativo = data.ativo;
      if (data.youtube_source) hinoData.youtube_source = data.youtube_source;
      if (data.participacao_especial) hinoData.participacao_especial = data.participacao_especial;
      
      const result = await supabaseInsert('hinos', hinoData);
      
      if (result && result.length > 0 && data.categorias && data.categorias.length > 0) {
        // Inserir relacionamentos com categorias
        const hinoId = result[0].id;
        
        // Buscar IDs das categorias pelos nomes
        const categoriaNames = data.categorias.join("','");
        const categorias = await supabaseFetch<any>('categorias', {
          nome: `in.('${categoriaNames}')`,
          select: 'id,nome',
        });
        
        // Inserir relacionamentos
        for (const cat of categorias) {
          try {
            await supabaseInsert('hino_categorias', {
              hino_id: hinoId,
              categoria_id: cat.id,
            });
          } catch (e) {
            console.warn('Error inserting hymn-category relation:', e);
          }
        }
      }
      
      return { data: result, error: null };
    } catch (error: any) {
      console.error('Error creating hymn:', error);
      return { data: null, error: error.message };
    }
  },
  update: async (id: string | number, data: any) => {
    const { supabaseUpdate, supabaseDelete, supabaseInsert, supabaseFetch } = await import('./supabaseRest');
    try {
      // Atualizar hino
      const updateData: Record<string, any> = {
        titulo: data.titulo,
        categoria: data.categorias?.[0] || data.categoria || '',
      };
      if (data.numero !== undefined) updateData.numero = data.numero;
      if (data.compositor) updateData.compositor_nome = data.compositor;
      if (data.compositor_nome) updateData.compositor_nome = data.compositor_nome;
      if (data.compositor_id) updateData.compositor_id = data.compositor_id;
      if (data.cover_url !== undefined) updateData.cover_url = data.cover_url;
      if (data.audio_url !== undefined) updateData.audio_url = data.audio_url;
      if (data.duracao !== undefined) updateData.duracao = data.duracao;
      if (data.letra !== undefined) updateData.letra = data.letra;
      if (data.ativo !== undefined) updateData.ativo = data.ativo;
      if (data.youtube_source) updateData.youtube_source = data.youtube_source;
      if (data.participacao_especial !== undefined) updateData.participacao_especial = data.participacao_especial;
      
      const result = await supabaseUpdate('hinos', { id: `eq.${id}` }, updateData);
      
      // Atualizar categorias se fornecidas
      if (data.categorias && Array.isArray(data.categorias)) {
        // Remover relacionamentos antigos
        await supabaseDelete('hino_categorias', { hino_id: `eq.${id}` });
        
        // Adicionar novos relacionamentos
        if (data.categorias.length > 0) {
          // Buscar IDs das categorias pelos nomes
          const categoriaNames = data.categorias.join("','");
          const categorias = await supabaseFetch<any>('categorias', {
            nome: `in.('${categoriaNames}')`,
            select: 'id,nome',
          });
          
          // Inserir novos relacionamentos
          for (const cat of categorias) {
            try {
              await supabaseInsert('hino_categorias', {
                hino_id: id,
                categoria_id: cat.id,
              });
            } catch (e) {
              console.warn('Error inserting hymn-category relation:', e);
            }
          }
        }
      }
      
      return { data: result, error: null };
    } catch (error: any) {
      console.error('Error updating hymn:', error);
      return { data: null, error: error.message };
    }
  },
  delete: async (id: string | number) => {
    const { supabaseDelete } = await import('./supabaseRest');
    try {
      await supabaseDelete('hinos', { id: `eq.${id}` });
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error deleting hymn:', error);
      return { success: false, error: error.message };
    }
  },
};

export const compositoresApi = {
  list: async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      console.log('🔍 [compositoresApi.list] Fetching composers with params:', params);

      const limit = params?.limit || 20;
      const page = params?.page || 1;

      const filters: Record<string, string> = {
        select: 'id,name,artistic_name,email,verified,status,avatar_url,photo_url,bio,slug,category,is_approved,is_featured,is_trending,followers_count,created_at,updated_at',
        order: 'created_at.desc',
      };

      if (params?.search) {
        filters.or = `(name.ilike.%${params.search}%,artistic_name.ilike.%${params.search}%,email.ilike.%${params.search}%)`;
      }

      if (params?.status === 'pending') {
        filters.status = 'eq.pending';
      } else if (params?.status === 'verified' || params?.status === 'active') {
        filters.verified = 'eq.true';
      }

      // Buscar total de registros
      const totalFilters = { ...filters };
      delete totalFilters.limit;
      delete totalFilters.offset;
      const allRows = await supabaseFetch<any>('composers', totalFilters);
      const total = allRows.length;

      // Buscar página específica
      filters.limit = String(limit);
      if (page > 1) {
        const offset = (page - 1) * limit;
        filters.offset = String(offset);
      }

      const rows = await supabaseFetch<any>('composers', filters);

      // Mapear campos para compatibilidade com a UI (português)
      const mapped = rows.map((r: any) => ({
        ...r,
        nome: r.name,
        nome_artistico: r.artistic_name,
        biografia: r.biography || r.bio,
        verificado: r.verified,
        ativo: r.status !== 'inactive',
      }));

      console.log(`✅ [compositoresApi.list] Found ${mapped.length} composers (total: ${total})`);

      return {
        data: {
          compositores: mapped,
          total: total,
          pages: Math.ceil(total / limit)
        },
        error: null
      };
    } catch (error: any) {
      console.error('❌ [compositoresApi.list] Error:', error);
      return { data: { compositores: [], total: 0, pages: 0 }, error: error.message };
    }
  },
  getAll: async () => {
    const result = await compositoresApi.list({ limit: 1000 });
    return result.data || [];
  },
  get: async (id: string | number) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const rows = await supabaseFetch<any>('composers', {
        id: `eq.${id}`,
        select: '*',
        limit: '1'
      });
      if (rows.length > 0) {
        const r = rows[0];
        return {
          data: {
            ...r,
            nome: r.name,
            nome_artistico: r.artistic_name,
            biografia: r.biography || r.bio,
            verificado: r.verified,
            ativo: r.status !== 'inactive',
          },
          error: null
        };
      }
      return { data: null, error: 'Compositor não encontrado' };
    } catch (error: any) {
      console.error('❌ [compositoresApi.get] Error:', error);
      return { data: null, error: error.message };
    }
  },
  getById: async (id: string | number) => {
    const result = await compositoresApi.get(id);
    return result.data;
  },
  getBySlug: async (slug: string) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const rows = await supabaseFetch<any>('composers', {
        slug: `eq.${slug}`,
        select: '*',
        limit: '1'
      });
      if (rows.length > 0) {
        const r = rows[0];
        return {
          ...r,
          nome: r.name,
          nome_artistico: r.artistic_name,
          biografia: r.biography || r.bio,
          verificado: r.verified,
          ativo: r.status !== 'inactive',
        };
      }
      return null;
    } catch (error) {
      console.error('❌ [compositoresApi.getBySlug] Error:', error);
      return null;
    }
  },
  create: async (data: any) => {
    const { supabaseInsert } = await import('./supabaseRest');
    try {
      const composerData = {
        name: data.nome?.trim() || data.name,
        artistic_name: data.nome_artistico?.trim() || data.artistic_name || null,
        biography: data.biografia?.trim() || data.biography || null,
        bio: data.biografia?.trim() || data.bio || null,
        verified: data.verificado === 1 || data.verificado === true,
        status: (data.ativo === 1 || data.ativo === true) ? 'active' : 'pending',
        avatar_url: data.avatar_url || null,
        email: data.email || null,
      };
      console.log('🔍 [compositoresApi.create] Creating composer:', composerData);
      await supabaseInsert('composers', composerData);
      console.log('✅ [compositoresApi.create] Composer created successfully');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('❌ [compositoresApi.create] Error:', error);
      return { success: false, error: error.message };
    }
  },
  update: async (id: string | number, data: any) => {
    const { supabaseUpdate } = await import('./supabaseRest');
    try {
      const updateData: any = {};
      if (data.nome !== undefined) updateData.name = data.nome.trim();
      if (data.name !== undefined) updateData.name = data.name;
      if (data.nome_artistico !== undefined) updateData.artistic_name = data.nome_artistico.trim();
      if (data.artistic_name !== undefined) updateData.artistic_name = data.artistic_name;
      if (data.biografia !== undefined) { updateData.biography = data.biografia.trim(); updateData.bio = data.biografia.trim(); }
      if (data.biography !== undefined) updateData.biography = data.biography;
      if (data.verificado !== undefined) {
        updateData.verified = data.verificado === 1 || data.verificado === true;
        updateData.status = updateData.verified ? 'approved' : 'pending';
      }
      if (data.verified !== undefined) updateData.verified = data.verified;
      if (data.ativo !== undefined) updateData.status = (data.ativo === 1 || data.ativo === true) ? 'active' : 'inactive';
      if (data.status !== undefined) updateData.status = data.status;
      if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;

      console.log('🔍 [compositoresApi.update] Updating composer ID:', id, 'with data:', updateData);
      await supabaseUpdate('composers', { id: `eq.${id}` }, updateData);
      console.log('✅ [compositoresApi.update] Composer updated successfully');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('❌ [compositoresApi.update] Error:', error);
      return { success: false, error: error.message };
    }
  },
  delete: async (id: string | number) => {
    const { supabaseFetch, supabaseDelete } = await import('./supabaseRest');
    const { supabase } = await import('./supabase-auth');
    try {
      console.log('🔍 [compositoresApi.delete] Deleting composer ID:', id);

      // 1. Buscar o email do compositor antes de deletar
      let composerEmail: string | null = null;
      try {
        const rows = await supabaseFetch<any>('composers', {
          id: `eq.${id}`,
          select: 'email',
          limit: '1',
        });
        composerEmail = rows?.[0]?.email || null;
        console.log('📧 [compositoresApi.delete] Composer email:', composerEmail);
      } catch (e) {
        console.warn('⚠️ [compositoresApi.delete] Could not fetch composer email:', e);
      }

      // 2. Deletar o compositor
      await supabaseDelete('composers', { id: `eq.${id}` });
      console.log('✅ [compositoresApi.delete] Composer record deleted');

      // 3. Desativar o usuário associado (via Supabase JS client com sessão do admin)
      if (composerEmail) {
        try {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              is_composer: false,
              is_blocked: true,
              status: 'deleted',
            })
            .eq('email', composerEmail);

          if (updateError) {
            console.warn('⚠️ [compositoresApi.delete] Failed to deactivate user:', updateError.message);
          } else {
            console.log('✅ [compositoresApi.delete] Associated user deactivated');
          }
        } catch (e) {
          console.warn('⚠️ [compositoresApi.delete] Error deactivating user:', e);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ [compositoresApi.delete] Error:', error);
      return { success: false, error: error.message };
    }
  },
};

export const albunsApi = {
  list: async (params?: { page?: number; limit?: number; search?: string }) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const limit = params?.limit || 12;
      const page = params?.page || 1;

      const filters: Record<string, string> = {
        select: 'id,title,artist,description,cover_url,total_tracks,release_date,composer_id,created_at,updated_at',
        order: 'created_at.desc',
      };

      if (params?.search) {
        filters.or = `(title.ilike.%${params.search}%,artist.ilike.%${params.search}%)`;
      }

      // Buscar total de registros
      const totalFilters = { ...filters };
      delete totalFilters.limit;
      delete totalFilters.offset;
      const allRows = await supabaseFetch<any>('albums', totalFilters);
      const total = allRows.length;

      // Buscar página específica
      filters.limit = String(limit);
      if (page > 1) {
        const offset = (page - 1) * limit;
        filters.offset = String(offset);
      }

      const rows = await supabaseFetch<any>('albums', filters);

      return {
        data: {
          albuns: rows,
          data: rows,
          total: total,
          pages: Math.ceil(total / limit)
        },
        error: null
      };
    } catch (error: any) {
      console.error('❌ [albunsApi.list] Error:', error);
      return { data: { albuns: [], data: [], total: 0, pages: 0 }, error: error.message };
    }
  },
  get: async (id: number | string) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const rows = await supabaseFetch<any>('albums', {
        id: `eq.${id}`,
        select: 'id,title,artist,description,cover_url,total_tracks,release_date,composer_id,is_published,active,created_at,updated_at',
        limit: '1',
      });
      const album = rows.length > 0 ? rows[0] : null;
      if (album) {
        album.status = album.is_published ? 'published' : 'draft';
      }
      return { data: album, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
  listHinos: async (albumId: number | string) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const rows = await supabaseFetch<any>('album_hinos', {
        album_id: `eq.${albumId}`,
        select: 'hino_id,ordem,hinos(id,titulo,numero,compositor,compositor_nome,categoria,duracao,audio_url,cover_url,letra,created_at,youtube_source)',
        order: 'ordem.asc',
      });
      const hinos = rows
        .map((row: any) => {
          const h = row.hinos;
          if (!h) return null;
          return {
            ...h,
            ordem: row.ordem,
            compositor: h.compositor_nome || h.compositor || 'Compositor',
          };
        })
        .filter(Boolean);
      return { data: { hinos }, error: null };
    } catch (error: any) {
      console.error('❌ [albunsApi.listHinos] Error:', error);
      return { data: { hinos: [] }, error: error.message };
    }
  },
  getAll: async () => [],
  getById: async (id: number | string) => {
    const result = await albunsApi.get(id);
    return result.data;
  },
  create: async (data: any) => {
    const { supabaseInsert } = await import('./supabaseRest');
    try {
      const result = await supabaseInsert('albums', {
        title: data.titulo || data.title || '',
        description: data.descricao || data.description || '',
        cover_url: data.cover_url || '',
        artist: data.artist || '',
        is_published: data.is_published !== false,
        active: data.ativo !== 0,
      });
      return { data: result, error: null };
    } catch (error: any) {
      console.error('❌ [albunsApi.create] Error:', error);
      return { data: null, error: error.message };
    }
  },
  update: async (id: number | string, data: any) => {
    const { supabaseUpdate } = await import('./supabaseRest');
    try {
      const updateData: any = {};
      if (data.titulo !== undefined) updateData.title = data.titulo;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.descricao !== undefined) updateData.description = data.descricao;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.cover_url !== undefined) updateData.cover_url = data.cover_url;
      if (data.artist !== undefined) updateData.artist = data.artist;
      if (data.is_published !== undefined) updateData.is_published = data.is_published;
      if (data.ativo !== undefined) updateData.active = data.ativo !== 0;
      if (data.ano !== undefined) updateData.release_year = data.ano;

      await supabaseUpdate('albums', { id: `eq.${id}` }, updateData);
      return { data: { id }, error: null };
    } catch (error: any) {
      console.error('❌ [albunsApi.update] Error:', error);
      return { data: null, error: error.message };
    }
  },
  delete: async (id: number | string) => {
    const { supabaseDelete } = await import('./supabaseRest');
    try {
      await supabaseDelete('albums', { id: `eq.${id}` });
    } catch (error: any) {
      console.error('❌ [albunsApi.delete] Error:', error);
    }
  },
};

export const categoriasApi = {
  list: async (params?: { search?: string; page?: number; limit?: number; ativo?: number }) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const limit = params?.limit ?? 100;
      const page = params?.page ?? 1;

      const filters: Record<string, string> = {
        select: 'id,nome,slug,descricao,imagem_url,ativo,cor,meta_title,meta_description',
        order: 'nome.asc',
        limit: String(limit),
      };

      if (page > 1) {
        const offset = (page - 1) * limit;
        filters.offset = String(offset);
      }

      if (params?.search) {
        filters.nome = `ilike.%${params.search}%`;
      }

      if (params?.ativo != null) {
        filters.ativo = `eq.${params.ativo}`;
      }

      const rows = await supabaseFetch<any>('categorias', filters);
      return { data: rows, error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },
  getAll: async () => {
    const result = await categoriasApi.list();
    return result.data || [];
  },
  get: async (id: number | string) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const rows = await supabaseFetch<any>('categorias', {
        id: `eq.${id}`,
        select: 'id,nome,slug,descricao,imagem_url,ativo,cor,meta_title,meta_description',
        limit: '1',
      });
      return { data: rows.length > 0 ? rows[0] : null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
  getById: async (id: number | string) => {
    const result = await categoriasApi.get(id);
    return result.data;
  },
  create: async (data: any) => {
    const { supabaseInsert } = await import('./supabaseRest');
    try {
      const payload = {
        nome: data?.nome,
        slug: data?.slug,
        descricao: data?.descricao ?? null,
        imagem_url: data?.imagem_url ?? null,
        ativo: data?.ativo ?? 1,
        cor: data?.cor ?? null,
        meta_title: data?.meta_title ?? null,
        meta_description: data?.meta_description ?? null,
      };
      const result = await supabaseInsert<any>('categorias', payload);
      return { data: result ?? null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
  update: async (id: number | string, data: any) => {
    const { supabaseUpdate } = await import('./supabaseRest');
    try {
      console.log('🔄 [categoriasApi.update] ID:', id);
      console.log('📥 [categoriasApi.update] Data recebida:', data);
      
      const payload: any = {};
      if (data?.nome !== undefined) payload.nome = data.nome;
      if (data?.slug !== undefined) payload.slug = data.slug;
      if (data?.descricao !== undefined) payload.descricao = data.descricao;
      if (data?.imagem_url !== undefined) payload.imagem_url = data.imagem_url;
      if (data?.ativo !== undefined) payload.ativo = data.ativo;
      if (data?.cor !== undefined) payload.cor = data.cor;
      if (data?.meta_title !== undefined) payload.meta_title = data.meta_title;
      if (data?.meta_description !== undefined) payload.meta_description = data.meta_description;

      console.log('📦 [categoriasApi.update] Payload montado:', payload);

      const results = await supabaseUpdate<any>('categorias', { id: `eq.${id}` }, payload);
      
      console.log('✅ [categoriasApi.update] Resultado:', results);
      
      return { data: results.length > 0 ? results[0] : null, error: null };
    } catch (error: any) {
      console.error('❌ [categoriasApi.update] Erro:', error);
      return { data: null, error: error.message };
    }
  },
  delete: async (id: number | string) => {
    const { supabaseDelete } = await import('./supabaseRest');
    try {
      const success = await supabaseDelete('categorias', { id: `eq.${id}` });
      return { success, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

export const usuariosApi = {
  list: async (params?: { search?: string; page?: number; limit?: number }) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const limit = params?.limit || 20;
      const page = params?.page || 1;

      const filters: Record<string, string> = {
        select: 'id,email,name,avatar_url,is_admin,is_composer,is_blocked,status,plan,created_at',
        order: 'created_at.desc',
      };

      if (params?.search) {
        filters.or = `(name.ilike.%${params.search}%,email.ilike.%${params.search}%)`;
      }

      // Buscar total de registros (sem limit)
      const totalFilters = { ...filters };
      delete totalFilters.limit;
      delete totalFilters.offset;
      const allRows = await supabaseFetch<any>('users', totalFilters);
      const total = allRows.length;

      // Buscar página específica
      filters.limit = String(limit);
      if (page > 1) {
        const offset = (page - 1) * limit;
        filters.offset = String(offset);
      }

      const rows = await supabaseFetch<any>('users', filters);

      // Mapear campos para compatibilidade com a UI (português)
      const mapped = rows.map((r: any) => ({
        ...r,
        nome: r.name,
        tipo: r.is_admin ? 'admin' : r.is_composer ? 'compositor' : 'usuario',
        ativo: r.status !== 'inactive' && !r.is_blocked ? 1 : 0,
        plano: r.plan,
      }));

      return {
        data: {
          usuarios: mapped,
          total: total,
          pages: Math.ceil(total / limit)
        },
        error: null
      };
    } catch (error: any) {
      console.error('❌ [usuariosApi.list] Error:', error);
      return { data: { usuarios: [], total: 0, pages: 0 }, error: error.message };
    }
  },
  getAll: async () => {
    const result = await usuariosApi.list({ limit: 1000 });
    return result.data || [];
  },
  get: async (id: string | number) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      console.log('🔍 [usuariosApi.get] Fetching user ID:', id);
      const rows = await supabaseFetch<any>('users', {
        id: `eq.${id}`,
        select: '*',
        limit: '1'
      });
      if (rows.length > 0) {
        const r = rows[0];
        const mapped = {
          ...r,
          nome: r.name,
          tipo: r.is_admin ? 'admin' : r.is_composer ? 'compositor' : 'usuario',
          ativo: r.status !== 'inactive' && !r.is_blocked ? 1 : 0,
          plano: r.plan,
        };
        return { data: mapped, error: null };
      }
      return { data: null, error: 'Usuário não encontrado' };
    } catch (error: any) {
      console.error('❌ [usuariosApi.get] Error:', error);
      return { data: null, error: error.message };
    }
  },
  getById: async (id: string | number) => {
    const result = await usuariosApi.get(id);
    return result.data;
  },
  update: async (id: string | number, data: any) => {
    const { supabaseUpdate } = await import('./supabaseRest');
    try {
      // Mapear campos em português para inglês
      const updateData: any = {};
      if (data.nome !== undefined) updateData.name = data.nome;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
      if (data.tipo !== undefined) {
        updateData.is_admin = data.tipo === 'admin';
        updateData.is_composer = data.tipo === 'compositor';
      }
      if (data.is_admin !== undefined) updateData.is_admin = data.is_admin;
      if (data.is_composer !== undefined) updateData.is_composer = data.is_composer;
      if (data.is_blocked !== undefined) updateData.is_blocked = data.is_blocked;
      if (data.ativo !== undefined) {
        updateData.is_blocked = data.ativo === 0 || data.ativo === false;
        updateData.status = (data.ativo === 1 || data.ativo === true) ? 'active' : 'inactive';
      }
      if (data.status !== undefined) updateData.status = data.status;
      if (data.plano !== undefined) updateData.plan = data.plano;
      if (data.plan !== undefined) updateData.plan = data.plan;

      const results = await supabaseUpdate<any>('users', { id: `eq.${id}` }, updateData);
      return { data: results.length > 0 ? results[0] : null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
  delete: async (id: string | number) => {
    const { supabase } = await import('./supabase-auth');
    try {
      console.log('🗑️ [usuariosApi.delete] Attempting to delete user ID:', id);

      // Try hard delete via Supabase JS client (uses admin's auth session)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.warn('⚠️ [usuariosApi.delete] Hard delete failed:', deleteError.message, '— trying soft delete...');

        // Fallback: soft delete (mark as deleted + blocked)
        const { error: updateError, data: updateData } = await supabase
          .from('users')
          .update({
            status: 'deleted',
            is_blocked: true,
          })
          .eq('id', id)
          .select('id');

        if (updateError) {
          throw new Error(`Não foi possível excluir o usuário: ${updateError.message}`);
        }
        if (!updateData || updateData.length === 0) {
          throw new Error('Usuário não encontrado ou sem permissão para excluir.');
        }

        console.log('✅ [usuariosApi.delete] Soft delete successful');
        return { success: true, error: null };
      }

      console.log('✅ [usuariosApi.delete] Hard delete successful');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('❌ [usuariosApi.delete] Error:', error);
      return { success: false, error: error.message || 'Erro ao excluir usuário' };
    }
  },
};

export const bannersApi = {
  getAll: async () => [],
  getById: async () => null,
  create: async () => ({}),
  update: async () => ({}),
  delete: async () => { },
};

export const documentReviewsApi = {
  getAll: async () => [],
  getById: async () => null,
  getByCompositor: async (compositorId: string | number) => {
    try {
      const { supabaseFetch } = await import('./supabaseRest');
      const rows = await supabaseFetch<any>('composer_documents', {
        composer_id: `eq.${compositorId}`,
        select: '*',
        order: 'created_at.desc',
      });
      // Map composer_documents columns to the shape DocumentReviewSection expects
      const mapped = (rows || []).map((row: any) => ({
        id: row.id,
        composer_id: row.composer_id,
        document_type: row.document_type || 'documento',
        document_number: row.document_number,
        expected_name: row.expected_name || '',
        extracted_name: row.extracted_name || '',
        image_path: row.document_image || row.image_path || '',
        status: row.status || 'pending',
        admin_notes: row.admin_notes || '',
        reviewed_by: row.reviewed_by || null,
        reviewed_at: row.reviewed_at || null,
        created_at: row.created_at || new Date().toISOString(),
      }));
      return { data: { documents: mapped }, error: null };
    } catch (error: any) {
      console.warn('[documentReviewsApi.getByCompositor] Error:', error?.message);
      return { data: { documents: [] }, error: error?.message };
    }
  },
  review: async (documentId: number | string, data: { status: string; admin_notes?: string; reviewed_by?: string }) => {
    try {
      const { supabaseUpdate } = await import('./supabaseRest');
      const result = await supabaseUpdate('composer_documents', { id: `eq.${documentId}` }, {
        status: data.status,
        admin_notes: data.admin_notes || null,
        reviewed_by: data.reviewed_by || null,
        reviewed_at: new Date().toISOString(),
      });
      return { data: result, error: null };
    } catch (error: any) {
      console.error('[documentReviewsApi.review] Error:', error?.message);
      return { data: null, error: error?.message || 'Erro ao revisar documento' };
    }
  },
  create: async () => ({}),
  update: async () => ({}),
};

export const compositorGerentesApi = {
  buscarUsuario: async (email: string) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const rows = await supabaseFetch<any>('users', { email: `eq.${email}`, limit: '1' });
      return { data: rows.length > 0 ? rows[0] : null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
  convidar: async (data: { compositor_id: number; email_gerente: string; notas?: string }) => {
    const { supabaseInsert } = await import('./supabaseRest');
    try {
      // Registrar convite na tabela de atividades ou similar
      await supabaseInsert('atividades', {
        tipo: 'invite_manager',
        data: { ...data, status: 'pending' },
        created_at: new Date().toISOString()
      });
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },
  getAll: async () => [],
  getById: async () => null,
  create: async () => ({}),
  delete: async () => { },
};

export const uploadApi = {
  uploadFile: async (file: File, type: 'hinos' | 'albuns' | 'avatars' | 'covers' | 'banners') => {
    const { uploadFile } = await import('./supabase-upload');
    const url = await uploadFile(file, type);
    return { url, fileName: file.name };
  },
  uploadAudio: async (file: File) => {
    const { uploadAudio } = await import('./supabase-upload');
    const { url, duration } = await uploadAudio(file);
    return { url, fileName: file.name, duration };
  },
  uploadCover: async (file: File) => {
    const { uploadCover } = await import('./supabase-upload');
    const url = await uploadCover(file, 'covers');
    return { url, fileName: file.name };
  },
  uploadAvatar: async (file: File) => {
    const { uploadAvatar } = await import('./supabase-upload');
    const url = await uploadAvatar(file);
    return { url, fileName: file.name };
  },
  avatar: async (file: File) => {
    try {
      const { uploadAvatar } = await import('./supabase-upload');
      const url = await uploadAvatar(file);
      return { data: { url, fileName: file.name }, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
};

export const playlistsApi = {
  getAll: async () => [],
  getById: async () => null,
  create: async () => ({}),
  update: async () => ({}),
  delete: async () => { },
  addHino: async () => ({}),
  removeHino: async () => { },
};

export const favoritosApi = {
  getAll: async () => [],
  add: async () => ({}),
  remove: async () => { },
  check: async () => false,
};

export const historicoApi = {
  getAll: async () => [],
  add: async () => ({}),
};

export const notificacoesApi = {
  getAll: async () => [],
  markAsRead: async () => ({}),
  delete: async () => { },
};

export interface Usuario {
  id: number;
  auth_id?: string;
  nome: string;
  email: string;
  avatar_url?: string;
  tipo: 'usuario' | 'compositor' | 'admin';
  ativo: number;
  plano?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Compositor {
  id: string | number;
  nome: string;
  nome_artistico?: string;
  biografia?: string;
  verificado?: boolean;
  ativo?: boolean;
  email?: string;
  avatar_url?: string;
  photo_url?: string;
  bio?: string;
  slug?: string;
  category?: string;
  is_approved?: boolean;
  is_featured?: boolean;
  is_trending?: boolean;
  followers_count?: number;
  // Campos originais da tabela composers (inglês)
  name?: string;
  artistic_name?: string;
  biography?: string;
  verified?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentReview {
  id: number;
  composer_id: string | number;
  document_type: string;
  document_number?: string;
  expected_name?: string;
  extracted_name?: string;
  image_path: string;
  status: string;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
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
