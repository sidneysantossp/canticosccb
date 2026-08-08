import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Disc, Trash2, X, Star } from 'lucide-react';
import { albunsApi, uploadApi, compositoresApi, categoriasApi, Hino } from '@/lib/api-client';
import { supabaseDelete, supabaseFetch } from '@/lib/supabaseRest';
import HinoSelector from '@/components/admin/HinoSelector';

const AdminAlbumForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    description: '',
    genres: [] as string[],
    total_tracks: '',
    release_date: '',
    status: 'published' as 'published' | 'draft',
    featured: false,
    featured_order: 0
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [selectedHinos, setSelectedHinos] = useState<Hino[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composers, setComposers] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string | number; nome: string }[]>([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      loadAlbum(id);
    }
  }, [id, isEditing]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [compResult, catResult] = await Promise.all([
          compositoresApi.list({ limit: 500 }),
          categoriasApi.list({ limit: 500 }),
        ]);
        const compData = compResult?.data as any;
        const compList = compData?.compositores || compData?.data || compData || [];
        setComposers(
          (Array.isArray(compList) ? compList : []).map((c: any) => ({
            id: String(c.id),
            name: c.artistic_name || c.nome_artistico || c.name || c.nome || '',
          })).filter((c: any) => c.name).sort((a: any, b: any) => a.name.localeCompare(b.name))
        );
        const catList = catResult?.data || [];
        setCategories(
          (Array.isArray(catList) ? catList : []).map((c: any) => ({
            id: c.id,
            nome: c.nome || c.name || '',
          })).filter((c: any) => c.nome).sort((a: any, b: any) => a.nome.localeCompare(b.nome))
        );
      } catch (e) {
        console.warn('[AdminAlbumForm] Erro ao carregar opções:', e);
      }
    };
    loadOptions();
  }, []);

  const loadAlbum = async (albumId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 [AdminAlbumForm] Carregando álbum ID:', albumId);
      
      const response = await albunsApi.get(albumId);
      console.log('📦 [AdminAlbumForm] Resposta do get:', response);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        const album = response.data;
        console.log('✅ [AdminAlbumForm] Álbum carregado:', album);
        
        setFormData({
          title: album.title || '',
          artist: album.artist || '',
          description: album.description || '',
          genres: album.genre ? album.genre.split(',').map((g: string) => g.trim()).filter(Boolean) : [],
          total_tracks: album.total_tracks?.toString() || '',
          release_date: album.release_date || '',
          status: album.status || 'published',
          featured: album.featured || false,
          featured_order: album.featured_order || 0
        });
        setCoverPreview(album.cover_url || '');

        // Carregar hinos do álbum
        try {
          const albumHinos = await supabaseFetch<any>('album_hinos', {
            album_id: `eq.${albumId}`,
            select: 'hino_id,position',
            order: 'position.asc',
          });
          if (albumHinos.length > 0) {
            const hinoIds = albumHinos.map((ah: any) => ah.hino_id);
            const hinos = await supabaseFetch<any>('hinos', {
              id: `in.(${hinoIds.join(',')})`,
              select: 'id,numero,titulo,compositor_nome,compositor_id,duracao',
            });
            // Ordenar conforme a ordem do album_hinos e mapear compositor
            const ordered = hinoIds
              .map((hid: string) => hinos.find((h: any) => h.id === hid))
              .filter(Boolean)
              .map((h: any) => ({ ...h, compositor: h.compositor_nome || '' }));
            setSelectedHinos(ordered);
          }
        } catch (e) {
          console.warn('[AdminAlbumForm] Erro ao carregar hinos do álbum:', e);
        }
      } else {
        throw new Error('Álbum não encontrado');
      }
    } catch (error: any) {
      console.error('❌ [AdminAlbumForm] Erro ao carregar álbum:', error);
      setError(error?.message || 'Erro ao carregar álbum');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadCover = async (file: File): Promise<string | null> => {
    try {
      const response = await uploadApi.cover(file);
      if (response.data) {
        return response.data.url;
      }
      return null;
    } catch (error) {
      console.error('Erro ao fazer upload da capa:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      let coverUrl = coverPreview;
      if (coverFile) {
        const uploaded = await uploadCover(coverFile);
        if (uploaded) coverUrl = uploaded;
      }

      const albumData = {
        titulo: formData.title.trim(),
        artist: formData.artist.trim() || undefined,
        genre: formData.genres.length > 0 ? formData.genres.join(', ') : undefined,
        descricao: formData.description.trim() || undefined,
        cover_url: coverUrl || undefined,
        ano: formData.release_date ? parseInt(formData.release_date) : undefined,
        ativo: formData.status === 'published' ? 1 : 0,
        is_published: formData.status === 'published',
        featured: formData.featured,
        featured_order: formData.featured ? formData.featured_order : 0
      };

      let albumId: string | number = id || '';

      // 1. Salvar dados do álbum
      console.log('💾 [handleSubmit] Salvando álbum...', albumData);
      if (isEditing && id) {
        const response = await albunsApi.update(id, albumData);
        console.log('💾 [handleSubmit] Update result:', response);
        if (response.error) {
          throw new Error(response.error);
        }
        albumId = id;
      } else {
        const response = await albunsApi.create(albumData);
        console.log('💾 [handleSubmit] Create result:', response);
        if (response.error) throw new Error(response.error);
        albumId = response.data?.id;
      }

      // 2. Salvar hinos do álbum
      if (albumId) {
        console.log(`💾 [handleSubmit] Salvando ${selectedHinos.length} hinos para álbum ${albumId}`);
        if (selectedHinos.length > 0) {
          const hinoIds = selectedHinos.map(h => h.id);
          console.log('💾 [handleSubmit] Hino IDs:', hinoIds);
          const hinosResult = await albunsApi.addHinos(albumId, hinoIds);
          console.log('💾 [handleSubmit] addHinos result:', hinosResult);
          if (hinosResult.error) {
            setError(`Álbum salvo, mas erro ao salvar hinos: ${hinosResult.error}`);
            setIsSaving(false);
            return;
          }
        } else if (isEditing) {
          try {
            await supabaseDelete('album_hinos', { album_id: `eq.${albumId}` });
          } catch (e) {
            console.warn('⚠️ Erro ao limpar hinos do álbum:', e);
          }
        }
      }

      navigate('/admin/albuns');
    } catch (error: any) {
      console.error('❌ [handleSubmit] Erro geral:', error);
      setError(error?.message || 'Erro ao salvar álbum');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando álbum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin/albuns"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-white">
            {isEditing ? 'Editar Álbum' : 'Novo Álbum'}
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Informações Básicas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Hinário 5"
                />
              </div>

              <div className="relative">
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Artista
                </label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, artist: val }));
                    setArtistSearch(val);
                    setShowArtistDropdown(true);
                  }}
                  onFocus={() => setShowArtistDropdown(true)}
                  onBlur={() => setTimeout(() => setShowArtistDropdown(false), 200)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Buscar artista..."
                  autoComplete="off"
                />
                {showArtistDropdown && (
                  <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
                    {composers
                      .filter((c) =>
                        !artistSearch || c.name.toLowerCase().includes(artistSearch.toLowerCase())
                      )
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, artist: c.name }));
                            setArtistSearch('');
                            setShowArtistDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          {c.name}
                        </button>
                      ))}
                    {composers.filter((c) =>
                      !artistSearch || c.name.toLowerCase().includes(artistSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500">Nenhum artista encontrado</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Gênero
                </label>
                <div className="min-h-[48px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex flex-wrap gap-2 items-center">
                  {formData.genres.map((g) => (
                    <span key={g} className="inline-flex items-center gap-1 bg-green-600/20 text-green-400 text-sm px-2.5 py-1 rounded-full border border-green-600/30">
                      {g}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, genres: prev.genres.filter(x => x !== g) }))}
                        className="hover:text-white transition-colors ml-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setFormData(prev => ({
                          ...prev,
                          genres: prev.genres.includes(val) ? prev.genres : [...prev.genres, val]
                        }));
                      }
                    }}
                    className="bg-gray-800 text-white text-sm focus:outline-none flex-1 min-w-[140px] py-1 cursor-pointer rounded"
                  >
                    <option value="" className="bg-gray-800 text-white">+ Adicionar gênero</option>
                    {categories.filter(c => !formData.genres.includes(c.nome)).map((cat) => (
                      <option key={cat.id} value={cat.nome} className="bg-gray-800 text-white">{cat.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Data de Lançamento
                </label>
                <input
                  type="date"
                  value={formData.release_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, release_date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-green-600"
                placeholder="Descrição do álbum..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Status
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: 'published' }))}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
                    formData.status === 'published'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  ✅ Publicado
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: 'draft' }))}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
                    formData.status === 'draft'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  📝 Rascunho
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Álbuns publicados aparecem na home e na listagem pública.
              </p>
            </div>

            {/* Destaque na Home */}
            <div className="mb-4">
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Destaque na Home
              </label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, featured: !prev.featured }))}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
                  formData.featured
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <Star className={`w-5 h-5 ${formData.featured ? 'fill-yellow-400' : ''}`} />
                {formData.featured ? 'Em destaque no carrossel' : 'Marcar como destaque'}
              </button>
              {formData.featured && (
                <div className="mt-3">
                  <label className="block text-gray-500 text-xs mb-1">
                    Ordem no carrossel (1 = primeiro)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.featured_order || 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured_order: parseInt(e.target.value) || 1 }))}
                    className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Até 6 álbuns em destaque. Os demais slots são preenchidos pelos mais recentes.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Capa */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Capa do Álbum</h2>
            
            <div className="flex items-start gap-6">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Capa do álbum"
                  className="w-48 h-48 rounded-lg object-cover shadow-lg"
                />
              ) : (
                <div className="w-48 h-48 rounded-lg bg-gray-800 flex items-center justify-center">
                  <Disc className="w-16 h-16 text-gray-600" />
                </div>
              )}

              <div className="flex-1">
                <label className="flex flex-col items-center justify-center h-48 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-green-600 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-gray-400 text-sm">
                    {coverFile ? coverFile.name : 'Arraste uma imagem ou clique para selecionar'}
                  </span>
                  <span className="text-gray-500 text-xs mt-1">
                    PNG, JPG ou JPEG (máx. 10MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Hinos do Álbum */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Faixas do Álbum</h2>
            <HinoSelector
              selectedHinos={selectedHinos}
              onSelectionChange={setSelectedHinos}
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 sticky bottom-6 bg-gray-950/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <Link
              to="/admin/albuns"
              className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center transition-colors"
            >
              Cancelar
            </Link>
            {isEditing && id && (
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm('Tem certeza que deseja excluir este álbum? Esta ação não pode ser desfeita.')) return;
                  try {
                    await albunsApi.delete(id);
                    navigate('/admin/albuns');
                  } catch (err) {
                    console.error('Erro ao excluir álbum:', err);
                    setError('Erro ao excluir álbum');
                  }
                }}
                className="px-6 py-3 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 font-semibold flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Excluir
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Álbum'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAlbumForm;
