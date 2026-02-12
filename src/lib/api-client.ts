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
  list: async (params?: { compositor?: string; search?: string; ativo?: number; limit?: number }) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const filters: Record<string, string> = {
        select: 'id,numero,titulo,compositor_nome,compositor_id,categoria,cover_url,audio_url,duracao,status,ativo,created_at',
        order: 'created_at.desc',
      };

      if (params?.search) {
        filters.or = `(titulo.ilike.%${params.search}%,compositor_nome.ilike.%${params.search}%)`;
      } else if (params?.compositor) {
        filters.compositor_nome = `ilike.%${params.compositor}%`;
      }
      if (params?.ativo !== undefined) {
        filters.ativo = `eq.${params.ativo}`;
      }
      if (params?.limit) {
        filters.limit = String(params.limit);
      }

      const rows = await supabaseFetch<any>('hinos', filters);
      const mapped = (rows || []).map((h: any) => ({
        ...h,
        compositor: h.compositor_nome || h.compositor || '',
      }));
      return { data: mapped, error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },
  listPending: async () => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const filters: Record<string, string> = {
        select: 'id,numero,titulo,compositor_nome,compositor_id,categoria,cover_url,audio_url,duracao,status,ativo,created_at',
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
            select: 'categoria_id',
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
      
      console.log('📀 [hinosApi.create] Inserting:', hinoData);
      const result = await supabaseInsert('hinos', hinoData);
      console.log('📀 [hinosApi.create] Result:', result);
      
      if (result && (result as any).id && data.categorias && data.categorias.length > 0) {
        // Inserir relacionamentos com categorias
        const hinoId = (result as any).id;
        
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
    try {
      const { supabase } = await import('./supabase-auth');
      // Atualizar hino
      const updateData: Record<string, any> = {
        titulo: data.titulo,
      };
      const resolvedCategoria = data.categorias?.[0] || data.categoria;
      if (resolvedCategoria !== undefined) updateData.categoria = resolvedCategoria;
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
      
      console.log('📀 [hinosApi.update] Updating hino', id, 'with:', updateData);
      const { data: result, error: updateError } = await supabase
        .from('hinos')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (updateError) {
        console.error('📀 [hinosApi.update] Supabase error:', updateError);
        return { data: null, error: updateError.message };
      }
      console.log('📀 [hinosApi.update] Success:', result);
      
      // Atualizar categorias se fornecidas
      if (data.categorias && Array.isArray(data.categorias)) {
        // Remover relacionamentos antigos
        await supabase.from('hino_categorias').delete().eq('hino_id', id);
        
        // Adicionar novos relacionamentos
        if (data.categorias.length > 0) {
          const { data: categorias } = await supabase
            .from('categorias')
            .select('id,nome')
            .in('nome', data.categorias);
          
          if (categorias) {
            for (const cat of categorias) {
              await supabase.from('hino_categorias').insert({
                hino_id: id,
                categoria_id: cat.id,
              });
            }
          }
        }
      }
      
      return { data: result, error: null };
    } catch (error: any) {
      console.error('Error updating hymn:', error);
      return { data: null, error: error?.message || String(error) || 'Erro desconhecido ao atualizar hino' };
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
        select: 'id,user_id,name,artistic_name,email,verified,status,avatar_url,photo_url,bio,slug,category,is_approved,is_featured,is_trending,followers_count,created_at,updated_at',
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
        usuario_id: r.user_id,
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
  getByUsuarioId: async (userId: string, userEmail?: string) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      // 1. Buscar por user_id (caminho principal)
      const rows = await supabaseFetch<any>('composers', {
        user_id: `eq.${userId}`,
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
            usuario_id: r.user_id,
          },
          error: null
        };
      }

      // 2. Fallback: buscar por email e auto-vincular user_id
      if (userEmail) {
        console.log('🔍 [getByUsuarioId] Não encontrado por user_id, tentando por email:', userEmail);
        const byEmail = await supabaseFetch<any>('composers', {
          email: `eq.${userEmail}`,
          select: '*',
          limit: '1'
        });
        if (byEmail.length > 0) {
          const r = byEmail[0];
          // Auto-vincular user_id para não precisar de fallback novamente
          try {
            const { supabaseUpdate } = await import('./supabaseRest');
            await supabaseUpdate('composers', { id: `eq.${r.id}` }, { user_id: userId });
            console.log('✅ [getByUsuarioId] Auto-vinculado user_id ao compositor:', r.id);
          } catch (linkErr) {
            console.warn('⚠️ [getByUsuarioId] Falha ao vincular user_id:', linkErr);
          }
          return {
            data: {
              ...r,
              nome: r.name,
              nome_artistico: r.artistic_name,
              biografia: r.biography || r.bio,
              verificado: r.verified,
              ativo: r.status !== 'inactive',
              usuario_id: userId,
            },
            error: null
          };
        }
      }

      return { data: null, error: 'Compositor não encontrado para este usuário' };
    } catch (error: any) {
      console.error('❌ [compositoresApi.getByUsuarioId] Error:', error);
      return { data: null, error: error.message };
    }
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

      // Campos com mapeamento pt → en
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

      // Mapeamento pt → en para campos do perfil
      if (data.telefone !== undefined) updateData.phone = data.telefone;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.localizacao !== undefined) updateData.location = data.localizacao;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.tipo_compositor !== undefined) updateData.category = data.tipo_compositor;
      if (data.endereco !== undefined) updateData.address = data.endereco;
      if (data.bairro !== undefined) updateData.district = data.bairro;
      if (data.cidade !== undefined) updateData.city = data.cidade;
      if (data.estado !== undefined) updateData.state = data.estado;
      if (data.numero !== undefined) updateData.address_number = data.numero;
      if (data.complemento !== undefined) updateData.address_complement = data.complemento;

      // Campos diretos (mesmo nome no banco)
      const directFields = [
        'avatar_url', 'photo_url', 'banner_url', 'email', 'website',
        'instagram', 'facebook', 'youtube', 'slug', 'metadata',
        'notif_email_followers', 'notif_email_comments', 'notif_email_analytics',
        'notif_push_new_followers', 'notif_push_milestones',
      ];
      for (const field of directFields) {
        if (data[field] !== undefined) updateData[field] = data[field];
      }

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
    const { supabaseFetch, supabaseUpdate } = await import('./supabaseRest');
    const { supabase } = await import('./supabase-auth');
    try {
      console.log('🔍 [compositoresApi.delete] Soft-deleting composer ID:', id);

      // 1. Buscar dados do compositor antes de desativar
      let composerEmail: string | null = null;
      let composerName: string | null = null;
      try {
        const rows = await supabaseFetch<any>('composers', {
          id: `eq.${id}`,
          select: 'email,name,artistic_name',
          limit: '1',
        });
        composerEmail = rows?.[0]?.email || null;
        composerName = rows?.[0]?.name || rows?.[0]?.artistic_name || null;
        console.log('📧 [compositoresApi.delete] Composer:', composerName, composerEmail);
      } catch (e) {
        console.warn('⚠️ [compositoresApi.delete] Could not fetch composer data:', e);
      }

      // 2. Soft-delete: marcar compositor como deletado (mantém registro para admin gerenciar conteúdo)
      await supabaseUpdate('composers', { id: `eq.${id}` }, {
        status: 'deleted',
        verified: false,
        updated_at: new Date().toISOString(),
      });
      console.log('✅ [compositoresApi.delete] Composer marked as deleted');

      // 3. Desativar todos os hinos do compositor
      try {
        await supabaseUpdate('hinos', { compositor_id: `eq.${id}` }, {
          ativo: false,
          updated_at: new Date().toISOString(),
        });
        console.log('✅ [compositoresApi.delete] Composer hinos deactivated');
      } catch (e) {
        console.warn('⚠️ [compositoresApi.delete] Could not deactivate hinos:', e);
      }

      // 4. Desativar álbuns do compositor
      try {
        await supabaseUpdate('albums', { artist_id: `eq.${id}` }, {
          is_published: false,
          updated_at: new Date().toISOString(),
        });
        console.log('✅ [compositoresApi.delete] Composer albums deactivated');
      } catch (e) {
        console.warn('⚠️ [compositoresApi.delete] Could not deactivate albums:', e);
      }

      // 5. Desativar o usuário associado
      if (composerEmail) {
        try {
          const { data: rpcResult, error: rpcError } = await supabase.rpc('admin_deactivate_user_by_email', {
            p_email: composerEmail,
          });
          if (!rpcError && rpcResult?.success) {
            console.log('✅ [compositoresApi.delete] User deactivated via RPC');
          } else {
            console.warn('⚠️ [compositoresApi.delete] RPC failed, trying direct update');
            const { error: updateError } = await supabase
              .from('users')
              .update({ is_composer: false, is_blocked: true, status: 'inactive' })
              .eq('email', composerEmail);
            if (updateError) {
              console.warn('⚠️ [compositoresApi.delete] Direct update also failed:', updateError.message);
            } else {
              console.log('✅ [compositoresApi.delete] User deactivated via direct update');
            }
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

  toggleActive: async (id: string | number, active: boolean) => {
    const { supabaseUpdate } = await import('./supabaseRest');
    try {
      const newStatus = active ? 'approved' : 'inactive';
      console.log(`🔄 [compositoresApi.toggleActive] Setting composer ${id} to ${newStatus}`);
      
      await supabaseUpdate('composers', { id: `eq.${id}` }, {
        status: newStatus,
        updated_at: new Date().toISOString(),
      });

      // Ativar/desativar hinos do compositor
      try {
        await supabaseUpdate('hinos', { compositor_id: `eq.${id}` }, {
          ativo: active,
          updated_at: new Date().toISOString(),
        });
        console.log(`✅ [compositoresApi.toggleActive] Hinos ${active ? 'activated' : 'deactivated'}`);
      } catch (e) {
        console.warn('⚠️ [compositoresApi.toggleActive] Could not toggle hinos:', e);
      }

      // Ativar/desativar álbuns do compositor
      try {
        await supabaseUpdate('albums', { artist_id: `eq.${id}` }, {
          is_published: active,
          updated_at: new Date().toISOString(),
        });
        console.log(`✅ [compositoresApi.toggleActive] Albums ${active ? 'activated' : 'deactivated'}`);
      } catch (e) {
        console.warn('⚠️ [compositoresApi.toggleActive] Could not toggle albums:', e);
      }

      console.log('✅ [compositoresApi.toggleActive] Done');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('❌ [compositoresApi.toggleActive] Error:', error);
      return { success: false, error: error.message };
    }
  },
};

export const albunsApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; compositor_id?: string }) => {
    try {
      const { supabase } = await import('./supabase-auth');
      const pageSize = params?.limit || 12;
      const page = params?.page || 1;

      let query = supabase
        .from('albums')
        .select('id,title,artist,description,cover_url,total_tracks,release_date,composer_id,created_at,updated_at', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (params?.search) {
        query = query.or(`title.ilike.%${params.search}%,artist.ilike.%${params.search}%`);
      }
      if (params?.compositor_id) {
        query = query.eq('composer_id', params.compositor_id);
      }

      query = query.range((page - 1) * pageSize, page * pageSize - 1);

      const { data: rows, error, count } = await query;
      if (error) {
        console.error('❌ [albunsApi.list] Error:', error);
        return { data: { albuns: [], data: [], total: 0, pages: 0 }, error: error.message };
      }

      const total = count ?? (rows?.length || 0);

      // Buscar contagem real de hinos por álbum
      const albumIds = (rows || []).map((r: any) => r.id);
      let trackCounts: Record<string, number> = {};
      if (albumIds.length > 0) {
        try {
          const { data: albumHinos } = await supabase
            .from('album_hinos')
            .select('album_id')
            .in('album_id', albumIds);
          for (const ah of (albumHinos || [])) {
            trackCounts[ah.album_id] = (trackCounts[ah.album_id] || 0) + 1;
          }
        } catch (e) {
          console.warn('[albunsApi.list] Erro ao contar hinos:', e);
        }
      }

      const enriched = (rows || []).map((r: any) => ({
        ...r,
        total_tracks: trackCounts[r.id] || r.total_tracks || 0,
      }));

      return {
        data: {
          albuns: enriched,
          data: enriched,
          total: total,
          pages: Math.ceil(total / pageSize)
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
        limit: '1'
      });
      const album = rows?.[0] || null;
      if (album) {
        (album as any).status = (album as any).is_published ? 'published' : 'draft';
      }
      return { data: album, error: null };
    } catch (error: any) {
      console.error('📀 [albunsApi.get] Error:', error);
      return { data: null, error: error.message };
    }
  },
  listHinos: async (albumId: number | string) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      // 1. Buscar relações album_hinos
      const albumHinos = await supabaseFetch<any>('album_hinos', {
        album_id: `eq.${albumId}`,
        select: 'hino_id,position',
        order: 'position.asc'
      });

      if (!albumHinos || albumHinos.length === 0) {
        return { data: { hinos: [] }, error: null };
      }

      // 2. Buscar dados dos hinos
      const hinoIds = albumHinos.map((ah: any) => ah.hino_id).filter(Boolean);
      const hinosRows = await supabaseFetch<any>('hinos', {
        id: `in.(${hinoIds.join(',')})`,
        select: 'id,titulo,numero,compositor_nome,compositor_id,categoria,duracao,audio_url,cover_url,letra,created_at,youtube_source'
      });

      // 3. Mapear por id para manter a ordem do album_hinos
      const hinosMap: Record<string, any> = {};
      for (const h of hinosRows) {
        hinosMap[h.id] = h;
      }

      const hinos = albumHinos
        .map((ah: any) => {
          const h = hinosMap[ah.hino_id];
          if (!h) return null;
          return {
            ...h,
            ordem: ah.position,
            compositor: h.compositor_nome || 'Compositor',
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
    try {
      const { supabase } = await import('./supabase-auth');
      const insertData: Record<string, any> = {
        title: data.titulo || data.title || '',
        description: data.descricao || data.description || '',
        cover_url: data.cover_url || '',
        artist: data.compositor || data.artist || '',
        is_published: data.is_published !== false,
        active: data.ativo !== 0,
      };

      // Campos opcionais importantes
      if (data.compositor_id) insertData.composer_id = data.compositor_id;
      if (data.ano) insertData.release_date = `${data.ano}-01-01`;
      if (data.release_date) insertData.release_date = data.release_date;

      console.log('📀 [albunsApi.create] Inserting:', insertData);
      const { data: result, error: insertError } = await supabase
        .from('albums')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ [albunsApi.create] Supabase error:', insertError);
        return { data: null, error: insertError.message };
      }
      console.log('✅ [albunsApi.create] Result:', result);
      return { data: result, error: null };
    } catch (error: any) {
      console.error('❌ [albunsApi.create] Error:', error);
      return { data: null, error: error.message };
    }
  },
  update: async (id: number | string, data: any) => {
    try {
      const { supabase } = await import('./supabase-auth');
      const updateData: any = {};
      if (data.titulo !== undefined) updateData.title = data.titulo;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.descricao !== undefined) updateData.description = data.descricao;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.cover_url !== undefined) updateData.cover_url = data.cover_url;
      if (data.artist !== undefined) updateData.artist = data.artist;
      if (data.genre !== undefined) updateData.genre = data.genre;
      if (data.is_published !== undefined) updateData.is_published = data.is_published;
      if (data.ativo !== undefined) updateData.active = data.ativo !== 0;
      if (data.ano !== undefined) updateData.release_date = `${data.ano}-01-01`;
      if (data.compositor_id !== undefined) updateData.composer_id = data.compositor_id;

      const { error } = await supabase.from('albums').update(updateData).eq('id', id);
      if (error) {
        console.error('❌ [albunsApi.update] Error:', error);
        return { data: null, error: error.message };
      }
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
  addHinos: async (albumId: string | number, hinoIds: (string | number)[]) => {
    try {
      const { supabase } = await import('./supabase-auth');
      // Limpar hinos existentes do álbum antes de re-inserir
      await supabase.from('album_hinos').delete().eq('album_id', albumId);

      console.log(`📀 [albunsApi.addHinos] Adicionando ${hinoIds.length} hinos ao álbum ${albumId}`);
      const rows = hinoIds.map((hinoId, i) => ({
        album_id: albumId,
        hino_id: hinoId,
        position: i + 1,
        track_number: i + 1,
      }));
      const { error } = await supabase.from('album_hinos').insert(rows);
      if (error) {
        console.error('❌ [albunsApi.addHinos] Error:', error);
        return { data: null, error: error.message };
      }
      console.log('✅ [albunsApi.addHinos] Hinos salvos com sucesso');
      return { data: true, error: null };
    } catch (error: any) {
      console.error('❌ [albunsApi.addHinos] Error:', error);
      return { data: null, error: error.message };
    }
  },
  updateOrdem: async (albumId: string | number, ordem: Array<{ hino_id: string | number; ordem: number }>) => {
    try {
      const { supabase } = await import('./supabase-auth');
      for (const item of ordem) {
        await supabase
          .from('album_hinos')
          .update({ position: item.ordem })
          .eq('album_id', albumId)
          .eq('hino_id', item.hino_id);
      }
      return { data: true, error: null };
    } catch (error: any) {
      console.error('❌ [albunsApi.updateOrdem] Error:', error);
      return { data: null, error: error.message };
    }
  },
  removeHino: async (albumId: string | number, hinoId: string | number) => {
    try {
      const { supabase } = await import('./supabase-auth');
      const { error } = await supabase
        .from('album_hinos')
        .delete()
        .eq('album_id', albumId)
        .eq('hino_id', hinoId);
      if (error) {
        console.error('❌ [albunsApi.removeHino] Error:', error);
        return { data: null, error: error.message };
      }
      return { data: true, error: null };
    } catch (error: any) {
      console.error('❌ [albunsApi.removeHino] Error:', error);
      return { data: null, error: error.message };
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
    const { supabase, getCurrentUser } = await import('./supabase-auth');
    const { supabaseAuthUpdate } = await import('./supabaseRest');
    try {
      console.log('🗑️ [usuariosApi.delete] Target user ID:', id);

      // Verificar sessão Supabase (pode ser null se login foi via fallback)
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      const localUser = getCurrentUser();
      console.log('🔑 [usuariosApi.delete] Session:', session?.user?.email || 'SEM SESSÃO JWT');
      console.log('🔑 [usuariosApi.delete] LocalUser:', localUser?.email || 'SEM LOCAL USER');

      if (!session && !localUser) {
        throw new Error('Você não está autenticado. Faça login novamente.');
      }

      // Se não tem sessão JWT, tentar re-autenticar silenciosamente
      if (!session) {
        console.warn('⚠️ Sem sessão JWT. Login foi via fallback (localStorage). Tentando estratégias sem JWT...');
      }

      // Estratégia 1: RPC admin_delete_user (requer sessão JWT)
      if (session) {
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('admin_delete_user', {
            p_target_user_id: id,
          });
          console.log('📡 [RPC] data:', JSON.stringify(rpcData), 'error:', JSON.stringify(rpcError));
          if (!rpcError && rpcData?.success) {
            console.log('✅ Deleted via RPC');
            return { success: true, error: null };
          }
          if (!rpcError && rpcData && !rpcData.success) {
            throw new Error(`RPC: ${rpcData.error}`);
          }
          if (rpcError) console.warn('⚠️ RPC error:', rpcError.message, rpcError.code);
        } catch (rpcEx: any) {
          if (rpcEx.message?.startsWith('RPC:')) throw rpcEx;
          console.warn('⚠️ RPC not available:', rpcEx.message);
        }
      }

      // Estratégia 2: REST API autenticado com JWT do admin
      if (session) {
        try {
          const result = await supabaseAuthUpdate<any>('users', { id: `eq.${id}` }, {
            is_blocked: true,
            status: 'inactive',
          });
          console.log('📡 [AuthREST] result:', result);
          if (result && result.length > 0) {
            console.log('✅ Soft deleted via authenticated REST');
            return { success: true, error: null };
          }
          console.warn('⚠️ Auth REST: 0 rows affected');
        } catch (restEx: any) {
          console.warn('⚠️ Auth REST failed:', restEx.message);
        }
      }

      // Estratégia 3: Supabase JS client (funciona se há sessão JWT ativa)
      if (session) {
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({ is_blocked: true, status: 'inactive' })
          .eq('id', id)
          .select('id');

        console.log('📡 [Supabase JS] data:', updateData, 'error:', updateError);

        if (!updateError && updateData && updateData.length > 0) {
          console.log('✅ Soft deleted via Supabase JS');
          return { success: true, error: null };
        }
      }

      // Estratégia 4: RPC noauth (funciona SEM JWT - usa email do admin como verificação)
      {
        const adminEmail = localUser?.email || session?.user?.email;
        console.log('📡 [RPC noauth] Tentando com email:', adminEmail, 'userId:', id);
        if (adminEmail) {
          try {
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
            const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/admin_delete_user_noauth`;
            console.log('📡 [RPC noauth] URL:', rpcUrl);
            const rpcResponse = await fetch(rpcUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                p_target_user_id: id,
                p_admin_email: adminEmail,
              }),
            });
            const rawText = await rpcResponse.text();
            console.log('📡 [RPC noauth] HTTP status:', rpcResponse.status, 'raw:', rawText);
            let rpcResult: any;
            try { rpcResult = JSON.parse(rawText); } catch { rpcResult = rawText; }
            if (typeof rpcResult === 'object' && rpcResult?.success) {
              console.log('✅ Deleted via RPC noauth (sem JWT)');
              return { success: true, error: null };
            }
            if (typeof rpcResult === 'object' && rpcResult?.error) {
              console.warn('⚠️ RPC noauth error:', rpcResult.error);
            }
            // Se HTTP 404, a função não existe no banco
            if (rpcResponse.status === 404) {
              console.error('❌ Função admin_delete_user_noauth NÃO EXISTE no Supabase. Execute FIX_DELETE_SEM_JWT.sql no SQL Editor.');
            }
          } catch (noauthEx: any) {
            console.warn('⚠️ RPC noauth exception:', noauthEx.message);
          }
        } else {
          console.warn('⚠️ [RPC noauth] Sem email do admin disponível');
        }
      }

      // Estratégia 5: REST com anon key (última tentativa)
      try {
        const { supabaseUpdate } = await import('./supabaseRest');
        const result = await supabaseUpdate<any>('users', { id: `eq.${id}` }, {
          is_blocked: true,
          status: 'inactive',
        });
        console.log('📡 [REST anon] result:', result);
        if (result && result.length > 0) {
          console.log('✅ Soft deleted via REST anon');
          return { success: true, error: null };
        }
      } catch (anonEx: any) {
        console.warn('⚠️ REST anon failed:', anonEx.message);
      }

      // Diagnóstico final
      throw new Error(
        'Não foi possível excluir o usuário. Execute o SQL FIX_DELETE_SEM_JWT.sql no Supabase SQL Editor e tente novamente.'
      );
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
  listarCompositores: async (userId: string | number) => {
    const { supabaseFetch } = await import('./supabaseRest');
    try {
      const rows = await supabaseFetch<any>('compositor_gerentes', {
        gerente_id: `eq.${userId}`,
        select: '*',
      });
      return { data: rows || [], error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },
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
  cover: async (file: File) => {
    try {
      const { uploadCover } = await import('./supabase-upload');
      const url = await uploadCover(file, 'covers');
      return { data: { url, fileName: file.name }, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
  audio: async (file: File) => {
    try {
      const { uploadAudio } = await import('./supabase-upload');
      const { url, duration } = await uploadAudio(file);
      return { data: { url, fileName: file.name, duration }, error: null };
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
