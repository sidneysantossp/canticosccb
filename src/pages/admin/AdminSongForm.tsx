import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Music, Image as ImageIcon, Save, X } from 'lucide-react';
import { compositoresApi, albunsApi, uploadApi, hinosApi, type Compositor } from '@/lib/api-client';

interface FormData {
  title: string;
  number: string;
  lyrics: string;
  composer_id: string;
  genre_id: string;
  album_id: string;
  key: string;
  tempo: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
}

const AdminSongForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<FormData>({
    title: '',
    number: '',
    lyrics: '',
    composer_id: '',
    genre_id: '',
    album_id: '',
    key: '',
    tempo: '',
    status: 'draft',
    is_featured: false
  });

  const [composers, setComposers] = useState<Compositor[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      setIsLoadingData(true);

      // Carregar compositores e álbuns
      const [composersData, albumsData] = await Promise.all([
        compositoresApi.list(),
        albunsApi.list()
      ]);

      setComposers(Array.isArray(composersData.data) ? composersData.data : []);
      setAlbums(Array.isArray(albumsData.data) ? albumsData.data : []);
      
      // TODO: Criar API de gêneros
      setGenres([]);

      // Se estiver editando, carregar dados da música
      if (isEditMode && id) {
        const songRes = await hinosApi.get(Number(id));
        if (!songRes.error && songRes.data) {
          const song: any = songRes.data;
          setFormData({
            title: song.titulo || '',
            number: song.numero ? String(song.numero) : '',
            lyrics: song.letra || '',
            composer_id: '',
            genre_id: '',
            album_id: '',
            key: '',
            tempo: '',
            status: song.ativo ? 'published' : 'draft',
            is_featured: false
          });
          setCoverPreview(song.cover_url || '');
          setAudioPreview(song.audio_url || '');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erro ao carregar dados');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        return;
      }

      setAudioFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudioPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Extrair duração do áudio
      try {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        const objectUrl = URL.createObjectURL(file);
        audio.src = objectUrl;
        
        await new Promise<void>((resolve, reject) => {
          audio.onloadedmetadata = () => resolve();
          audio.onerror = () => reject(new Error('Erro ao ler metadados'));
          setTimeout(() => reject(new Error('Timeout')), 10000);
        });

        const secs = Math.round(audio.duration || 0);
        URL.revokeObjectURL(objectUrl);
        const mm = Math.floor(secs / 60).toString().padStart(2, '0');
        const ss = Math.floor(secs % 60).toString().padStart(2, '0');
        const durationStr = `${mm}:${ss}`;
        
        // Salvar duração no formData
        setFormData(prev => ({ ...prev, tempo: durationStr }));
        console.log('✅ Duração extraída:', durationStr);
      } catch (err) {
        console.error('⚠️ Erro ao extrair duração:', err);
      }
    }
  };

  const uploadFile = async (file: File, type: 'cover' | 'audio'): Promise<string | null> => {
    try {
      const res = type === 'cover' ? await uploadApi.cover(file) : await uploadApi.audio(file);
      if (res.error) throw new Error(res.error);
      return res.data?.url || null;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setError(error.message || 'Erro no upload de arquivo');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validações
      if (!formData.title.trim()) {
        throw new Error('Título é obrigatório');
      }

      if (!formData.composer_id) {
        throw new Error('Compositor é obrigatório');
      }

      let coverUrl = isEditMode ? coverPreview : '';
      let audioUrl = isEditMode ? audioPreview : '';

      // Upload da capa se houver
      if (coverFile) {
        const uploadedCover = await uploadFile(coverFile, 'cover');
        if (uploadedCover) coverUrl = uploadedCover;
      }

      // Upload do áudio se houver
      if (audioFile) {
        const uploadedAudio = await uploadFile(audioFile, 'audio');
        if (uploadedAudio) audioUrl = uploadedAudio;
      }

      // Mapear compositor pelo nome (API espera string 'compositor')
      const selectedComposerName = composers.find(c => String(c.id) === String(formData.composer_id))?.nome || undefined;

      // Montar payload no formato do backend PHP
      const payload = {
        numero: formData.number ? parseInt(formData.number) : undefined,
        titulo: formData.title.trim(),
        compositor: selectedComposerName,
        categoria: undefined as string | undefined, // TODO: ligar com categorias
        audio_url: audioUrl || undefined,
        cover_url: coverUrl || undefined,
        duracao: undefined as string | undefined,
        letra: formData.lyrics.trim() || undefined,
        tags: undefined as string | undefined,
        ativo: formData.status === 'published' ? 1 : 0,
      } as any;

      if (isEditMode && id) {
        const res = await hinosApi.update(Number(id), payload);
        if (res.error) throw new Error(res.error);
      } else {
        const res = await hinosApi.create(payload);
        if (res.error) throw new Error(res.error);
      }

      navigate('/admin/hymns');
    } catch (error: any) {
      console.error('Error saving song:', error);
      setError(error.message || 'Erro ao salvar música');
    } finally {
      setIsLoading(false);
    }
  };

  // Removed page-level loading to render instantly

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/songs')}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">
            {isEditMode ? 'Editar Hino' : 'Adicionar Novo Hino'}
          </h1>
          <p className="text-gray-400">Preencha os dados do hino</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
          <X className="w-5 h-5 text-red-500" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Informações Básicas</h2>

          {/* Title & Number */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Título do Hino *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: Saudosa Lembrança"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Número
              </label>
              <input
                type="number"
                name="number"
                value={formData.number}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: 50"
              />
            </div>
          </div>

          {/* Composer & Genre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Compositor *
              </label>
              <select
                name="composer_id"
                value={formData.composer_id}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecione um compositor</option>
                {composers.map(composer => (
                  <option key={composer.id} value={composer.id}>
                    {composer.artistic_name || composer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Gênero
              </label>
              <select
                name="genre_id"
                value={formData.genre_id}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecione um gênero</option>
                {genres.map(genre => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Album */}
          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">
              Álbum (Opcional)
            </label>
            <select
              name="album_id"
              value={formData.album_id}
              onChange={handleInputChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sem álbum</option>
              {albums.map(album => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>
          </div>

          {/* Lyrics */}
          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">
              Letra
            </label>
            <textarea
              name="lyrics"
              value={formData.lyrics}
              onChange={handleInputChange}
              rows={8}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Digite a letra do hino..."
            />
          </div>
        </div>

        {/* Detalhes Musicais */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Detalhes Musicais</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Tom/Tonalidade
              </label>
              <input
                type="text"
                name="key"
                value={formData.key}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: C, Am, G#"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Tempo (BPM)
              </label>
              <input
                type="number"
                name="tempo"
                value={formData.tempo}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: 120"
              />
            </div>
          </div>
        </div>

        {/* Upload Files */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Arquivos</h2>

          {/* Cover Upload */}
          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">
              Capa do Hino
            </label>
            <div className="flex items-center gap-4">
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-lg object-cover"
                />
              )}
              <label className="flex-1 flex items-center justify-center gap-2 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-4 cursor-pointer hover:border-primary-500 transition-colors">
                <ImageIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">
                  {coverFile ? coverFile.name : 'Clique para selecionar uma imagem'}
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

          {/* Audio Upload */}
          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">
              Arquivo de Áudio
            </label>
            <label className="flex items-center justify-center gap-2 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-4 cursor-pointer hover:border-primary-500 transition-colors">
              <Music className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400">
                {audioFile ? audioFile.name : 'Clique para selecionar um áudio (MP3, WAV)'}
              </span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                className="hidden"
              />
            </label>
            {audioPreview && (
              <audio controls className="w-full mt-2">
                <source src={audioPreview} />
              </audio>
            )}
          </div>
        </div>

        {/* Status & Options */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Status e Opções</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-white font-semibold">Marcar como Destaque</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="w-5 h-5" />
            {isEditMode ? 'Salvar Alterações' : 'Criar Hino'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/songs')}
            className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSongForm;
