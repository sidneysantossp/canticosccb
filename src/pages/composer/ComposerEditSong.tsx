import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Music,
  FileText,
  Hash,
  Tag,
  Save,
  Eye,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
// import { 
//   getComposerSong, 
//   updateSong, 
//   deleteSong,
//   type ComposerSong 
// } from '@/lib/composerSongsApiSimple';

// Stubs temporários
type ComposerSong = any;
const getComposerSong = async (id: string) => ({ 
  title: 'Mock Song', 
  id, 
  composer_id: '1', 
  number: '1', 
  lyrics: '', 
  duration: '3:00', 
  key: 'C', 
  tempo: '120', 
  status: 'draft' as const 
});
const updateSong = async (id: string, data: any) => ({ success: true });
const deleteSong = async (id: string) => ({ success: true });

const ComposerEditSong: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; title: string; message: string; onClose?: () => void }>({ open: false, title: '', message: '' });
  const [song, setSong] = useState<ComposerSong | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    number: '',
    lyrics: '',
    duration: '',
    key: '',
    tempo: '',
    status: 'draft' as 'draft' | 'pending' | 'published'
  });

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Carregar dados da música
  useEffect(() => {
    const loadSong = async () => {
      if (!id) {
        navigate('/composer/songs');
        return;
      }

      setLoading(true);
      try {
        const songData = await getComposerSong(id);
        if (!songData) {
          setModal({ open: true, title: 'Não encontrado', message: 'Música não encontrada.', onClose: () => navigate('/composer/songs') });
          return;
        }

        setSong(songData);
        setFormData({
          title: songData.title,
          number: songData.number?.toString() || '',
          lyrics: songData.lyrics || '',
          duration: songData.duration || '',
          key: songData.key || '',
          tempo: songData.tempo?.toString() || '',
          status: songData.status
        });
      } catch (error) {
        console.error('Error loading song:', error);
        setModal({ open: true, title: 'Erro', message: 'Erro ao carregar música.', onClose: () => navigate('/composer/songs') });
        return;
      } finally {
        setLoading(false);
      }
    };

    loadSong();
  }, [id, user?.id, navigate]);

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
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !song) return;

    setSaving(true);
    try {
      const updates = {
        title: formData.title,
        number: formData.number ? parseInt(formData.number) : undefined,
        lyrics: formData.lyrics || undefined,
        duration: formData.duration || undefined,
        key: formData.key || undefined,
        tempo: formData.tempo ? parseInt(formData.tempo) : undefined,
        status: formData.status
      };

      await updateSong(id, updates);
      
      setModal({ open: true, title: 'Sucesso', message: 'Hino atualizado com sucesso!', onClose: () => navigate('/composer/songs') });
    } catch (error) {
      console.error('Error updating song:', error);
      setModal({ open: true, title: 'Erro', message: 'Erro ao atualizar música.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !song) return;
    
    // Confirm modal simplificado
    if (!window.confirm(`Tem certeza que deseja excluir "${song.title}"? Esta ação não pode ser desfeita.`)) return;

    try {
      await deleteSong(id);
      setModal({ open: true, title: 'Sucesso', message: 'Música excluída com sucesso!', onClose: () => navigate('/composer/songs') });
    } catch (error) {
      console.error('Error deleting song:', error);
      setModal({ open: true, title: 'Erro', message: 'Erro ao excluir música.' });
    }
  };

  const handlePreview = () => {
    setModal({ open: true, title: 'Preview', message: 'Preview em desenvolvimento.' });
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-16">
          <Music className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Música não encontrada</h3>
          <button
            onClick={() => navigate('/composer/songs')}
            className="text-primary-400 hover:text-primary-300"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/composer/songs')}
          className="p-2 text-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">Editar Hino</h1>
          <p className="text-text-muted">Editando: {song.title}</p>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Excluir
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Music className="w-5 h-5" />
            Informações Básicas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Título *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ex: Hino 450 - A Voz de Jesus"
                className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Número do Hino
              </label>
              <input
                type="number"
                name="number"
                value={formData.number}
                onChange={handleInputChange}
                placeholder="450"
                className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Duração
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="4:15"
                className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="draft">Rascunho</option>
                <option value="pending">Aguardando Revisão</option>
                <option value="published">Publicado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Musical Info */}
        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Informações Musicais
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Tom/Escala
              </label>
              <input
                type="text"
                name="key"
                value={formData.key}
                onChange={handleInputChange}
                placeholder="Ex: C, G, Am, F#"
                className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Tempo (BPM)
              </label>
              <input
                type="number"
                name="tempo"
                value={formData.tempo}
                onChange={handleInputChange}
                placeholder="120"
                className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Lyrics */}
        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Letra
          </h2>
          
          <textarea
            name="lyrics"
            value={formData.lyrics}
            onChange={handleInputChange}
            placeholder="Digite a letra do hino aqui..."
            rows={12}
            className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* File Uploads */}
        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Arquivos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Files Info */}
            <div className="md:col-span-2 mb-4">
              <div className="bg-background-tertiary rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Arquivos Atuais:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-text-muted" />
                    <span className="text-text-muted">
                      Áudio: {song.audio_url ? 'Arquivo carregado' : 'Nenhum arquivo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-text-muted" />
                    <span className="text-text-muted">
                      Capa: {song.cover_url ? 'Imagem carregada' : 'Nenhuma imagem'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Upload */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Novo Arquivo de Áudio
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full px-4 py-8 bg-background-tertiary border-2 border-dashed border-gray-600 rounded-lg text-center hover:border-primary-500 transition-colors">
                  <Music className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-text-muted text-sm">
                    {audioFile ? audioFile.name : 'Clique para substituir áudio'}
                  </p>
                  <p className="text-text-muted text-xs mt-1">MP3, WAV, FLAC</p>
                </div>
              </div>
            </div>

            {/* Cover Upload */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nova Capa do Hino
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full px-4 py-8 bg-background-tertiary border-2 border-dashed border-gray-600 rounded-lg text-center hover:border-primary-500 transition-colors">
                  <Tag className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-text-muted text-sm">
                    {coverFile ? coverFile.name : 'Clique para substituir imagem'}
                  </p>
                  <p className="text-text-muted text-xs mt-1">JPG, PNG, WebP</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <button
            type="button"
            onClick={handlePreview}
            className="flex items-center gap-2 px-6 py-3 bg-background-secondary border border-gray-700 text-white rounded-lg hover:bg-background-hover transition-colors"
          >
            <Eye className="w-5 h-5" />
            Visualizar
          </button>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/composer/songs')}
              className="px-6 py-3 bg-background-secondary border border-gray-700 text-white rounded-lg hover:bg-background-hover transition-colors"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={saving || !formData.title}
              className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-black rounded-lg font-medium hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </form>
      {modal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#124e2a] to-[#000201] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">{modal.title}</h3>
            <p className="text-white/80 text-sm mb-6">{modal.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => { setModal({ open: false, title: '', message: '' }); modal.onClose && modal.onClose(); }}
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

export default ComposerEditSong;
