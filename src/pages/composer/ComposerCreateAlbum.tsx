import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle, 
  X,
  AlertCircle,
  Music,
  Plus,
  GripVertical,
  Trash2
} from 'lucide-react';
import AlertModal from '@/components/ui/AlertModal';
import { albunsApi, hinosApi } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveComposer } from '@/hooks/useActiveComposer';
import { supabase } from '@/lib/supabase-auth';

interface AlbumFormData {
  title: string;
  description: string;
  releaseYear: string;
  genres: string[];
  coverImage: File | null;
  songs: Array<{
    id: string;
    title: string;
    duration: string;
  }>;
}

const ComposerCreateAlbum: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { composer, composerId } = useActiveComposer();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<AlbumFormData>({
    title: '',
    description: '',
    releaseYear: new Date().getFullYear().toString(),
    genres: [],
    coverImage: null,
    songs: []
  });

  const [dragActive, setDragActive] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggedSongIndex, setDraggedSongIndex] = useState<number | null>(null);
  const [availableSongs, setAvailableSongs] = useState<Array<{ id: string; title: string; duration: string }>>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [genres, setGenres] = useState<string[]>([]);

  // Carregar gêneros do banco de dados
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const { getAllGenres } = await import('@/lib/admin/genresAdminApi');
        const allGenres = await getAllGenres();
        const activeGenres = allGenres.filter(g => g.is_active).map(g => g.name);
        setGenres(activeGenres.length > 0 ? activeGenres : []);
      } catch (e) {
        console.warn('Erro ao carregar gêneros:', e);
      }
    };
    loadGenres();
  }, []);

  // Carregar hinos do compositor (publicados e rascunhos)
  React.useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        // 2. Buscar todos os hinos e filtrar pelo compositor_id OU compositor_nome
        const res = await hinosApi.list({ limit: 1000 });
        const raw: any = res.data;
        const arr: any[] = Array.isArray(raw) ? raw : (raw?.data || raw?.hinos || raw?.items || []);

        // Filtrar APENAS por compositor_id (sem fallback por nome)
        // Só mostra hinos que o próprio compositor fez upload
        const mine = composerId
          ? (arr || []).filter((h: any) => h.compositor_id && String(h.compositor_id) === String(composerId))
          : [];

        const mapped = mine.map((h: any) => ({ id: String(h.id), title: h.titulo || h.title || 'Sem título', duration: h.duracao || '-' }));
        setAvailableSongs(mapped);
      } catch (e) {
        console.warn('Não foi possível carregar seus hinos para o álbum:', e);
        setAvailableSongs([]);
      }
    };
    load();
  }, [composer?.nome, composer?.nome_artistico, composerId, user?.id]);

  const handleInputChange = (field: keyof AlbumFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'Imagem muito grande. Máximo 5MB.' };
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Formato inválido. Use JPG, PNG ou WEBP.' };
    }

    return { valid: true };
  };

  const handleImageUpload = (file: File) => {
    const validation = validateImageFile(file);
    
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Erro ao validar imagem');
      setShowErrorModal(true);
      return;
    }

    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    setFormData(prev => ({ ...prev, coverImage: file }));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const addSongToAlbum = (song: { id: string; title: string; duration: string }) => {
    if (formData.songs.find(s => s.id === song.id)) {
      setErrorMessage('Este hino já está no álbum.');
      setShowErrorModal(true);
      return;
    }
    setFormData(prev => ({
      ...prev,
      songs: [...prev.songs, song]
    }));
  };

  const removeSongFromAlbum = (songId: string) => {
    setFormData(prev => ({
      ...prev,
      songs: prev.songs.filter(s => s.id !== songId)
    }));
  };

  const handleDragStart = (index: number) => {
    setDraggedSongIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedSongIndex === null || draggedSongIndex === index) return;

    const newSongs = [...formData.songs];
    const draggedSong = newSongs[draggedSongIndex];
    newSongs.splice(draggedSongIndex, 1);
    newSongs.splice(index, 0, draggedSong);

    setFormData(prev => ({ ...prev, songs: newSongs }));
    setDraggedSongIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedSongIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      setErrorMessage('Por favor, preencha o título do álbum.');
      setShowErrorModal(true);
      return;
    }

    if (!formData.coverImage) {
      setErrorMessage('Por favor, adicione uma capa para o álbum.');
      setShowErrorModal(true);
      return;
    }

    if (formData.songs.length === 0) {
      setErrorMessage('Por favor, adicione pelo menos um hino ao álbum.');
      setShowErrorModal(true);
      return;
    }

    if (!user?.id) {
      setErrorMessage('Você precisa estar logado para criar um álbum.');
      setShowErrorModal(true);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // 1. Upload da capa via Supabase client (gerencia JWT automaticamente)
      let coverUrl = '';
      if (formData.coverImage) {
        setUploadProgress(30);
        try {
          const file = formData.coverImage;
          const ext = file.name.split('.').pop() || 'jpg';
          const path = `covers/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

          const { error: upErr } = await supabase.storage
            .from('images')
            .upload(path, file, { contentType: file.type, upsert: false });

          if (upErr) {
            console.error('📀 [CreateAlbum] Storage upload error:', upErr);
            throw new Error(upErr.message);
          }

          const { data: pubData } = supabase.storage.from('images').getPublicUrl(path);
          coverUrl = pubData?.publicUrl || '';
        } catch (uploadErr: any) {
          console.error('📀 [CreateAlbum] Upload failed:', uploadErr);
          throw new Error('Falha no upload da capa: ' + (uploadErr?.message || uploadErr));
        }
      }

      setUploadProgress(60);

      // 2. Criar álbum no banco
      const resolvedCompositorId = composerId || undefined;
      const resolvedCompositorNome = composer?.nome_artistico || composer?.nome || undefined;

      const albumData = {
        titulo: formData.title.trim(),
        descricao: formData.description.trim() || undefined,
        genre: formData.genres.length > 0 ? formData.genres.join(', ') : undefined,
        cover_url: coverUrl || undefined,
        ano: formData.releaseYear ? parseInt(formData.releaseYear) : undefined,
        usuario_id: user?.id,
        compositor_id: resolvedCompositorId ?? user?.id,
        compositor: resolvedCompositorNome,
        ativo: 1
      };
      
      setUploadProgress(80);
      
      const response = await albunsApi.create(albumData);
      
      if (response.error) {
        throw new Error(response.error || 'Erro desconhecido na criação do álbum');
      }
      
      if (!response.data) {
        throw new Error('Resposta da API inválida: sem dados retornados');
      }

      // Guardar referência do último álbum criado para fallback da listagem
      try {
        const raw: any = response as any;
        const created = raw?.data?.data || raw?.data || raw;
        const newId = created?.id ?? created?.album_id ?? null;
        if (newId) {
          // preservar o último antes de sobrescrever
          const prev = localStorage.getItem('lastAlbumId');
          if (prev) localStorage.setItem('lastAlbumIdPrev', prev);
          localStorage.setItem('lastAlbumId', String(newId));

          // manter um conjunto de IDs "meus álbuns" no localStorage
          try {
            const arr = JSON.parse(localStorage.getItem('myAlbumIds') || '[]');
            const set = new Set<string>([...arr.map((x: any) => String(x)), String(newId)]);
            localStorage.setItem('myAlbumIds', JSON.stringify(Array.from(set)));
          } catch {}
        }
        localStorage.setItem('lastAlbumTitle', albumData.titulo);
      } catch {}

      setUploadProgress(90);

      // 3. Persistir hinos selecionados no relacionamento album_hinos
      try {
        const rawAny: any = response as any;
        const createdData: any = rawAny?.data?.data || rawAny?.data || rawAny;
        const createdId = createdData?.id ?? createdData?.album_id;
        if (createdId) {
          const hinoIds = formData.songs.map(s => s.id);
          if (hinoIds.length > 0) {
            const addRes = await albunsApi.addHinos(createdId, hinoIds);
            if (addRes.error) throw new Error(addRes.error);
            const ordem = formData.songs.map((s, idx) => ({ hino_id: s.id, ordem: idx + 1 }));
            const ordRes = await albunsApi.updateOrdem(createdId, ordem);
            if (ordRes.error) throw new Error(ordRes.error);
          }
        }
      } catch (persistErr) {
        console.warn('Falha ao persistir hinos do novo álbum:', persistErr);
      }

      setUploadProgress(100);
      
      // Navegar direto para edição do álbum recém-criado, se possível
      try {
        const createdAny: any = response as any;

        // A API retorna { data: { id: 12, titulo: "...", ... } }
        const createdData: any = createdAny?.data?.data || createdAny?.data || createdAny;
        const createdId = createdData?.id ?? createdData?.album_id;

        if (createdId) {
          setIsUploading(false);
          // Navegar para listagem
          navigate('/composer/albums', { replace: true });
          // Atualizar em seguida
          setTimeout(() => window.location.reload(), 150);
          return;
        }
      } catch (e) {
        console.error('❌ Erro ao extrair ID:', e);
      }

      setTimeout(() => {
        setIsUploading(false);
        setShowSuccessModal(true);
      }, 300);

    } catch (error: any) {
      console.error('Erro ao criar álbum:', error);
      setErrorMessage(error.message || 'Erro ao criar álbum. Tente novamente.');
      setShowErrorModal(true);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isFormValid = formData.title && formData.coverImage && formData.songs.length > 0;

  return (
    <div className="min-h-screen bg-background-primary pb-20">
      {/* Header */}
      <div className="bg-background-secondary border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/composer/albums"
            className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Álbuns
          </Link>
          <h1 className="text-3xl font-bold text-white">Criar Novo Álbum</h1>
          <p className="text-text-muted mt-2">
            Monte seu álbum adicionando hinos e organizando a ordem das faixas
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Coluna Esquerda - Capa */}
            <div className="lg:col-span-1">
              <div className="bg-background-secondary rounded-xl p-6 sticky top-6">
                <h2 className="text-xl font-bold text-white mb-4">Capa do Álbum *</h2>
                
                {!formData.coverImage ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={() => setDragActive(true)}
                    onDragLeave={() => setDragActive(false)}
                    className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-8 text-center transition-colors cursor-pointer ${
                      dragActive
                        ? 'border-primary-400 bg-primary-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImageIcon className="w-16 h-16 text-text-muted mb-4" />
                    <p className="text-white font-medium mb-2">
                      Arraste a capa aqui
                    </p>
                    <p className="text-text-muted text-sm mb-4">
                      ou clique para selecionar
                    </p>
                    <p className="text-text-muted text-xs">
                      JPG, PNG ou WEBP<br />
                      Tamanho recomendado: 1000x1000px<br />
                      Máximo: 5MB
                    </p>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="flex-1 px-4 py-2 bg-background-tertiary text-white rounded-lg hover:bg-background-hover transition-colors text-sm"
                      >
                        Alterar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, coverImage: null }));
                          setImagePreviewUrl('');
                        }}
                        className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors text-sm"
                      >
                        Remover
                      </button>
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                    />
                  </div>
                )}

                <div className="mt-6 p-4 bg-background-tertiary rounded-lg">
                  <p className="text-text-muted text-xs mb-2">Dicas:</p>
                  <ul className="text-text-muted text-xs space-y-1 list-disc list-inside">
                    <li>Use imagem quadrada</li>
                    <li>Alta resolução (1000x1000px ou maior)</li>
                    <li>Evite textos pequenos</li>
                    <li>Cores vibrantes chamam atenção</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Coluna Direita - Informações e Faixas */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Informações Básicas */}
              <div className="bg-background-secondary rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Informações do Álbum</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Título do Álbum *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Ex: Hinos Clássicos Vol. 1"
                      className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Descreva o álbum, tema ou história..."
                      rows={4}
                      className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Gênero
                      </label>
                      <div className="min-h-[48px] bg-background-tertiary border border-gray-700 rounded-lg px-3 py-2 flex flex-wrap gap-2 items-center">
                        {formData.genres.map((g) => (
                          <span key={g} className="inline-flex items-center gap-1 bg-primary-500/20 text-primary-400 text-sm px-2.5 py-1 rounded-full border border-primary-500/30">
                            {g}
                            <button
                              type="button"
                              onClick={() => handleInputChange('genres', formData.genres.filter(x => x !== g))}
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
                            if (val && !formData.genres.includes(val)) {
                              handleInputChange('genres', [...formData.genres, val]);
                            }
                          }}
                          className="bg-transparent text-white text-sm focus:outline-none flex-1 min-w-[140px] py-1 cursor-pointer"
                        >
                          <option value="">+ Adicionar gênero</option>
                          {genres.filter(g => !formData.genres.includes(g)).map(genre => (
                            <option key={genre} value={genre}>{genre}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        Ano de Lançamento
                      </label>
                      <input
                        type="number"
                        value={formData.releaseYear}
                        onChange={(e) => handleInputChange('releaseYear', e.target.value)}
                        min="1900"
                        max={new Date().getFullYear()}
                        className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Adicionar Hinos */}
              <div className="bg-background-secondary rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-2">Hinos do Álbum</h2>
                <p className="text-text-muted text-sm mb-6">
                  Adicione hinos e arraste para reordenar as faixas
                </p>

                {/* Hinos do Álbum */}
                {formData.songs.length > 0 ? (
                  <div className="space-y-2 mb-6">
                    {formData.songs.map((song, index) => (
                      <div
                        key={song.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-3 p-4 bg-background-tertiary rounded-lg border-2 transition-all cursor-move ${
                          draggedSongIndex === index
                            ? 'border-primary-500 opacity-50'
                            : 'border-transparent hover:border-gray-700'
                        }`}
                      >
                        <GripVertical className="w-5 h-5 text-text-muted flex-shrink-0" />
                        <span className="text-text-muted font-medium w-8">{index + 1}</span>
                        <Music className="w-5 h-5 text-primary-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{song.title}</p>
                          <p className="text-text-muted text-sm">{song.duration}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSongFromAlbum(song.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg mb-6">
                    <Music className="w-12 h-12 text-text-muted mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">Nenhum hino adicionado</p>
                    <p className="text-text-muted text-sm">
                      Adicione hinos da lista abaixo
                    </p>
                  </div>
                )}

                {/* Hinos Disponíveis */}
                <div>
                  <h3 className="text-white font-semibold mb-3">
                    Meus Hinos ({availableSongs.length - formData.songs.length} disponíveis)
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableSongs
                      .filter(song => !formData.songs.find(s => s.id === song.id))
                      .map(song => (
                        <div
                          key={song.id}
                          className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg hover:bg-background-hover transition-colors"
                        >
                          <Music className="w-5 h-5 text-text-muted" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{song.title}</p>
                            <p className="text-text-muted text-sm">{song.duration}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addSongToAlbum(song)}
                            className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="bg-background-secondary rounded-xl p-6">
                {!isFormValid && (
                  <div className="flex items-start gap-3 mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-500 font-medium">Campos obrigatórios pendentes</p>
                      <p className="text-text-muted text-sm mt-1">
                        Preencha o título, adicione uma capa e pelo menos um hino.
                      </p>
                    </div>
                  </div>
                )}

                {isUploading && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Criando álbum...</span>
                      <span className="text-primary-400">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/composer/albums')}
                    disabled={isUploading}
                    className="flex-1 px-6 py-3 border border-gray-700 text-white rounded-lg hover:bg-background-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid || isUploading}
                    className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isUploading ? 'Criando...' : 'Criar Álbum'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de Erro */}
      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Atenção"
        message={errorMessage}
        type="warning"
        buttonText="Entendi"
        buttonColor="red"
      />

      {/* Modal de Sucesso */}
      <AlertModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/composer/albums', { replace: true });
          setTimeout(() => window.location.reload(), 100);
        }}
        title="Álbum Criado!"
        message="Seu álbum foi criado com sucesso e está disponível na sua biblioteca."
        type="success"
        buttonText="Ver Álbuns"
        buttonColor="green"
        imageUrl={imagePreviewUrl}
        imageName={formData.title}
      />
    </div>
  );
};

export default ComposerCreateAlbum;
