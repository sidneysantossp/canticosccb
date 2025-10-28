import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Music, Image as ImageIcon, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { albunsApi, uploadApi, hinosApi, compositoresApi } from '@/lib/api-client';

// Helper: assina URL do stream.php para preview (edit mode)
const getSignedPreviewUrl = async (original: string): Promise<string> => {
  try {
    if (!original) return '';
    if (original.startsWith('blob:') || original.startsWith('data:')) return original;
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const u = new URL(original, window.location.origin);
    let file = '';
    const type = 'hinos';
    if (u.pathname.includes('/api/stream.php')) {
      file = u.searchParams.get('file') || '';
    } else {
      const base = u.pathname.split('/').pop() || '';
      if (/\.(mp3|m4a|wav)$/i.test(base)) file = base;
      else if (/^[a-z0-9._-]+\.(mp3|m4a|wav)$/i.test(original)) file = original;
    }
    if (!file) return original;
    const signUrl = `http://${host}/1canticosccb/api/media/sign.php?type=${encodeURIComponent(type)}&file=${encodeURIComponent(file)}`;
    const resp = await fetch(signUrl);
    if (!resp.ok) return original;
    const j = await resp.json();
    if (!j?.ok || !j.sig || !j.exp) return original;
    return `http://${host}/1canticosccb/api/stream.php?type=${type}&file=${encodeURIComponent(file)}&sig=${j.sig}&exp=${j.exp}`;
  } catch {
    return original;
  }
};

interface FormData {
  title: string;
  number: string;
  lyrics: string;
  album_id: string;
  key: string;
  tempo: string;
  status: 'draft' | 'published' | 'archived';
  participants: string; // Outros compositores/participantes
  registered_by_composer: boolean; // Registrado pelo próprio compositor
}

const ComposerSongForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Verificar se é o próprio compositor ou um gerente
  const isOwnComposer = !(user as any)?.managing_composer_id; // Se não está gerenciando, é o próprio
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    number: '',
    lyrics: '',
    album_id: '',
    key: '',
    tempo: '',
    status: 'draft',
    participants: '',
    registered_by_composer: isOwnComposer
  });

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

      // Carregar álbuns do compositor (apenas os criados por ele)
      const albumsData = await albunsApi.list({ limit: 1000, usuario_id: (user as any)?.id });
      try {
        const raw: any = albumsData as any;
        let arr: any[] = [];
        if (Array.isArray(raw?.albuns)) arr = raw.albuns;
        else if (Array.isArray(raw?.data?.albuns)) arr = raw.data.albuns;
        else if (Array.isArray(raw?.data?.data)) arr = raw.data.data;
        else if (Array.isArray(raw?.data)) arr = raw.data;
        else if (Array.isArray(raw)) arr = raw;

        // Resolver compositor_id do usuário e filtrar by compositor_id para garantir
        let myComposerId: number | null = null;
        try {
          if ((user as any)?.id) {
            const comp = await compositoresApi.getByUsuarioId((user as any).id);
            const cdata: any = (comp as any)?.data || comp;
            if (cdata?.id) myComposerId = Number(cdata.id);
          }
        } catch {}

        let filtered = arr;
        if (myComposerId != null) {
          filtered = arr.filter((a: any) => String(a.compositor_id) === String(myComposerId));
        }
        setAlbums(filtered);
      } catch {
        setAlbums([]);
      }

      // Se estiver editando, carregar dados do hino
      if (isEditMode && id) {
        const songRes = await hinosApi.get(Number(id));
        if (!songRes.error && songRes.data) {
          const song: any = songRes.data;
          setFormData({
            title: song.titulo || '',
            number: song.numero ? String(song.numero) : '',
            lyrics: song.letra || '',
            album_id: '',
            key: '',
            tempo: '',
            status: song.ativo ? 'published' : 'draft',
            participants: '',
            registered_by_composer: isOwnComposer
          });
          setCoverPreview(song.cover_url || '');
          if (song.audio_url) {
            try {
              const signed = await getSignedPreviewUrl(song.audio_url);
              setAudioPreview(signed);
            } catch {
              setAudioPreview(song.audio_url || '');
            }
          } else {
            setAudioPreview('');
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Imagem muito grande. Máximo 5MB.');
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
        setError('Áudio muito grande. Máximo 50MB.');
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
        
        setFormData(prev => ({ ...prev, tempo: durationStr }));
      } catch (err) {
        console.error('Erro ao extrair duração:', err);
      }
    }
  };

  const uploadFile = async (file: File, type: 'cover' | 'audio'): Promise<string | null> => {
    try {
      const res = type === 'cover' ? await uploadApi.cover(file) : await uploadApi.audio(file);
      if (res.error) throw new Error(res.error);
      return res.data?.url || null;
    } catch (error: any) {
      console.error('Erro no upload:', error);
      setError(error.message || 'Erro no upload de arquivo');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!formData.title.trim()) {
        throw new Error('Título é obrigatório');
      }

      if (!(user as any)?.nome_artistico) {
        throw new Error('Compositor não identificado');
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

      // Montar payload
      const payload = {
        numero: formData.number ? parseInt(formData.number) : undefined,
        titulo: formData.title.trim(),
        compositor: (user as any).nome_artistico, // Nome do compositor logado
        categoria: undefined,
        audio_url: audioUrl || undefined,
        cover_url: coverUrl || undefined,
        duracao: formData.tempo || undefined,
        letra: formData.lyrics.trim() || undefined,
        tags: undefined,
        ativo: formData.status === 'published' ? 1 : 0,
      };

      if (isEditMode && id) {
        const res = await hinosApi.update(Number(id), payload);
        if (res.error) throw new Error(res.error);
      } else {
        const res = await hinosApi.create(payload);
        if (res.error) throw new Error(res.error);
      }

      navigate('/composer/songs');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      setError(error.message || 'Erro ao salvar hino');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/composer/songs')}
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
                  {album.titulo}
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

          {/* Participants */}
          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">
              Outros Compositores/Participantes
            </label>
            <input
              type="text"
              name="participants"
              value={formData.participants}
              onChange={handleInputChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: João Silva, Maria Santos (separados por vírgula)"
            />
            <p className="text-gray-500 text-xs mt-1">
              Adicione outros compositores ou participantes que contribuíram para este hino
            </p>
          </div>

          {/* Registered by Composer Checkbox */}
          <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <input
              type="checkbox"
              name="registered_by_composer"
              checked={formData.registered_by_composer}
              disabled
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-primary-500 focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            />
            <div>
              <label className="text-white font-semibold cursor-default">
                {isOwnComposer ? 'Registrado pelo próprio compositor' : 'Registrado por gerente de conta'}
              </label>
              <p className="text-gray-500 text-xs mt-0.5">
                Este campo é marcado automaticamente para garantir a autenticidade do cadastro
              </p>
            </div>
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
                Duração (será calculada automaticamente)
              </label>
              <input
                type="text"
                name="tempo"
                value={formData.tempo}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: 04:20"
                readOnly
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
              Arquivo de Áudio *
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

        {/* Status */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Status</h2>

          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">
              Status da Publicação
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
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isLoading || isLoadingData}
            className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="w-5 h-5" />
            {isLoading ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Criar Hino'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/composer/songs')}
            className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComposerSongForm;
