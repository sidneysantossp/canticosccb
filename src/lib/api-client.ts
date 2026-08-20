/**
 * API Client - Compatibilidade
 * Re-exporta funções do Supabase para manter compatibilidade
 */
import { getCurrentUser, supabase } from './supabase-auth';
import {
  supabaseAuthDelete,
  supabaseAuthFetch,
  supabaseAuthInsert,
  supabaseAuthUpdate,
  supabaseDelete,
  supabaseFetch,
  supabaseInsert,
  supabaseUpdate,
} from './supabaseRest';

export * from './supabase-api';
export { default } from './supabase-api';

// Re-export funções de upload
export { uploadFile, uploadAudio, uploadCover, uploadAvatar } from './supabase-upload';

// ==================== STUBS PARA COMPATIBILIDADE ====================
// Estas funções retornam dados vazios para não quebrar imports existentes

async function resolveHinoCategoriasByName(categorias: string[]): Promise<Array<{ id: string; nome: string }>> {
  const names = Array.from(
    new Set(
      (categorias || [])
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )
  );

  if (names.length === 0) {
    return [];
  }

  const rows = await supabaseFetch<any>('categorias', {
    select: 'id,nome',
    limit: '1000',
  });

  return rows.filter((categoria: any) => names.includes(String(categoria.nome || '').trim()));
}

