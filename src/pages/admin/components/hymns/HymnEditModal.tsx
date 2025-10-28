import React, { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '@/styles/quill-custom.css';
import { Music, XCircle, Image, FileAudio, Clock, Download } from 'lucide-react';
import MediaDropzone from '@/components/ui/MediaDropzone';
import { getHinoUrl, getAlbumCoverUrl } from '@/lib/config';
import { uploadApi, compositoresApi } from '@/lib/api-client';

interface EditForm {
  number: number;
  title: string;
  category: string;
  composer_name: string;
  cover_url: string;
  audio_url: string;
  duration: string;
  lyrics: string;
  status: 'published' | 'draft' | 'archived';
  allow_download: boolean;
}

interface Hymn {
  id: string;
  number: number;
  title: string;
}

interface Props {
  isOpen: boolean;
  hymn: Hymn | null;
  editForm: EditForm;
  setEditForm: React.Dispatch<React.SetStateAction<EditForm>>;
  onClose: () => void;
  onSave: () => void;
}

const HymnEditModal: React.FC<Props> = ({ isOpen, hymn, editForm, setEditForm, onClose, onSave }) => {
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link'],
      ['clean']
    ]
  }), []);

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link'
  ];

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [composers, setComposers] = useState<{ id: string; name: string; artistic_name?: string }[]>([]);
  const [loadingComposers, setLoadingComposers] = useState(false);
  const titleOk = (editForm.title || '').trim().length > 0;
  const numberOk = !!editForm.number && editForm.number > 0;
  const audioOk = (editForm.audio_url || '').trim().length > 0;
  const canSave = titleOk && numberOk && audioOk && !uploadingCover && !uploadingAudio;

  // Upload via API PHP (igual AdminSongForm)
  const uploadCoverFile = async (file: File): Promise<string | null> => {
    const res = await uploadApi.cover(file);
    if (res.error) {
      console.error('❌ Upload cover error:', res.error);
      return null;
    }
    return res.data?.url || null;
  };

  const uploadAudioFile = async (file: File): Promise<string | null> => {
    const res = await uploadApi.audio(file);
    if (res.error) {
      console.error('❌ Upload audio error:', res.error);
      return null;
    }
    return res.data?.url || null;
  };

  // Load composers (must be before any conditional returns to preserve hook order)
  useEffect(() => {
    const loadComposers = async () => {
      try {
        setLoadingComposers(true);
        const res = await compositoresApi.list({ limit: 200 });
        const arr = (res.data?.data || []) as any[];
        setComposers(arr.map((c: any) => ({ id: String(c.id), name: c.nome, artistic_name: c.nome_artistico })));
      } catch (e) {
        console.error('Erro ao carregar compositores:', e);
        setComposers([]);
      } finally {
        setLoadingComposers(false);
      }
    };
    loadComposers();
  }, []);

  // Extrair duração automaticamente quando áudio existente for carregado
  useEffect(() => {
    if (!editForm.audio_url || (editForm.duration && editForm.duration !== '00:00')) {
      return; // Já tem duração ou não tem áudio
    }

    const extractDuration = async () => {
      try {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.src = getPreviewUrl(editForm.audio_url, 'audio');
        
        await new Promise<void>((resolve, reject) => {
          audio.onloadedmetadata = () => resolve();
          audio.onerror = () => reject(new Error('Não foi possível ler a duração'));
          setTimeout(() => reject(new Error('Timeout ao carregar áudio')), 10000);
        });

        const secs = Math.round(audio.duration || 0);
        const mm = Math.floor(secs / 60).toString().padStart(2, '0');
        const ss = Math.floor(secs % 60).toString().padStart(2, '0');
        
        setEditForm(prev => ({ ...prev, duration: `${mm}:${ss}` }));
        console.log('✅ Duração extraída:', `${mm}:${ss}`);
      } catch (err) {
        console.error('⚠️ Não foi possível extrair duração:', err);
      }
    };

    extractDuration();
  }, [editForm.audio_url]);

  // Helper para obter URL de preview (usa API de streaming se for arquivo do MySQL)
  const getPreviewUrl = (url: string, type: 'audio' | 'cover'): string => {
    console.log('🔍 getPreviewUrl called:', { url, type });
    
    if (!url) {
      console.log('⚠️ Empty URL, returning empty string');
      return '';
    }
    
    // Se já for uma URL completa (http/https), retorna como está
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('✅ Full URL detected, returning as is');
      return url;
    }
    
    // Se for apenas nome de arquivo, usa API de streaming
    let streamUrl = '';
    if (type === 'audio') {
      streamUrl = getHinoUrl(url); // gera /api/stream.php?type=hinos&file=...
    } else {
      streamUrl = getAlbumCoverUrl(url); // gera /api/stream.php?type=albuns&file=...
    }
    
    console.log('🔗 Generated streaming URL:', streamUrl);
    return streamUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-background-primary rounded-xl max-w-6xl w-full p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {hymn ? `Editar Hino #${hymn.number}` : 'Novo Hino'}
            </h2>
            <p className="text-gray-400">
              {hymn ? 'Atualize as informações do hino' : 'Preencha os dados para criar um novo hino'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-background-tertiary rounded-lg transition-colors">
            <XCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Informações Básicas */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Music className="w-5 h-5" />
              Informações Básicas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Número do Hino *</label>
                <input
                  type="number"
                  value={editForm.number}
                  onChange={(e) => setEditForm({ ...editForm, number: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Status *</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'published' | 'draft' | 'archived' })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="published">Publicado</option>
                  <option value="draft">Rascunho</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Título *</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="Nome do hino"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Categoria</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="Cantados">Cantados</option>
                  <option value="Tocados">Tocados</option>
                  <option value="Avulsos">Avulsos</option>
                </select>
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Compositor</label>
                <select
                  value={editForm.composer_name}
                  onChange={(e) => setEditForm({ ...editForm, composer_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Selecione um compositor</option>
                  {loadingComposers ? (
                    <option value="" disabled>Carregando...</option>
                  ) : (
                    composers.map(c => {
                      const label = c.artistic_name || c.name;
                      return (
                        <option key={c.id} value={label}>{label}</option>
                      );
                    })
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Arquivos e Mídia */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Arquivos e Mídia</h3>
            {/* Upload Capa (imagem) */}
            <div>
              <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
                <Image className="w-4 h-4" />
                Capa do Hino
              </label>
              
              {/* Preview da capa existente */}
              {editForm.cover_url && (
                <div className="mb-3 relative">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-800">
                    <img
                      src={getPreviewUrl(editForm.cover_url, 'cover')}
                      alt="Capa atual"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('❌ Erro ao carregar capa');
                        e.currentTarget.src = 'https://via.placeholder.com/300x300/1db954/ffffff?text=Erro+ao+Carregar';
                      }}
                    />
                    <button
                      onClick={() => setEditForm({ ...editForm, cover_url: '' })}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                      title="Remover capa"
                    >
                      <XCircle className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Capa atual carregada</p>
                </div>
              )}
              
              {/* Upload de nova capa */}
              <MediaDropzone
                currentUrl=""
                accept="image/*"
                allowVideo={false}
                isUploading={uploadingCover}
                onFileSelect={async (file) => {
                  console.log('🖼️ Cover file selected:', file.name);
                  try {
                    setUploadingCover(true);
                    console.log('⏳ Uploading cover...');
                    const publicUrl = await uploadCoverFile(file);
                    if (publicUrl) {
                      console.log('✅ Cover uploaded, updating form');
                      setEditForm({ ...editForm, cover_url: publicUrl });
                    } else {
                      console.error('❌ Upload retornou null');
                      alert('Falha ao enviar capa. Verifique o console para detalhes.');
                    }
                  } catch (err: any) {
                    console.error('❌ Exception ao enviar capa:', err);
                    alert(`Falha ao enviar capa: ${err?.message || 'Erro desconhecido'}`);
                  } finally {
                    console.log('🏁 Upload cover finalizado');
                    setUploadingCover(false);
                  }
                }}
                onRemove={() => {}}
              />
            </div>
            {/* Upload Áudio */}
            <div>
              <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
                <FileAudio className="w-4 h-4" />
                Arquivo de Áudio
              </label>
              
              {/* Preview do áudio existente */}
              {editForm.audio_url && (
                <div className="mb-3 relative">
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                      <Music className="w-5 h-5 text-primary-500" />
                      <div className="flex-1">
                        <p className="text-white font-medium">Áudio atual</p>
                        <p className="text-xs text-gray-400">Duração: {editForm.duration || '00:00'}</p>
                      </div>
                      <button
                        onClick={() => setEditForm({ ...editForm, audio_url: '', duration: '' })}
                        className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                        title="Remover áudio"
                      >
                        <XCircle className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <audio
                      src={getPreviewUrl(editForm.audio_url, 'audio')}
                      controls
                      className="w-full"
                      onError={(e) => {
                        console.error('❌ Erro ao carregar áudio:', e);
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Upload de novo áudio */}
              <MediaDropzone
                currentUrl=""
                accept="audio/*"
                allowVideo={false}
                isUploading={uploadingAudio}
                onFileSelect={async (file) => {
                  try {
                    setUploadingAudio(true);
                    // Upload primeiro
                    const publicUrl = await uploadAudioFile(file);
                    if (!publicUrl) {
                      alert('Falha ao enviar áudio');
                      return;
                    }
                    // Extrair duração do arquivo local
                    const audio = document.createElement('audio');
                    audio.preload = 'metadata';
                    const objectUrl = URL.createObjectURL(file);
                    audio.src = objectUrl;
                    await new Promise<void>((resolve, reject) => {
                      audio.onloadedmetadata = () => resolve();
                      audio.onerror = () => reject(new Error('Não foi possível ler a duração')); 
                    });
                    const secs = Math.round(audio.duration || 0);
                    URL.revokeObjectURL(objectUrl);
                    const mm = Math.floor(secs / 60).toString().padStart(2, '0');
                    const ss = Math.floor(secs % 60).toString().padStart(2, '0');
                    setEditForm({ ...editForm, audio_url: publicUrl, duration: `${mm}:${ss}` });
                  } catch (err) {
                    console.error('Erro ao enviar áudio:', err);
                    alert('Falha ao enviar áudio');
                  } finally {
                    setUploadingAudio(false);
                  }
                }}
                onRemove={() => {}}
              />
              {!audioOk && (
                <p className="text-xs text-red-400 mt-2">Áudio é obrigatório para salvar.</p>
              )}
            </div>
            {/* Duração exibida (somente leitura, calculada do arquivo) */}
            <div>
              <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duração
              </label>
              <input
                type="text"
                value={editForm.duration}
                readOnly
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none"
                placeholder="00:00"
              />
            </div>
          </div>

          {/* Permissões */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Permissões</h3>
            <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <input
                type="checkbox"
                id="allow_download"
                checked={editForm.allow_download}
                onChange={(e) => setEditForm({ ...editForm, allow_download: e.target.checked })}
                className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="allow_download" className="flex-1 cursor-pointer">
                <div className="text-white font-medium">Permitir Download</div>
                <div className="text-gray-400 text-sm">
                  Quando ativado, usuários poderão baixar este hino. Desative se houver restrições de direitos autorais.
                </div>
              </label>
              <Download className="w-5 h-5 text-gray-500" />
            </div>
          </div>

          {/* Letra do Hino */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Letra do Hino</h3>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Letra Completa</label>
              <div className="bg-white rounded-lg overflow-hidden" style={{ minHeight: '350px' }}>
                <ReactQuill
                  theme="snow"
                  value={editForm.lyrics}
                  onChange={(content) => setEditForm({ ...editForm, lyrics: content })}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Cole a letra completa do hino aqui..."
                  style={{ height: '300px' }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Use o editor para formatar a letra com quebras de linha, negrito, etc.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button onClick={onClose} className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors">
            Cancelar
          </button>
          <div className="flex-1">
            {!numberOk && (
              <p className="text-xs text-red-400 mb-1">Número do hino é obrigatório e deve ser maior que 0.</p>
            )}
            {!titleOk && (
              <p className="text-xs text-red-400 mb-1">Título é obrigatório.</p>
            )}
            {(uploadingCover || uploadingAudio) && (
              <p className="text-xs text-yellow-400 mb-1">Aguarde o término do upload...</p>
            )}
            <button
              onClick={() => {
                if (!canSave) return;
                onSave();
              }}
              disabled={!canSave}
              className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                canSave ? 'bg-primary-500 hover:bg-primary-600 text-black' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HymnEditModal;
