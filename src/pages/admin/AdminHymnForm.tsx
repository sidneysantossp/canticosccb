import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Music, Upload, Image as ImageIcon, FileAudio, Clock, Search } from 'lucide-react';
import { hinosApi, uploadApi, categoriasApi, compositoresApi, type Categoria } from '@/lib/api-client';
import SafeRichTextEditor from '@/components/ui/SafeRichTextEditor';

const AdminHymnForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState({
    numero: 0,
    titulo: '',
    categorias: [] as string[],
    compositor: '',
    compositor_id: null as string | null,
    participacao_especial: '',
    cover_url: '',
    audio_url: '',
    duracao: '',
    letra: '',
    ativo: 1
  });

  // Autocomplete compositor
  const [compositorSearch, setCompositorSearch] = useState('');
  const [compositorResults, setCompositorResults] = useState<any[]>([]);
  const [showCompositorDropdown, setShowCompositorDropdown] = useState(false);
  const [searchingCompositor, setSearchingCompositor] = useState(false);
  const compositorDropdownRef = React.useRef<HTMLDivElement>(null);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);

  useEffect(() => {
    if (isEditing && id) {
      loadHino(id);
    }
    loadCategories();
  }, [id, isEditing]);

  // Fechar dropdown compositor ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (compositorDropdownRef.current && !compositorDropdownRef.current.contains(e.target as Node)) {
        setShowCompositorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar compositores com debounce
  useEffect(() => {
    if (!compositorSearch || compositorSearch.length < 2) {
      setCompositorResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingCompositor(true);
      try {
        const res = await compositoresApi.list({ search: compositorSearch, limit: 10 });
        const list = res.data?.compositores || [];
        setCompositorResults(list);
        setShowCompositorDropdown(list.length > 0);
      } catch {
        setCompositorResults([]);
      } finally {
        setSearchingCompositor(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [compositorSearch]);

  const selectCompositor = (comp: any) => {
    setFormData(prev => ({
      ...prev,
      compositor: comp.name || comp.nome || '',
      compositor_id: String(comp.id),
    }));
    setCompositorSearch(comp.name || comp.nome || '');
    setShowCompositorDropdown(false);
  };

  const loadHino = async (hinoId: string) => {
    try {
      setIsLoading(true);
      const response = await hinosApi.get(hinoId);

      if (response.data) {
        const hino = response.data;
        const compositorNome = hino.compositor_nome || hino.compositor || '';
        setFormData({
          numero: hino.numero || 0,
          titulo: hino.titulo || '',
          categorias: hino.categorias || (hino.categoria ? [hino.categoria] : []),
          compositor: compositorNome,
          compositor_id: hino.compositor_id ? String(hino.compositor_id) : null,
          participacao_especial: hino.participacao_especial || '',
          cover_url: hino.cover_url || '',
          audio_url: hino.audio_url || '',
          duracao: hino.duracao || '',
          letra: hino.letra || '',
          ativo: hino.ativo !== undefined ? hino.ativo : 1
        });
        setCompositorSearch(compositorNome);
        setCoverPreview(hino.cover_url || '');
      }
    } catch (error: any) {
      console.error('Erro ao carregar hino:', error);
      setError(error?.message || 'Erro ao carregar hino');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await categoriasApi.list({ limit: 1000 });
      if (res.data) {
        const payload: any = res.data;
        const arr = payload.categorias || payload.data || payload;
        setCategories(Array.isArray(arr) ? arr : []);
      } else {
        setCategories([]);
      }
    } catch (e) {
      console.error('Erro ao carregar categorias:', e);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
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

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      // Extrair duração automaticamente
      try {
        const url = URL.createObjectURL(file);
        const audio = new Audio();
        audio.src = url;
        audio.addEventListener('loadedmetadata', () => {
          if (!isNaN(audio.duration)) {
            const total = Math.floor(audio.duration);
            const mm = String(Math.floor(total / 60)).padStart(2, '0');
            const ss = String(total % 60).padStart(2, '0');
            setFormData((prev) => ({ ...prev, duracao: `${mm}:${ss}` }));
          }
          URL.revokeObjectURL(url);
        }, { once: true });
      } catch {}
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

  const uploadAudio = async (file: File): Promise<string | null> => {
    try {
      const response = await uploadApi.audio(file);
      if (response.data) {
        return response.data.url;
      }
      return null;
    } catch (error) {
      console.error('Erro ao fazer upload do áudio:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    // Validação mínima
    if (!formData.titulo || !String(formData.titulo).trim()) {
      setIsSubmitting(false);
      setError('Título é obrigatório.');
      return;
    }
    
    if (formData.categorias.length === 0) {
      setIsSubmitting(false);
      setError('Selecione pelo menos uma categoria.');
      return;
    }

    try {
      let coverUrl = formData.cover_url;
      let audioUrl = formData.audio_url;

      // Upload de capa se houver
      if (coverFile) {
        const uploaded = await uploadCover(coverFile);
        if (uploaded) coverUrl = uploaded;
      }

      // Upload de áudio se houver
      if (audioFile) {
        const uploaded = await uploadAudio(audioFile);
        if (uploaded) audioUrl = uploaded;
      }

      const hinoData: Record<string, any> = {
        numero: formData.numero || undefined,
        titulo: formData.titulo.trim(),
        categorias: formData.categorias,
        categoria: formData.categorias[0] || '', // Manter compatibilidade com campo antigo
        compositor_nome: formData.compositor.trim() || undefined,
        compositor_id: formData.compositor_id || undefined,
        participacao_especial: formData.participacao_especial.trim() || undefined,
        cover_url: coverUrl || undefined,
        audio_url: audioUrl || undefined,
        duracao: formData.duracao || undefined,
        letra: formData.letra || undefined,
        ativo: formData.ativo
      };

      let response;
      if (isEditing && id) {
        response = await hinosApi.update(id, hinoData);
      } else {
        response = await hinosApi.create(hinoData);
      }

      if (response.error) {
        throw new Error(response.error);
      }

      navigate('/admin/hinos');
    } catch (error: any) {
      console.error('Erro ao salvar hino:', error);
      setError(error?.message || 'Erro ao salvar hino');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando hino...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin/hinos"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEditing ? 'Editar Hino' : 'Novo Hino'}
            </h1>
            <p className="text-gray-400 mt-1">Preencha as informações do hino</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Music className="w-5 h-5" />
              Informações Básicas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">Número do Hino</label>
                <input
                  type="number"
                  value={formData.numero || ''}
                  onChange={(e) => setFormData({ ...formData, numero: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">Status *</label>
                <select
                  value={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  required
                >
                  <option value="1">Publicado</option>
                  <option value="0">Rascunho</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm font-semibold mb-2">Título do Hino *</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                placeholder="Ex: Coro Celeste"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">Categorias *</label>
                <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg p-3">
                  {loadingCategories ? (
                    <div className="text-gray-400 text-sm">Carregando categorias...</div>
                  ) : categories.length === 0 ? (
                    <div className="text-gray-400 text-sm">Nenhuma categoria encontrada</div>
                  ) : (
                    categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={formData.categorias.includes(cat.nome)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ 
                                ...formData, 
                                categorias: [...formData.categorias, cat.nome] 
                              });
                            } else {
                              setFormData({ 
                                ...formData, 
                                categorias: formData.categorias.filter(c => c !== cat.nome) 
                              });
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-green-500 focus:ring-green-600"
                        />
                        <span className="text-white text-sm">{cat.nome}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  {formData.categorias.length === 0 
                    ? 'Selecione pelo menos uma categoria' 
                    : `${formData.categorias.length} ${formData.categorias.length === 1 ? 'categoria' : 'categorias'} selecionada${formData.categorias.length > 1 ? 's' : ''}`
                  }
                </p>
              </div>

              <div className="space-y-4">
                {/* Compositor com autocomplete */}
                <div ref={compositorDropdownRef} className="relative">
                  <label className="block text-gray-400 text-sm font-semibold mb-2">Compositor</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={compositorSearch}
                      onChange={(e) => {
                        setCompositorSearch(e.target.value);
                        setFormData(prev => ({ ...prev, compositor: e.target.value, compositor_id: null }));
                      }}
                      onFocus={() => { if (compositorResults.length > 0) setShowCompositorDropdown(true); }}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-green-600"
                      placeholder="Buscar compositor..."
                      autoComplete="off"
                    />
                    {searchingCompositor && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                      </div>
                    )}
                  </div>
                  {showCompositorDropdown && compositorResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {compositorResults.map((comp: any) => (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => selectCompositor(comp)}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-700 transition-colors flex items-center gap-3"
                        >
                          {comp.avatar_url || comp.photo_url ? (
                            <img src={comp.avatar_url || comp.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold">
                              {(comp.name || comp.nome || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-white text-sm font-medium">{comp.name || comp.nome}</div>
                            {comp.artistic_name && comp.artistic_name !== comp.name && (
                              <div className="text-gray-400 text-xs">{comp.artistic_name}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {formData.compositor_id && (
                    <p className="text-green-400 text-xs mt-1">Compositor vinculado: {formData.compositor}</p>
                  )}
                  {compositorSearch.length >= 2 && !searchingCompositor && compositorResults.length === 0 && (
                    <p className="text-gray-500 text-xs mt-1">Nenhum compositor encontrado. O nome digitado será salvo.</p>
                  )}
                </div>

                {/* Participação Especial */}
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">Participação Especial</label>
                  <input
                    type="text"
                    value={formData.participacao_especial}
                    onChange={(e) => setFormData({ ...formData, participacao_especial: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                    placeholder="Ex: Participação de João Silva"
                  />
                  <p className="text-gray-500 text-xs mt-1">Opcional. Informe participações especiais no hino.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Arquivos e Mídia */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Arquivos e Mídia
            </h2>

            <div className="space-y-4">
              {/* Capa */}
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Capa do Hino
                </label>
                <div className="flex items-start gap-6">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Capa"
                      className="w-32 h-32 rounded-lg object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-gray-800 flex items-center justify-center">
                      <Music className="w-12 h-12 text-gray-600" />
                    </div>
                  )}

                  <div className="flex-1">
                    <label className="flex flex-col items-center justify-center h-32 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-green-600 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-gray-400 text-sm">
                        {coverFile ? coverFile.name : 'Arraste uma imagem ou clique para selecionar'}
                      </span>
                      <span className="text-gray-500 text-xs mt-1">
                        PNG, JPG (máx. 5MB)
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

              {/* Áudio */}
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2 flex items-center gap-2">
                  <FileAudio className="w-4 h-4" />
                  Arquivo de Áudio
                </label>
                <label className="flex flex-col items-center justify-center h-24 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-green-600 transition-colors">
                  <FileAudio className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-gray-400 text-sm">
                    {audioFile ? audioFile.name : formData.audio_url ? 'Áudio já enviado - clique para alterar' : 'Selecionar arquivo de áudio'}
                  </span>
                  <span className="text-gray-500 text-xs mt-1">
                    MP3, WAV (máx. 5GB)
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Duração */}
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duração
                </label>
                <input
                  type="text"
                  value={formData.duracao}
                  onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="3:45"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Formato: mm:ss (ex: 3:45)
                </p>
              </div>
            </div>
          </div>

          {/* Letra do Hino */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Letra do Hino</h2>
            
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">Letra Completa</label>
              <div className="bg-white rounded-lg overflow-hidden">
                <SafeRichTextEditor
                  value={formData.letra}
                  onChange={(content) => setFormData({ ...formData, letra: content })}
                  placeholder="Cole a letra completa do hino aqui..."
                  className="h-96"
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Use o editor para formatar a letra com quebras de linha, negrito, etc.
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 sticky bottom-6 bg-gray-950/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <Link
              to="/admin/hinos"
              className="flex-1 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Hino'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminHymnForm;