export const hinosApi = {
  list: async (params?: { compositor?: string; search?: string; ativo?: number; limit?: number }) => {

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

    try {
      const filters: Record<string, string> = {
        select: 'id,numero,titulo,compositor_nome,compositor_id,categoria,cover_url,audio_url,duracao,status,ativo,created_at',
        status: 'eq.draft',
        order: 'created_at.desc',
      };

      const rows = await supabaseFetch<any>('hinos', filters);
      return { data: rows, error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },
  getAll: async () => {

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

    try {
      const requestedStatus = String(data.status || '').toLowerCase();
      const resolvedStatus = requestedStatus === 'pending'
        ? 'draft'
        : (requestedStatus === 'draft' || requestedStatus === 'published' || requestedStatus === 'archived')
          ? requestedStatus
          : (data.ativo === 1 ? 'published' : 'draft');
      // Inserir hino sem categorias primeiro
      const hinoData: Record<string, any> = {
        titulo: data.titulo,
        categoria: data.categorias?.[0] || data.categoria || '',
        status: resolvedStatus,
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
      
      if (result && (result as any).id && data.categorias && data.categorias.length > 0) {
        // Inserir relacionamentos com categorias
        const hinoId = (result as any).id;
        const categorias = await resolveHinoCategoriasByName(data.categorias);
        
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
      const updateData: Record<string, any> = {};

      if (data.titulo !== undefined) updateData.titulo = String(data.titulo || '').trim();
      const resolvedCategoria = data.categorias?.[0] || data.categoria;
      if (resolvedCategoria !== undefined) updateData.categoria = resolvedCategoria || '';
      if (data.numero !== undefined) {
        updateData.numero = data.numero === null || data.numero === '' || Number(data.numero) === 0
          ? null
          : Number(data.numero);
      }
      if (data.compositor !== undefined || data.compositor_nome !== undefined) {
        const resolvedComposer = data.compositor_nome ?? data.compositor;
        updateData.compositor_nome = String(resolvedComposer || '').trim() || null;
      }
      if (data.compositor_id !== undefined) updateData.compositor_id = data.compositor_id || null;
      if (data.cover_url !== undefined) updateData.cover_url = data.cover_url || null;
      if (data.audio_url !== undefined) updateData.audio_url = data.audio_url || null;
      if (data.duracao !== undefined) updateData.duracao = data.duracao || null;
      if (data.letra !== undefined) updateData.letra = data.letra || null;
      if (data.ativo !== undefined) updateData.ativo = data.ativo;
      if (data.status !== undefined) {
        const requestedStatus = String(data.status || '').toLowerCase();
        updateData.status = requestedStatus === 'pending'
          ? 'draft'
          : (requestedStatus === 'draft' || requestedStatus === 'published' || requestedStatus === 'archived')
            ? requestedStatus
            : 'draft';
      } else if (data.ativo !== undefined) {
        updateData.status = data.ativo === 1 || data.ativo === true ? 'published' : 'draft';
      }
      if (data.youtube_source !== undefined) updateData.youtube_source = data.youtube_source || null;
      if (data.participacao_especial !== undefined) {
        updateData.participacao_especial = String(data.participacao_especial || '').trim() || null;
      }
      
      const result = await supabaseUpdate<any>('hinos', { id: `eq.${id}` }, updateData);

      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('Nenhum registro foi atualizado. Verifique permissões ou se o hino ainda existe.');
      }

      // Atualizar categorias se fornecidas
      if (data.categorias && Array.isArray(data.categorias)) {
        // Remover relacionamentos antigos
        const deleted = await supabaseDelete('hino_categorias', { hino_id: `eq.${id}` });
        if (!deleted) {
          throw new Error('Nao foi possivel atualizar as categorias do hino.');
        }
        
        // Adicionar novos relacionamentos
        if (data.categorias.length > 0) {
          const categorias = await resolveHinoCategoriasByName(data.categorias);
          
          for (const cat of categorias) {
            await supabaseInsert('hino_categorias', {
              hino_id: id,
              categoria_id: cat.id,
            });
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

    try {
      await supabaseDelete('hinos', { id: `eq.${id}` });
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error deleting hymn:', error);
      return { success: false, error: error.message };
    }
  },
  approve: async (id: string | number) => hinosApi.update(id, { status: 'published', ativo: true }),
  reject: async (id: string | number, reason?: string) => hinosApi.update(id, { status: 'rejected', rejection_reason: reason || null, ativo: false }),
};

export const compositoresApi = {
  list: async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {

    try {
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

    try {
      // 1. Buscar por user_id (caminho principal)
      const rows = await supabaseFetch<any>('composers', {
        user_id: `eq.${userId}`,
        select: '*',
        limit: '1'
      }).catch((error) => {
        console.warn('⚠️ [getByUsuarioId] Consulta por user_id indisponível; tentando e-mail:', error);
        return [] as any[];
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
        const normalizedEmail = String(userEmail).trim().toLowerCase();
        const byEmail = await supabaseFetch<any>('composers', {
          email: `ilike.${normalizedEmail}`,
          select: '*',
          limit: '1'
        }).catch((error) => {
          console.warn('⚠️ [getByUsuarioId] Consulta por e-mail indisponível:', error);
          return [] as any[];
        });
        if (byEmail.length > 0) {
          const r = byEmail[0];
          // Auto-vincular em segundo plano: a resolução do perfil não pode ficar
          // bloqueada por uma escrita protegida ou por uma instabilidade de rede.
          void supabaseUpdate('composers', { id: `eq.${r.id}` }, { user_id: userId })
            .catch((linkErr) => {
              console.warn('⚠️ [getByUsuarioId] Falha ao vincular user_id:', linkErr);
            });
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
      await supabaseInsert('composers', composerData);
      return { success: true, error: null };
    } catch (error: any) {
      console.error('❌ [compositoresApi.create] Error:', error);
      return { success: false, error: error.message };
    }
  },
  update: async (id: string | number, data: any) => {

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

      await supabaseUpdate('composers', { id: `eq.${id}` }, updateData);
      return { success: true, error: null };
    } catch (error: any) {
      console.error('❌ [compositoresApi.update] Error:', error);
      return { success: false, error: error.message };
    }
  },
  delete: async (id: string | number) => {

    try {
      // 1. Buscar dados do compositor antes de desativar
      let composerEmail: string | null = null;
      try {
        const rows = await supabaseFetch<any>('composers', {
          id: `eq.${id}`,
          select: 'email,name,artistic_name',
          limit: '1',
        });
        composerEmail = rows?.[0]?.email || null;
      } catch (e) {
        console.warn('⚠️ [compositoresApi.delete] Could not fetch composer data:', e);
      }

      // 2. Soft-delete: marcar compositor como deletado (mantém registro para admin gerenciar conteúdo)
      await supabaseUpdate('composers', { id: `eq.${id}` }, {
        status: 'deleted',
        verified: false,
        updated_at: new Date().toISOString(),
      });
      // 3. Desativar todos os hinos do compositor
      try {
        await supabaseUpdate('hinos', { compositor_id: `eq.${id}` }, {
          ativo: false,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('⚠️ [compositoresApi.delete] Could not deactivate hinos:', e);
      }

      // 4. Desativar álbuns do compositor
      try {
        await supabaseUpdate('albums', { artist_id: `eq.${id}` }, {
          is_published: false,
          updated_at: new Date().toISOString(),
        });
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
            // no-op
          } else {
            console.warn('⚠️ [compositoresApi.delete] RPC failed, trying direct update');
            const { error: updateError } = await supabase
              .from('users')
              .update({ is_composer: false, is_blocked: true, status: 'inactive' })
              .eq('email', composerEmail);
            if (updateError) {
              console.warn('⚠️ [compositoresApi.delete] Direct update also failed:', updateError.message);
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

    try {
      const newStatus = active ? 'approved' : 'inactive';
      
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
      } catch (e) {
        console.warn('⚠️ [compositoresApi.toggleActive] Could not toggle hinos:', e);
      }

      // Ativar/desativar álbuns do compositor
      try {
        await supabaseUpdate('albums', { artist_id: `eq.${id}` }, {
          is_published: active,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('⚠️ [compositoresApi.toggleActive] Could not toggle albums:', e);
      }
      return { success: true, error: null };
    } catch (error: any) {
      console.error('❌ [compositoresApi.toggleActive] Error:', error);
      return { success: false, error: error.message };
    }
  },
};

type AlbumsTypeFieldMode = 'type' | 'tipo' | 'none';

let albumsTypeFieldMode: AlbumsTypeFieldMode | null = null;

function isMissingAlbumsTypeFieldError(error: unknown): boolean {
  const message = String((error as any)?.message || error || '').toLowerCase();
  return (
    message.includes('column albums.tipo does not exist') ||
    message.includes('column "tipo" does not exist') ||
    message.includes('column albums.type does not exist') ||
    message.includes('column "type" does not exist')
  );
}

function getAlbumsTypeFieldModes(): AlbumsTypeFieldMode[] {
  const fallbackModes: AlbumsTypeFieldMode[] = ['type', 'tipo', 'none'];
  if (!albumsTypeFieldMode) {
    return fallbackModes;
  }

  return [albumsTypeFieldMode, ...fallbackModes.filter((mode) => mode !== albumsTypeFieldMode)];
}

function inferAlbumTipo(album: any): 'album' | 'coletanea' {
  const explicitTipo = String(album?.tipo || album?.type || '').trim().toLowerCase();
  if (explicitTipo === 'coletanea') {
    return 'coletanea';
  }
  if (explicitTipo === 'album') {
    return 'album';
  }

  const artist = String(album?.artist || '').trim();
  const composerId = String(album?.composer_id || album?.compositor_id || '').trim();
  return !artist && !composerId ? 'coletanea' : 'album';
}

function mapAlbumForCompatibility(album: any) {
  return {
    ...album,
    titulo: album.title || album.titulo || '',
    descricao: album.description || album.descricao || '',
    ativo: album.active === false ? 0 : 1,
    status: album.is_published === false ? 'draft' : 'published',
    tipo: inferAlbumTipo(album),
  };
}

function applyAlbumTipoFilterLocally(rows: any[], tipo?: string) {
  if (!tipo) {
    return rows;
  }

  return rows.filter((row) => inferAlbumTipo(row) === tipo);
}

export const albunsApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; compositor_id?: string; usuario_id?: string; tipo?: string }) => {
    try {
      const pageSize = params?.limit || 12;
      const page = params?.page || 1;
      const filters: Record<string, string> = {
        select: '*',
        order: 'created_at.desc',
      };

      if (params?.search) {
        filters.or = `(title.ilike.%${params.search}%,artist.ilike.%${params.search}%)`;
      }
      if (params?.compositor_id) {
        filters.composer_id = `eq.${params.compositor_id}`;
      }

      const rawRows = await supabaseFetch<any>('albums', filters);
      const publishedRows = (rawRows || []).filter((row: any) => row.is_published !== false && row.active !== false);
      const compatibleRows = applyAlbumTipoFilterLocally(publishedRows, params?.tipo);
      const total = compatibleRows.length;
      const rows = compatibleRows.slice((page - 1) * pageSize, page * pageSize);

      // Buscar contagem real de hinos por álbum
      const albumIds = rows.map((r: any) => r.id);
      const trackCounts: Record<string, number> = {};
      if (albumIds.length > 0) {
        try {
          const albumHinos = await supabaseFetch<any>('album_hinos', {
            select: 'album_id',
            album_id: `in.(${albumIds.join(',')})`,
          });
          for (const ah of (albumHinos || [])) {
            trackCounts[ah.album_id] = (trackCounts[ah.album_id] || 0) + 1;
          }
        } catch (e) {
          console.warn('[albunsApi.list] Erro ao contar hinos:', e);
        }
      }

      const enriched = rows.map((r: any) => mapAlbumForCompatibility({
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

    try {
      const baseParams = {
        id: `eq.${id}`,
        limit: '1'
      };
      const fetchAlbumById = (typeFieldMode: AlbumsTypeFieldMode) => supabaseFetch<any>('albums', {
        ...baseParams,
        select: typeFieldMode !== 'none'
          ? `id,title,artist,description,cover_url,total_tracks,release_date,composer_id,is_published,active,created_at,updated_at,featured,featured_order,genre,${typeFieldMode}`
          : 'id,title,artist,description,cover_url,total_tracks,release_date,composer_id,is_published,active,created_at,updated_at,featured,featured_order,genre',
      });

      let rows = null as any[] | null;
      for (const typeFieldMode of getAlbumsTypeFieldModes()) {
        try {
          rows = await fetchAlbumById(typeFieldMode);
          albumsTypeFieldMode = typeFieldMode;
          break;
        } catch (error: any) {
          if (typeFieldMode !== 'none' && isMissingAlbumsTypeFieldError(error)) {
            continue;
          }
          throw error;
        }
      }

      const album = rows?.[0] ? mapAlbumForCompatibility(rows[0]) : null;
      return { data: album, error: null };
    } catch (error: any) {
      console.error('📀 [albunsApi.get] Error:', error);
      return { data: null, error: error.message };
    }
  },
  listHinos: async (albumId: number | string) => {

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
  getAll: async () => {
    const result = await albunsApi.list({ limit: 1000 });
    return result.data?.albuns || [];
  },
  getById: async (id: number | string) => {
    const result = await albunsApi.get(id);
    return result.data;
  },
  create: async (data: any) => {
    try {

      const insertData: Record<string, any> = {
        title: data.titulo || data.title || '',
        description: data.descricao || data.description || '',
        cover_url: data.cover_url || '',
        artist: data.compositor || data.artist || '',
        is_published: data.is_published !== false,
        active: data.ativo !== 0,
      };

      // Campos opcionais importantes
      if (data.genre) insertData.genre = data.genre;
      if (data.compositor_id) insertData.composer_id = data.compositor_id;
      if (data.ano) insertData.release_date = `${data.ano}-01-01`;
      if (data.release_date) insertData.release_date = data.release_date;
      if (data.featured !== undefined) insertData.featured = data.featured;
      if (data.featured_order !== undefined) insertData.featured_order = data.featured_order;

      let result = null as any[] | null;
      for (const typeFieldMode of getAlbumsTypeFieldModes()) {
        try {
          result = await supabaseAuthInsert<any>('albums', {
            ...insertData,
            ...(typeFieldMode !== 'none' && data.tipo ? { [typeFieldMode]: data.tipo } : {}),
          });
          albumsTypeFieldMode = typeFieldMode;
          break;
        } catch (error: any) {
          if (typeFieldMode !== 'none' && isMissingAlbumsTypeFieldError(error)) {
            continue;
          }
          throw error;
        }
      }

      if (!result) {
        result = await supabaseAuthInsert<any>('albums', insertData);
        albumsTypeFieldMode = 'none';
      }

      if (!result || result.length === 0) {
        console.error('❌ [albunsApi.create] Insert returned empty - possibly blocked by RLS');
        return { data: null, error: 'Falha ao criar álbum. Verifique suas permissões.' };
      }
      return { data: mapAlbumForCompatibility(result[0]), error: null };
    } catch (error: any) {
      console.error('❌ [albunsApi.create] Error:', error);
      return { data: null, error: error.message };
    }
  },
  update: async (id: number | string, data: any) => {
    try {

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
      if (data.featured !== undefined) updateData.featured = data.featured;
      if (data.featured_order !== undefined) updateData.featured_order = data.featured_order;

      let result = null as any[] | null;
      for (const typeFieldMode of getAlbumsTypeFieldModes()) {
        try {
          result = await supabaseAuthUpdate<any>('albums', { id: `eq.${id}` }, {
            ...updateData,
            ...(typeFieldMode !== 'none' && data.tipo !== undefined ? { [typeFieldMode]: data.tipo } : {}),
          });
          albumsTypeFieldMode = typeFieldMode;
          break;
        } catch (error: any) {
          if (typeFieldMode !== 'none' && isMissingAlbumsTypeFieldError(error)) {
            continue;
          }
          throw error;
        }
      }

      if (!result) {
        result = await supabaseAuthUpdate<any>('albums', { id: `eq.${id}` }, updateData);
        albumsTypeFieldMode = 'none';
      }
      if (!result || result.length === 0) {
        console.warn('⚠️ [albunsApi.update] Nenhuma linha atualizada - verifique RLS policies ou se o ID existe');
        return { data: null, error: 'Nenhuma linha atualizada. Verifique se o álbum existe e se você tem permissão.' };
      }
      return { data: mapAlbumForCompatibility(result[0]), error: null };
    } catch (error: any) {
      console.error('❌ [albunsApi.update] Error:', error);
      return { data: null, error: error.message };
    }
  },
  delete: async (id: number | string) => {

    try {
      await supabaseAuthDelete('albums', { id: `eq.${id}` });
    } catch (error: any) {
      console.error('❌ [albunsApi.delete] Error:', error);
    }
  },
  addHinos: async (albumId: string | number, hinoIds: (string | number)[]) => {
    try {

      // Limpar hinos existentes do álbum antes de re-inserir
      try {
        await supabaseAuthDelete('album_hinos', { album_id: `eq.${albumId}` });
      } catch (e) {
        console.warn('⚠️ [albunsApi.addHinos] Erro ao limpar hinos existentes:', e);
      }

      const rows = hinoIds.map((hinoId, i) => ({
        album_id: albumId,
        hino_id: hinoId,
        position: i + 1,
        track_number: i + 1,
      }));
      await supabaseAuthInsert('album_hinos', rows);
      return { data: true, error: null };
    } catch (error: any) {
      console.error('❌ [albunsApi.addHinos] Error:', error);
      return { data: null, error: error.message };
    }
  },
  updateOrdem: async (albumId: string | number, ordem: Array<{ hino_id: string | number; ordem: number }>) => {
    try {

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

    try {
      const payload: any = {};
      if (data?.nome !== undefined) payload.nome = data.nome;
      if (data?.slug !== undefined) payload.slug = data.slug;
      if (data?.descricao !== undefined) payload.descricao = data.descricao;
      if (data?.imagem_url !== undefined) payload.imagem_url = data.imagem_url;
      if (data?.ativo !== undefined) payload.ativo = data.ativo;
      if (data?.cor !== undefined) payload.cor = data.cor;
      if (data?.meta_title !== undefined) payload.meta_title = data.meta_title;
      if (data?.meta_description !== undefined) payload.meta_description = data.meta_description;

      const results = await supabaseUpdate<any>('categorias', { id: `eq.${id}` }, payload);
      return { data: results.length > 0 ? results[0] : null, error: null };
    } catch (error: any) {
      console.error('❌ [categoriasApi.update] Erro:', error);
      return { data: null, error: error.message };
    }
  },
  delete: async (id: number | string) => {

    try {
      const success = await supabaseDelete('categorias', { id: `eq.${id}` });
      return { success, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

function normalizeUsersMetadata(value: unknown): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, any>) };
  }
  return {};
}

function toPreferenceInt(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === '') return fallback;
  return value === true || value === 1 || value === '1' ? 1 : 0;
}

function mapUserRowForUi(row: any) {
  const metadata = normalizeUsersMetadata(row?.metadata);

  return {
    ...row,
    metadata,
    nome: row?.name || '',
    telefone: row?.phone ?? metadata.telefone ?? '',
    localizacao: row?.location ?? metadata.localizacao ?? '',
    data_nascimento: row?.birthdate ?? metadata.data_nascimento ?? '',
    biografia: metadata.biografia ?? metadata.bio ?? metadata.biography ?? '',
    notificacoes_email: toPreferenceInt(metadata.notificacoes_email, 1),
    reproducao_automatica: toPreferenceInt(metadata.reproducao_automatica, 1),
    perfil_publico: toPreferenceInt(metadata.perfil_publico, 0),
    reproducao_sem_pausas: toPreferenceInt(metadata.reproducao_sem_pausas, 1),
    crossfade: toPreferenceInt(metadata.crossfade, 0),
    qualidade_audio: String(metadata.qualidade_audio ?? 'high'),
    qualidade_download: String(metadata.qualidade_download ?? 'high'),
    download_wifi_only: toPreferenceInt(metadata.download_wifi_only, 1),
    mostrar_hinos_indisponiveis: toPreferenceInt(metadata.mostrar_hinos_indisponiveis, 0),
    tipo: row?.is_admin ? 'admin' : row?.is_composer ? 'compositor' : 'usuario',
    ativo: row?.status !== 'inactive' && !row?.is_blocked ? 1 : 0,
    plano: row?.plan,
  };
}

type UsuariosListParams = {
  search?: string;
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
};

type UsuariosListPayload = {
  usuarios: ReturnType<typeof mapUserRowForUi>[];
  total: number;
  pages: number;
};

const USERS_LIST_RETRY_DELAYS_MS = [300, 900, 1800];
const USERS_LIST_CACHE_TTL_MS = 5 * 60 * 1000;
const usuariosListCache = new Map<string, { timestamp: number; payload: UsuariosListPayload }>();

function waitForRetry(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeUserSearchTerm(value?: string): string {
  return String(value || '')
    .trim()
    .replace(/[(),]/g, ' ')
    .replace(/\s+/g, ' ');
}

function normalizeUsersFilter(value?: string): string {
  return String(value || 'all').trim().toLowerCase();
}

function getUsersListCacheKey(params: UsuariosListParams, page: number, limit: number): string {
  return JSON.stringify({
    search: normalizeUserSearchTerm(params.search),
    role: normalizeUsersFilter(params.role),
    status: normalizeUsersFilter(params.status),
    page,
    limit,
  });
}

function isTransientUsersError(error: unknown): boolean {
  const message = String((error as any)?.message || error || '');
  return /503|service unavailable|upstream connect|failed to fetch|network|timeout|abort/i.test(message);
}

export const usuariosApi = {
  list: async (params?: UsuariosListParams) => {

    try {
      const limit = params?.limit || 20;
      const page = params?.page || 1;
      const cacheKey = getUsersListCacheKey(params || {}, page, limit);
      const cached = usuariosListCache.get(cacheKey);
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const fetchPage = async () => {
        let query = supabase
          .from('users')
          .select('id,email,name,avatar_url,phone,location,birthdate,metadata,is_admin,is_composer,is_blocked,status,plan,created_at', {
            count: 'exact',
          })
          .order('created_at', { ascending: false })
          .range(from, to);

        const search = normalizeUserSearchTerm(params?.search);
        if (search) {
          query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const role = normalizeUsersFilter(params?.role);
        if (role === 'admin' || role === 'admins') {
          query = query.eq('is_admin', true);
        } else if (role === 'composer' || role === 'compositor' || role === 'composers') {
          query = query.eq('is_composer', true);
        } else if (role === 'user' || role === 'users' || role === 'usuario' || role === 'usuarios') {
          query = query.not('is_admin', 'is', true).not('is_composer', 'is', true);
        }

        const status = normalizeUsersFilter(params?.status);
        if (status === 'blocked' || status === 'bloqueado' || status === 'bloqueados') {
          query = query.eq('is_blocked', true);
        } else if (status === 'active' || status === 'ativo' || status === 'ativos') {
          query = query.not('is_blocked', 'is', true);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        const usuarios = (data || []).map((r: any) => mapUserRowForUi(r));
        const total = count ?? usuarios.length;
        const payload = {
          usuarios,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        };

        usuariosListCache.set(cacheKey, { timestamp: Date.now(), payload });
        return payload;
      };

      let lastError: unknown = null;
      for (let attempt = 0; attempt < USERS_LIST_RETRY_DELAYS_MS.length; attempt += 1) {
        try {
          const payload = await fetchPage();
          return { data: payload, error: null };
        } catch (error) {
          lastError = error;
          if (!isTransientUsersError(error) || attempt === USERS_LIST_RETRY_DELAYS_MS.length - 1) {
            break;
          }
          await waitForRetry(USERS_LIST_RETRY_DELAYS_MS[attempt]);
        }
      }

      if (cached && Date.now() - cached.timestamp <= USERS_LIST_CACHE_TTL_MS && isTransientUsersError(lastError)) {
        console.warn('⚠️ [usuariosApi.list] Usando cache após falha transitória do Supabase:', lastError);
        return { data: cached.payload, error: null };
      }

      throw lastError;
    } catch (error: any) {
      console.error('❌ [usuariosApi.list] Error:', error);
      return { data: { usuarios: [], total: 0, pages: 0 }, error: error.message };
    }
  },
  getAll: async () => {
    const result = await usuariosApi.list({ limit: 1000 });
    return result.data?.usuarios || [];
  },
  get: async (id: string | number) => {

    try {
      const rows = await supabaseFetch<any>('users', {
        id: `eq.${id}`,
        select: '*',
        limit: '1'
      });
      if (rows.length > 0) {
        const mapped = mapUserRowForUi(rows[0]);
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

    try {
      const currentRows = await supabaseFetch<any>('users', {
        id: `eq.${id}`,
        select: 'id,metadata',
        limit: '1',
      });
      const currentMetadata = normalizeUsersMetadata(currentRows[0]?.metadata);

      // Mapear campos em português para inglês
      const updateData: any = {};
      const metadataUpdates: Record<string, any> = {};
      if (data.nome !== undefined) updateData.name = data.nome;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
      if (data.telefone !== undefined) updateData.phone = data.telefone;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.localizacao !== undefined) updateData.location = data.localizacao;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.data_nascimento !== undefined) updateData.birthdate = data.data_nascimento;
      if (data.birthdate !== undefined) updateData.birthdate = data.birthdate;
      if (data.username !== undefined) updateData.username = data.username;
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
      if (data.biografia !== undefined) metadataUpdates.biografia = data.biografia;
      if (data.bio !== undefined) metadataUpdates.biografia = data.bio;
      if (data.notificacoes_email !== undefined) metadataUpdates.notificacoes_email = toPreferenceInt(data.notificacoes_email, 0);
      if (data.reproducao_automatica !== undefined) metadataUpdates.reproducao_automatica = toPreferenceInt(data.reproducao_automatica, 0);
      if (data.perfil_publico !== undefined) metadataUpdates.perfil_publico = toPreferenceInt(data.perfil_publico, 0);
      if (data.reproducao_sem_pausas !== undefined) metadataUpdates.reproducao_sem_pausas = toPreferenceInt(data.reproducao_sem_pausas, 0);
      if (data.crossfade !== undefined) metadataUpdates.crossfade = toPreferenceInt(data.crossfade, 0);
      if (data.qualidade_audio !== undefined) metadataUpdates.qualidade_audio = data.qualidade_audio;
      if (data.qualidade_download !== undefined) metadataUpdates.qualidade_download = data.qualidade_download;
      if (data.download_wifi_only !== undefined) metadataUpdates.download_wifi_only = toPreferenceInt(data.download_wifi_only, 0);
      if (data.mostrar_hinos_indisponiveis !== undefined) metadataUpdates.mostrar_hinos_indisponiveis = toPreferenceInt(data.mostrar_hinos_indisponiveis, 0);
      if (data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)) {
        Object.assign(metadataUpdates, data.metadata);
      }

      if (Object.keys(metadataUpdates).length > 0) {
        updateData.metadata = {
          ...currentMetadata,
          ...metadataUpdates,
        };
      }

      const results = await supabaseUpdate<any>('users', { id: `eq.${id}` }, updateData);
      return { data: results.length > 0 ? results[0] : null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
  delete: async (id: string | number) => {
    try {
      // Verificar sessão Supabase (pode ser null se login foi via fallback)
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      const localUser = getCurrentUser();

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
          if (!rpcError && rpcData?.success) {
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
          if (result && result.length > 0) {
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

        if (!updateError && updateData && updateData.length > 0) {
          return { success: true, error: null };
        }
      }

      // Estratégia 4: RPC noauth (funciona SEM JWT - usa email do admin como verificação)
      {
        const adminEmail = localUser?.email || session?.user?.email;
        if (adminEmail) {
          try {
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
            const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/admin_delete_user_noauth`;
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
            let rpcResult: any;
            try { rpcResult = JSON.parse(rawText); } catch { rpcResult = rawText; }
            if (typeof rpcResult === 'object' && rpcResult?.success) {
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

        const result = await supabaseUpdate<any>('users', { id: `eq.${id}` }, {
          is_blocked: true,
          status: 'inactive',
        });
        if (result && result.length > 0) {
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

      const rows = await supabaseAuthFetch<any>('composer_documents', {
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
  review: async (documentId: number | string, data: { status: string; admin_notes?: string }) => {
    try {
      // A RPC atribui reviewed_by e reviewed_at com auth.uid() no banco. O
      // navegador informa apenas a decisão e a justificativa administrativa.
      const { data: result, error } = await supabase.rpc('review_composer_document', {
        p_document_id: String(documentId),
        p_status: data.status,
        p_admin_notes: data.admin_notes || null,
      });

      if (error) {
        throw error;
      }

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

    try {
      const managerRows = await supabaseFetch<any>('composer_managers', {
        manager_user_id: `eq.${userId}`,
        select: 'id,composer_id,manager_user_id,status,created_at,accepted_at',
        order: 'created_at.desc',
      });

      if (!managerRows || managerRows.length === 0) {
        return { data: [], error: null };
      }

      const composerIds = Array.from(
        new Set(
          managerRows
            .map((row: any) => row.composer_id)
            .filter(Boolean)
            .map((id: any) => String(id))
        )
      );

      let composersById: Record<string, any> = {};
      if (composerIds.length > 0) {
        const composers = await supabaseFetch<any>('composers', {
          id: `in.(${composerIds.join(',')})`,
          select: 'id,name,artistic_name,email,avatar_url,photo_url,bio,biography,status,verified',
        });

        composersById = (composers || []).reduce((acc: Record<string, any>, composer: any) => {
          acc[String(composer.id)] = composer;
          return acc;
        }, {});
      }

      const mappedStatus = (status: string) => {
        if (status === 'active') return 'ativo';
        if (status === 'pending') return 'pendente';
        if (status === 'rejected') return 'recusado';
        if (status === 'removed') return 'removido';
        return status || 'pendente';
      };

      const rows: CompositorGerente[] = managerRows.map((row: any) => {
        const composer = composersById[String(row.composer_id)] || {};
        return {
          id: row.id,
          compositor_id: String(row.composer_id),
          nome: composer.name || '',
          nome_artistico: composer.artistic_name || '',
          compositor_nome: composer.name || '',
          compositor_nome_artistico: composer.artistic_name || '',
          compositor_email: composer.email || '',
          email: composer.email || '',
          biografia: composer.biography || composer.bio || '',
          avatar_url: composer.avatar_url || composer.photo_url || '',
          status: mappedStatus(row.status),
          gerente_usuario_id: row.manager_user_id,
          convidado_em: row.created_at,
          aceito_em: row.accepted_at || undefined,
        };
      });

      return { data: rows, error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },
  buscarUsuario: async (email: string) => {

    try {
      const rows = await supabaseFetch<any>('users', { email: `eq.${email}`, limit: '1' });
      return { data: rows.length > 0 ? rows[0] : null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
  convidar: async (data: { compositor_id: string | number; email_gerente: string; gerente_id?: string; compositor_nome?: string; compositor_nome_artistico?: string; notas?: string }) => {

    try {
      await supabaseInsert('composer_managers', {
        composer_id: data.compositor_id,
        manager_user_id: data.gerente_id,
        status: 'pending',
      });
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },
  aceitar: async (id: string | number) => {
    try {
      const results = await supabaseUpdate<any>('composer_managers', { id: `eq.${id}` }, {
        status: 'active',
        accepted_at: new Date().toISOString(),
      });
      return { data: results.length > 0 ? results[0] : null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
  recusar: async (id: string | number) => {
    try {
      const results = await supabaseUpdate<any>('composer_managers', { id: `eq.${id}` }, {
        status: 'rejected',
      });
      return { data: results.length > 0 ? results[0] : null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
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

export interface CompositorGerente {
  id: string | number;
  compositor_id: string | number;
  nome?: string;
  nome_artistico?: string;
  compositor_nome?: string;
  compositor_nome_artistico?: string;
  compositor_email?: string;
  email?: string;
  biografia?: string;
  avatar_url?: string;
  status: string;
  gerente_usuario_id?: string | number;
  convidado_em?: string;
  aceito_em?: string;
}

export interface DocumentReview {
  id: string | number;
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
