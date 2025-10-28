import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Music, Image as ImageIcon, Save, X, FileAudio, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { albunsApi, uploadApi, hinosApi, categoriasApi, compositoresApi, type Hino } from '@/lib/api-client';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '@/styles/quill-custom.css';

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
  duration?: string;
  category_id?: string;
  status: 'draft' | 'pending' | 'published' | 'archived';
}

const ComposerCreateSong: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<FormData>({
    title: '',
    number: '',
    lyrics: '',
    album_id: '',
    key: '',
    tempo: '',
    status: 'draft'
  });

  const [albums, setAlbums] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successCover, setSuccessCover] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState<string>('');

  // Configuração do editor Quill (igual ao Admin)
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link'
  ];

  useEffect(() => {
    if (!user?.id) return; // aguarda usuário carregar
    loadInitialData();
  }, [user?.id, id]);

  // Limpeza dos ObjectURLs de preview
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      if (audioPreview) URL.revokeObjectURL(audioPreview);
    };
  }, [coverPreview, audioPreview]);

  const loadInitialData = async () => {
    try {
      setIsLoadingData(true);
      setLoadingAlbums(true);

      // 1) Resolver compositor_id do usuário logado
      let myComposerId: number | null = null;
      try {
        if (user?.id) {
          const comp = await compositoresApi.getByUsuarioId(user.id);
          const cdata: any = (comp as any)?.data || comp;
          if (cdata?.id) myComposerId = Number(cdata.id);
        }
      } catch {}

      // 2) Buscar álbuns do backend já filtrando por compositor_id (estrito)
      if (myComposerId == null) {
        setAlbums([]);
      } else {
        const albumsData = await albunsApi.list({ limit: 1000, compositor_id: myComposerId });
      // Normalizar múltiplos formatos possíveis
      let arr: any[] = [];
      try {
        const raw: any = albumsData as any;
        if (Array.isArray(raw?.albuns)) arr = raw.albuns;
        else if (Array.isArray(raw?.data?.albuns)) arr = raw.data.albuns;
        else if (Array.isArray(raw?.data?.data)) arr = raw.data.data;
        else if (Array.isArray(raw?.data)) arr = raw.data;
        else if (Array.isArray(raw)) arr = raw;
      } catch {}

      // 3) Garantir no cliente que só fiquem os do meu compositor_id
      const filtered: any[] = arr.filter((a: any) => String(a.compositor_id) === String(myComposerId));
      setAlbums(filtered);
      }
      // Carregar categorias do admin
      setLoadingCategories(true);
      const catsRes = await categoriasApi.list({ limit: 1000 });
      // Debug auxiliar
      console.log('Categorias API payload →', catsRes);
      if ((catsRes as any).error) {
        setCategories([]);
      } else if (catsRes.data) {
        const payload: any = catsRes.data;
        let arr: any[] = [];
        if (Array.isArray(payload)) {
          arr = payload;
        } else if (Array.isArray(payload.data)) {
          arr = payload.data; // PaginatedResponse.data
        } else if (payload.data && Array.isArray(payload.data.data)) {
          arr = payload.data.data; // Caso raro: data dentro de data
        } else if (Array.isArray(payload.categorias)) {
          arr = payload.categorias; // Outro formato possível
        }
        setCategories(arr);
      } else {
        setCategories([]);
      }
      // Se for edição, carregar dados do hino
      if (isEditMode && id) {
        try {
          const songRes = await hinosApi.get(Number(id));
          const song: any = (songRes as any)?.data || songRes;
          if (song && song.id) {
            setFormData(prev => ({
              ...prev,
              title: song.titulo || '',
              number: song.numero ? String(song.numero) : '',
              lyrics: song.letra || '',
              // category_id não é inferível a partir de nome; deixamos em branco
              duration: song.duracao || prev.duration,
            }));
            if (song.cover_url) setCoverPreview(song.cover_url);
            if (song.audio_url) {
              try {
                const signed = await getSignedPreviewUrl(song.audio_url);
                setAudioPreview(signed);
              } catch {
                setAudioPreview(song.audio_url);
              }
            }
          }
        } catch {}
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar álbuns');
    } finally {
      setIsLoadingData(false);
      setLoadingAlbums(false);
      setLoadingCategories(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      // Extrair duração do arquivo de áudio
      try {
        const url = URL.createObjectURL(file);
        const audio = new Audio();
        audio.src = url;
        audio.addEventListener('loadedmetadata', () => {
          if (!isNaN(audio.duration)) {
            const total = Math.floor(audio.duration);
            const mm = String(Math.floor(total / 60)).padStart(2, '0');
            const ss = String(total % 60).padStart(2, '0');
            setFormData(prev => ({ ...prev, duration: `${mm}:${ss}` }));
          }
          // Não revogar aqui para manter o preview de áudio
        }, { once: true });
        // Definir preview do áudio
        setAudioPreview(url);
      } catch {}
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      try {
        const url = URL.createObjectURL(file);
        setCoverPreview(url);
      } catch {}
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    // Validação mínima
    if (!formData.title || !formData.title.trim()) {
      setError('Título é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      // 1) Uploads (se houver)
      let coverUrl: string | undefined = undefined;
      let audioUrl: string | undefined = undefined;

      if (coverFile) {
        const up = await uploadApi.cover(coverFile);
        if (up.data?.url) coverUrl = up.data.url;
      }

      if (audioFile) {
        const up = await uploadApi.audio(audioFile);
        if (up.data?.url) audioUrl = up.data.url;
      }

      // Fallbacks para edição: se não houve upload, reaproveitar URLs atuais se forem http(s)
      if (!coverUrl && isEditMode && coverPreview && /^https?:/i.test(coverPreview)) {
        coverUrl = coverPreview;
      }
      if (!audioUrl && isEditMode && audioPreview && /^https?:/i.test(audioPreview)) {
        audioUrl = audioPreview;
      }

      // 2) Categoria como nome (tabela 'hinos' guarda texto)
      const categoriaNome = categories.find(c => String(c.id) === String(formData.category_id))?.nome || undefined;

      // 3) Compositor (usar nome do usuário logado)
      const compositorNome = (user as any)?.nome || (user as any)?.name || undefined;

      // 4) Normalizar duração (mm:ss)
      const normalizeDuration = (v?: string) => {
        if (!v) return undefined;
        const m = v.trim();
        const num = m.match(/^\d+:[0-5]?\d$/) ? m : (() => {
          const sec = parseInt(m, 10);
          if (!isNaN(sec)) {
            const total = Math.max(0, sec);
            const mm = String(Math.floor(total / 60)).padStart(2, '0');
            const ss = String(total % 60).padStart(2, '0');
            return `${mm}:${ss}`;
          }
          return m;
        })();
        return num;
      };

      // 5) Montar payload compatível com tabela 'hinos'
      const songData: any = {
        numero: formData.number ? parseInt(formData.number) : undefined,
        titulo: formData.title.trim(),
        compositor: compositorNome,
        categoria: categoriaNome,
        audio_url: audioUrl,
        cover_url: coverUrl,
        duracao: normalizeDuration(formData.duration),
        letra: formData.lyrics || undefined,
        ativo: formData.status === 'published' ? 1 : 0,
      };

      if (isEditMode && id) {
        await hinosApi.update(Number(id), songData);
        setSuccessTitle(songData.titulo || 'Hino');
        setSuccessCover(coverUrl || coverPreview || undefined);
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate('/composer/songs');
        }, 1800);
      } else {
        await hinosApi.create(songData);
        // Mostrar modal de sucesso com blur e dados do hino
        setSuccessTitle(songData.titulo || 'Hino');
        setSuccessCover(coverUrl || coverPreview || undefined);
        setShowSuccessModal(true);
        // Navegar automaticamente após breve intervalo (opcional)
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate('/composer/songs');
        }, 2200);
      }
    } catch (error) {
      console.error('Error creating song:', error);
      alert('Erro ao criar hino');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-6 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Arquivos e Mídia (clonado do Admin) */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Arquivos e Mídia
          </h2>

          {/* Capa do Hino */}
          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Capa do Hino
            </label>
            {/* Layout responsivo: thumb ao lado no desktop, abaixo no mobile */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="Preview da Capa"
                  className="w-28 h-28 md:w-32 md:h-32 rounded-lg object-cover border border-gray-800 flex-shrink-0"
                />
              )}
              <label className="flex-1 flex flex-col items-center justify-center h-32 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-gray-400 text-sm">
                  {coverFile ? coverFile.name : 'Arraste uma imagem ou clique para selecionar'}
                </span>
                <span className="text-gray-500 text-xs mt-1">PNG, JPG (máx. 5MB)</span>
                <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Arquivo de Áudio */}
          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2 flex items-center gap-2">
              <FileAudio className="w-4 h-4" />
              Arquivo de Áudio
            </label>
            <label className="flex flex-col items-center justify-center h-24 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
              <FileAudio className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-gray-400 text-sm">
                {audioFile ? audioFile.name : 'Selecionar arquivo de áudio'}
              </span>
              <span className="text-gray-500 text-xs mt-1">MP3, WAV (máx. 50MB)</span>
              <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
            </label>
            {/* Preview do Áudio */}
            {audioPreview && (
              <div className="mt-3 bg-gray-800/50 rounded-lg p-3 border border-gray-800">
                <p className="text-gray-400 text-sm mb-2">Preview do Áudio</p>
                <audio controls className="w-full">
                  <source src={audioPreview} />
                  Seu navegador não suporta o elemento de áudio.
                </audio>
              </div>
            )}
          </div>

          {/* Duração */}
          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duração
            </label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              placeholder="3:45"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
            />
            <p className="text-gray-500 text-xs mt-1">Formato: mm:ss (ex: 3:45)</p>
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Informações Básicas</h2>

          {/* Título e Número */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gray-400 text-sm font-semibold mb-2">Título do Hino *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: Saudosa Lembrança"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">Número</label>
              <input
                type="number"
                name="number"
                value={formData.number}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: 050"
              />
            </div>
          </div>

          {/* Álbum e Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">Álbum (Opcional)</label>
              <select
                name="album_id"
                value={formData.album_id}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sem álbum</option>
                {albums.map((album: any) => (
                  <option key={album.id} value={album.id}>
                    {album.titulo || album.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">Categoria</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sem categoria</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nome || c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Letra do Hino (clonada do Admin) */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-2">Letra do Hino</h2>
          <label className="block text-gray-400 text-sm font-semibold mb-2">Letra Completa</label>
          <div className="bg-white rounded-lg overflow-hidden">
            <ReactQuill
              theme="snow"
              value={formData.lyrics}
              onChange={(content) => setFormData(prev => ({ ...prev, lyrics: content }))}
              modules={modules}
              formats={formats}
              placeholder="Cole a letra completa do hino aqui..."
              className="h-96"
            />
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Use o editor para formatar a letra com quebras de linha, negrito, etc.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/composer/songs')}
            className="px-6 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading || !formData.title}
            className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-black rounded-lg font-medium hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {loading ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Criar Hino'}
          </button>
        </div>
      </form>
      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-b from-[#124e2a] to-[#000201] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              {successCover ? (
                <img src={successCover} alt="Capa" className="w-16 h-16 rounded object-cover border border-white/10" />
              ) : (
                <div className="w-16 h-16 rounded bg-white/10 flex items-center justify-center text-white/60">Capa</div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-lg font-bold truncate">{successTitle}</h3>
                <p className="text-white/80 text-sm">{isEditMode ? 'Hino atualizado com sucesso!' : 'Hino enviado com sucesso!'}</p>
              </div>
            </div>
            <p className="text-white/80 text-sm mb-6">Status: Em análise pelo Admin. Você será notificado após a revisão.</p>
            <div className="flex justify-end">
              <button
                onClick={() => { setShowSuccessModal(false); navigate('/composer/songs'); }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComposerCreateSong;
