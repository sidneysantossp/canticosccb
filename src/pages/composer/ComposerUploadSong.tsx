import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Music, 
  Image as ImageIcon, 
  CheckCircle, 
  X,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import AlertModal from '@/components/ui/AlertModal';
import { useAuth } from '@/contexts/AuthContext';
import { hinosApi, uploadApi } from '@/lib/api-client';
import { useActiveComposer } from '@/hooks/useActiveComposer';

interface SongFormData {
  title: string;
  album: string;
  genre: string;
  year: string;
  lyrics: string;
  credits: string;
  tags: string[];
  audioFile: File | null;
  coverImage: File | null;
}

const ComposerUploadSong: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { composer, composerId } = useActiveComposer();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const compositorNome = composer?.nome_artistico || composer?.nome || (user as any)?.nome || (user as any)?.name || '';

  const [formData, setFormData] = useState<SongFormData>({
    title: '',
    album: '',
    genre: '',
    year: new Date().getFullYear().toString(),
    lyrics: '',
    credits: '',
    tags: [],
    audioFile: null,
    coverImage: null
  });

  const [tagInput, setTagInput] = useState('');
  const [dragActiveAudio, setDragActiveAudio] = useState(false);
  const [dragActiveImage, setDragActiveImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);
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

  const handleInputChange = (field: keyof SongFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateAudioFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > maxSize) {
      return { valid: false, error: 'Arquivo muito grande. Máximo 5GB.' };
    }

    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|flac)$/i)) {
      return { valid: false, error: 'Formato inválido. Use MP3, WAV ou FLAC.' };
    }

    return { valid: true };
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

  const handleAudioUpload = (file: File) => {
    const validation = validateAudioFile(file);
    
    if (!validation.valid) {
      setModalTitle('Erro no arquivo');
      setModalMessage(validation.error || 'Arquivo inválido');
      setModalType('error');
      setModalCallback(null);
      setModalOpen(true);
      return;
    }

    // Criar URL para preview
    const url = URL.createObjectURL(file);
    setAudioPreviewUrl(url);
    
    // Obter duração do áudio
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(audio.duration);
    });

    setFormData(prev => ({ ...prev, audioFile: file }));
  };

  const handleImageUpload = (file: File) => {
    const validation = validateImageFile(file);
    
    if (!validation.valid) {
      setModalTitle('Erro no arquivo');
      setModalMessage(validation.error || 'Arquivo inválido');
      setModalType('error');
      setModalCallback(null);
      setModalOpen(true);
      return;
    }

    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    setFormData(prev => ({ ...prev, coverImage: file }));
  };

  const handleAudioDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActiveAudio(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleAudioUpload(file);
    }
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActiveImage(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const togglePlayPause = () => {
    if (audioPreviewRef.current) {
      if (isPlaying) {
        audioPreviewRef.current.pause();
      } else {
        audioPreviewRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.audioFile) {
      setModalTitle('Campo obrigatório');
      setModalMessage('Por favor, faça upload do arquivo de áudio.');
      setModalType('warning');
      setModalCallback(null);
      setModalOpen(true);
      return;
    }

    if (!formData.title) {
      setModalTitle('Campo obrigatório');
      setModalMessage('Por favor, preencha o título do hino.');
      setModalType('warning');
      setModalCallback(null);
      setModalOpen(true);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload do áudio
      setUploadProgress(10);
      let audioUrl = '';
      if (formData.audioFile) {
        const audioResult = await uploadApi.audio(formData.audioFile);
        if (audioResult.error) throw new Error(audioResult.error);
        audioUrl = audioResult.data?.url || '';
      }

      setUploadProgress(50);

      // 2. Upload da capa (se houver)
      let coverUrl = '';
      if (formData.coverImage) {
        const coverResult = await uploadApi.cover(formData.coverImage);
        if (coverResult.error) throw new Error(coverResult.error);
        coverUrl = coverResult.data?.url || '';
      }

      setUploadProgress(75);

      // 3. Formatar duração
      const durationStr = audioDuration > 0 ? formatDuration(audioDuration) : undefined;

      // 4. Criar hino no banco
      const hinoData: any = {
        titulo: formData.title.trim(),
        audio_url: audioUrl,
        cover_url: coverUrl || undefined,
        compositor: compositorNome || undefined,
        categoria: formData.genre || undefined,
        duracao: durationStr,
        letra: formData.lyrics || undefined,
        ativo: 0,
        status: 'pending',
      };

      if (composerId) hinoData.compositor_id = composerId;

      const result = await hinosApi.create(hinoData);

      if (result.error) throw new Error(result.error);
      if (!result.data) throw new Error('Falha ao salvar hino no banco de dados. Tente novamente.');

      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setModalTitle('Hino enviado');
        setModalMessage('Hino enviado com sucesso!');
        setModalType('success');
        setModalCallback(() => () => navigate('/composer/songs'));
        setModalOpen(true);
      }, 300);

    } catch (error: any) {
      console.error('❌ Erro ao enviar hino:', error);
      setIsUploading(false);
      setUploadProgress(0);
      setModalTitle('Erro no envio');
      setModalMessage(error.message || 'Erro ao enviar o hino. Tente novamente.');
      setModalType('error');
      setModalCallback(null);
      setModalOpen(true);
    }
  };

  const isFormValid = formData.title && formData.audioFile;

  return (
    <div className="min-h-screen bg-background-primary pb-20">
      {/* Header */}
      <div className="bg-background-secondary border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/composer/songs"
            className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Hinos
          </Link>
          <h1 className="text-3xl font-bold text-white">Enviar Novo Hino</h1>
          <p className="text-text-muted mt-2">
            Preencha os dados e faça upload do arquivo de áudio
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Upload de Áudio */}
          <div className="bg-background-secondary rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Arquivo de Áudio *</h2>
            
            {!formData.audioFile ? (
              <div
                onDrop={handleAudioDrop}
                onDragOver={handleDragOver}
                onDragEnter={() => setDragActiveAudio(true)}
                onDragLeave={() => setDragActiveAudio(false)}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                  dragActiveAudio
                    ? 'border-primary-400 bg-primary-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => audioInputRef.current?.click()}
              >
                <Music className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <p className="text-white font-medium mb-2">
                  Arraste o arquivo de áudio aqui
                </p>
                <p className="text-text-muted text-sm mb-4">
                  ou clique para selecionar
                </p>
                <p className="text-text-muted text-xs">
                  Formatos aceitos: MP3, WAV, FLAC (máx. 5GB)
                </p>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/flac,audio/mp3"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAudioUpload(file);
                  }}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-background-tertiary rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="text-white font-medium">{formData.audioFile.name}</p>
                      <p className="text-text-muted text-sm">
                        {(formData.audioFile.size / (1024 * 1024)).toFixed(2)} MB
                        {audioDuration > 0 && ` • ${formatDuration(audioDuration)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, audioFile: null }));
                        setAudioPreviewUrl('');
                        setAudioDuration(0);
                        setIsPlaying(false);
                      }}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {audioPreviewUrl && (
                  <audio
                    ref={audioPreviewRef}
                    src={audioPreviewUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full"
                    controls
                  />
                )}
              </div>
            )}
          </div>

          {/* Informações Básicas */}
          <div className="bg-background-secondary rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Informações Básicas</h2>
            
            <div>
              <label className="block text-white font-medium mb-2">
                Título do Hino *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ex: Amazing Grace"
                className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">
                  Álbum
                </label>
                <input
                  type="text"
                  value={formData.album}
                  onChange={(e) => handleInputChange('album', e.target.value)}
                  placeholder="Ex: Hinos Clássicos Vol. 1"
                  className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

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
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Ano de Lançamento
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                min="1900"
                max={new Date().getFullYear()}
                className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Capa do Hino */}
          <div className="bg-background-secondary rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Capa do Hino</h2>
            
            {!formData.coverImage ? (
              <div
                onDrop={handleImageDrop}
                onDragOver={handleDragOver}
                onDragEnter={() => setDragActiveImage(true)}
                onDragLeave={() => setDragActiveImage(false)}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragActiveImage
                    ? 'border-primary-400 bg-primary-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => imageInputRef.current?.click()}
              >
                <ImageIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-white font-medium mb-2">
                  Arraste a imagem aqui
                </p>
                <p className="text-text-muted text-sm mb-4">
                  ou clique para selecionar
                </p>
                <p className="text-text-muted text-xs">
                  Formatos aceitos: JPG, PNG, WEBP (máx. 5MB)<br />
                  Tamanho recomendado: 1000x1000px
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
              <div className="flex items-start gap-4">
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="w-32 h-32 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">{formData.coverImage.name}</p>
                  <p className="text-text-muted text-sm mb-3">
                    {(formData.coverImage.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, coverImage: null }));
                      setImagePreviewUrl('');
                    }}
                    className="text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    Remover imagem
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Letra e Créditos */}
          <div className="bg-background-secondary rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Letra e Créditos</h2>
            
            <div>
              <label className="block text-white font-medium mb-2">
                Letra Completa
              </label>
              <textarea
                value={formData.lyrics}
                onChange={(e) => handleInputChange('lyrics', e.target.value)}
                placeholder="Cole a letra completa do hino aqui..."
                rows={10}
                className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Créditos (Compositores, Produtores, etc.)
              </label>
              <textarea
                value={formData.credits}
                onChange={(e) => handleInputChange('credits', e.target.value)}
                placeholder="Ex: Compositor: João Silva&#10;Arranjo: Maria Santos&#10;Produção: Pedro Oliveira"
                rows={4}
                className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="bg-background-secondary rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Tags</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Adicione uma tag..."
                className="flex-1 px-4 py-2 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Adicionar
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-background-tertiary text-white rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-text-muted hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="bg-background-secondary rounded-xl p-6">
            {!isFormValid && (
              <div className="flex items-start gap-3 mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-500 font-medium">Campos obrigatórios pendentes</p>
                  <p className="text-text-muted text-sm mt-1">
                    Preencha o título e faça upload do arquivo de áudio para continuar.
                  </p>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Enviando hino...</span>
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
                onClick={() => navigate('/composer/songs')}
                disabled={isUploading}
                className="flex-1 px-6 py-3 border border-gray-700 text-white rounded-lg hover:bg-background-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!isFormValid || isUploading}
                className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Enviando...' : 'Publicar Hino'}
              </button>
            </div>
          </div>
        </form>
      </div>
      {/* AlertModal padrão da plataforma */}
      <AlertModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          if (modalCallback) modalCallback();
        }}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        buttonText="OK"
        buttonColor={modalType === 'success' ? 'green' : modalType === 'error' ? 'red' : 'amber'}
      />
    </div>
  );
};

export default ComposerUploadSong;
