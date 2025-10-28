import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { albunsApi, hinosApi, uploadApi, compositoresApi } from '../../lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

interface AlbumFormData {
  title: string;
  description: string;
  releaseYear: string;
  genre: string;
  coverImage: File | null;
  coverImageUrl: string;
  songs: Array<{
    id: string;
    title: string;
    duration: string;
  }>;
}

const ComposerEditAlbum: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<AlbumFormData>({
    title: '',
    description: '',
    releaseYear: new Date().getFullYear().toString(),
    genre: '',
    coverImage: null,
    coverImageUrl: '',
    songs: []
  });

  const [dragActive, setDragActive] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggedSongIndex, setDraggedSongIndex] = useState<number | null>(null);
  const [availableSongs, setAvailableSongs] = useState<Array<{ id: string; title: string; duration: string }>>([]);
  const [albumSongs, setAlbumSongs] = useState<Array<{ id: string; title: string; duration: string }>>([]);

  const genres = [
    'Hino Clássico',
    'Louvor',
    'Adoração',
    'Instrumental',
    'Coral',
    'Oração',
    'Evangélico',
    'Contemporâneo',
    'Tradicional'
  ];

  // Resolver compositor atual do usuário logado
  const [composerName, setComposerName] = useState<string>('');
  const [composerId, setComposerId] = useState<number | null>(null);
  useEffect(() => {
    const loadComposer = async () => {
      try {
        if (!user?.id) return;
        const resp = await compositoresApi.getByUsuarioId(user.id);
        const cdata: any = (resp as any)?.data || resp;
        if (cdata?.id) setComposerId(Number(cdata.id));
        const name = cdata?.nome_artistico || cdata?.nome || '';
        setComposerName(name || '');
      } catch (e) {
        console.warn('Não foi possível resolver compositor do usuário:', e);
      }
    };
    loadComposer();
  }, [user?.id]);

  // Carregar todos os hinos disponíveis (apenas do compositor atual)
  useEffect(() => {
    const loadHinos = async () => {
      try {
        if (!composerName) return; // aguardar resolução do compositor
        const response = await hinosApi.list({ limit: 1000, compositor: composerName });
        console.log('🎵 [EditAlbum] Resposta hinosApi.list:', response);
        const raw: any = response as any;
        const list = Array.isArray(raw?.data?.hinos)
          ? raw.data.hinos
          : Array.isArray(raw?.data?.data)
          ? raw.data.data
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw)
          ? raw
          : [];

        // Filtrar client-side por compositor exatamente igual (quando disponível)
        const filtered = list.filter((h: any) => {
          const compStr = (h.compositor || '').toString().trim().toLowerCase();
          const expect = composerName.toString().trim().toLowerCase();
          return compStr === expect || compStr.includes(expect);
        });

        console.log('🎵 [EditAlbum] Hinos disponíveis extraídos (filtrados):', filtered.length);
        setAvailableSongs(
          filtered.map((hino: any) => ({
            id: String(hino.id),
            title: hino.titulo || hino.title || 'Sem título',
            duration: hino.duracao || hino.duration || '0:00',
          }))
        );
      } catch (error) {
        console.error('Erro ao carregar hinos:', error);
        setAvailableSongs([]);
      }
    };

    loadHinos();
  }, [composerName]);

  // Carregar dados do álbum
  useEffect(() => {
    const loadAlbum = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const response = await albunsApi.get(parseInt(id));
        
        if (response.error || !response.data) {
          throw new Error(response.error || 'Erro ao carregar álbum');
        }

        const album = response.data;
        
        setFormData({
          title: album.titulo || '',
          description: album.descricao || '',
          releaseYear: album.ano?.toString() || '',
          genre: '', // Não temos gênero na API ainda
          coverImage: null,
          coverImageUrl: album.cover_url || '',
          songs: [] // Carregar hinos depois
        });
        
        if (album.cover_url) {
          setImagePreviewUrl(album.cover_url);
        }

        // Carregar hinos do álbum
        try {
          const hinosResponse = await albunsApi.listHinos(parseInt(id));
          console.log('🎵 [EditAlbum] Resposta albunsApi.listHinos:', hinosResponse);
          const rawH: any = hinosResponse as any;
          const albumHinos = Array.isArray(rawH?.data?.hinos)
            ? rawH.data.hinos
            : Array.isArray(rawH?.hinos)
            ? rawH.hinos
            : Array.isArray(rawH?.data)
            ? rawH.data
            : [];

          const songs = albumHinos.map((hino: any) => ({
            id: String(hino.id),
            title: hino.titulo || hino.title || 'Sem título',
            duration: hino.duracao || hino.duration || '0:00',
          }));

          console.log('🎵 [EditAlbum] Hinos do álbum extraídos:', songs.length);
          setAlbumSongs(songs);
          setFormData(prev => ({ ...prev, songs }));
        } catch (err) {
          console.warn('Não foi possível carregar os hinos:', err);
          setAlbumSongs([]);
        }
      } catch (error) {
        console.error('Erro ao carregar álbum:', error);
        alert('Erro ao carregar álbum');
        navigate('/composer/albums');
      } finally {
        setIsLoading(false);
      }
    };

    loadAlbum();
  }, [id, navigate]);

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
      alert(validation.error);
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
      alert('Esta música já está no álbum.');
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
    if (!id) return;

    if (!formData.title) {
      alert('Por favor, preencha o título do álbum.');
      return;
    }
    if (!hasCover) {
      alert('Por favor, adicione uma capa para o álbum.');
      return;
    }
    if (formData.songs.length === 0) {
      alert('Por favor, adicione pelo menos uma música ao álbum.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(5);

      // 1) Upload de capa (se houver novo arquivo)
      let coverUrl = formData.coverImageUrl || imagePreviewUrl || '';
      if (formData.coverImage) {
        try {
          const up = await uploadApi.cover(formData.coverImage);
          console.log('📤 [EditAlbum] Upload cover result:', up);
          if (up.data?.url) {
            coverUrl = up.data.url;
          }
        } catch (err) {
          console.warn('Falha no upload da capa, mantendo URL anterior', err);
        }
      }
      setUploadProgress(30);

      // 2) Atualizar dados do álbum
      const payload: any = {
        titulo: formData.title,
        descricao: formData.description,
        ano: formData.releaseYear ? parseInt(formData.releaseYear) : null,
        cover_url: coverUrl || null,
        compositor_id: composerId ?? null,
      };
      console.log('📝 [EditAlbum] Update payload:', payload);
      const upRes = await albunsApi.update(parseInt(id), payload);
      console.log('📝 [EditAlbum] Update album response:', upRes);
      if (upRes.error) throw new Error(upRes.error);
      setUploadProgress(60);

      // 3) Sincronizar músicas (add/remove)
      const currentIds = albumSongs.map(s => parseInt(s.id));
      const targetIds = formData.songs.map(s => parseInt(s.id));
      const toAdd = targetIds.filter(h => !currentIds.includes(h));
      const toRemove = currentIds.filter(h => !targetIds.includes(h));
      console.log('🔁 [EditAlbum] Sync hinos', { currentIds, targetIds, toAdd, toRemove });

      if (toAdd.length > 0) {
        const addRes = await albunsApi.addHinos(parseInt(id), toAdd);
        console.log('➕ [EditAlbum] addHinos result:', addRes);
        if (addRes.error) throw new Error(addRes.error);
      }

      for (const hid of toRemove) {
        const rem = await albunsApi.removeHino(parseInt(id), hid);
        console.log('➖ [EditAlbum] removeHino result:', hid, rem);
        if (rem.error) throw new Error(rem.error);
      }
      setUploadProgress(80);

      // 4) Atualizar ordem
      const ordem = formData.songs.map((s, idx) => ({ hino_id: parseInt(s.id), ordem: idx + 1 }));
      const ordRes = await albunsApi.updateOrdem(parseInt(id), ordem);
      console.log('↕ [EditAlbum] updateOrdem result:', ordRes);
      if (ordRes.error) throw new Error(ordRes.error);
      setUploadProgress(100);

      alert('Álbum atualizado com sucesso!');
      navigate('/composer/albums');
    } catch (error: any) {
      console.error('❌ Erro ao salvar álbum:', error);
      alert(`Erro ao salvar álbum: ${error?.message || 'Tente novamente.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const hasCover = Boolean(formData.coverImage)
    || Boolean(formData.coverImageUrl && formData.coverImageUrl.trim())
    || Boolean(imagePreviewUrl && imagePreviewUrl.trim());
  const isFormValid = Boolean(formData.title && formData.title.trim())
    && hasCover
    && formData.songs.length > 0;

  useEffect(() => {
    console.log('✅ [EditAlbum] Valid check', {
      title: formData.title,
      hasCoverFile: !!formData.coverImage,
      coverImageUrl: formData.coverImageUrl,
      imagePreviewUrl,
      hasCover,
      songsCount: formData.songs.length,
      isFormValid,
    });
  }, [formData, isFormValid]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-text-muted">Carregando álbum...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-white">Editar Álbum</h1>
          <p className="text-text-muted mt-2">
            Atualize as informações e organize as faixas do álbum
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
                
                {!imagePreviewUrl ? (
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
                          setFormData(prev => ({ ...prev, coverImage: null, coverImageUrl: '' }));
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
                      <select
                        value={formData.genre}
                        onChange={(e) => handleInputChange('genre', e.target.value)}
                        className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Selecione um gênero</option>
                        {genres.map(genre => (
                          <option key={genre} value={genre}>{genre}</option>
                        ))}
                      </select>
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

              {/* Adicionar Músicas */}
              <div className="bg-background-secondary rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-2">Músicas do Álbum</h2>
                <p className="text-text-muted text-sm mb-6">
                  Adicione músicas e arraste para reordenar as faixas
                </p>

                {/* Músicas do Álbum */}
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
                    <p className="text-white font-medium mb-1">Nenhuma música adicionada</p>
                    <p className="text-text-muted text-sm">
                      Adicione músicas da lista abaixo
                    </p>
                  </div>
                )}

                {/* Músicas Disponíveis */}
                <div>
                  <h3 className="text-white font-semibold mb-3">
                    Minhas Músicas ({availableSongs.length - formData.songs.length} disponíveis)
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
                        Preencha o título, adicione uma capa e pelo menos uma música.
                      </p>
                    </div>
                  </div>
                )}

                {isUploading && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Atualizando álbum...</span>
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
                    {isUploading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposerEditAlbum;
