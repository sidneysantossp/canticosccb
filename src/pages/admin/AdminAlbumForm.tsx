import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Disc } from 'lucide-react';
import { albunsApi, uploadApi, Album, Hino } from '@/lib/api-client';
import HinoSelector from '@/components/admin/HinoSelector';

const AdminAlbumForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    description: '',
    genre: '',
    total_tracks: '',
    release_date: '',
    status: 'published' as 'published' | 'draft'
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [selectedHinos, setSelectedHinos] = useState<Hino[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadAlbum(parseInt(id));
    }
  }, [id, isEditing]);

  const loadAlbum = async (albumId: number) => {
    try {
      setIsLoading(true);
      const response = await albunsApi.get(albumId);

      if (response.data) {
        const album = response.data;
        setFormData({
          title: album.title || album.titulo,
          artist: album.artist || '',
          description: album.description || album.descricao || '',
          genre: album.genre || '',
          total_tracks: album.total_tracks?.toString() || '',
          release_date: album.release_date || '',
          status: album.status || 'published'
        });
        setCoverPreview(album.cover_url || '');

        // Carregar hinos do álbum
        const hinosResponse = await albunsApi.listHinos(albumId);
        if (hinosResponse.data && hinosResponse.data.hinos) {
          setSelectedHinos(hinosResponse.data.hinos);
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar álbum:', error);
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
        descricao: formData.description.trim() || undefined,
        cover_url: coverUrl || undefined,
        ano: formData.release_date ? parseInt(formData.release_date) : undefined,
        ativo: formData.status === 'published' ? 1 : 0
      };

      let response;
      let albumId: number;

      if (isEditing && id) {
        response = await albunsApi.update(parseInt(id), albumData);
        albumId = parseInt(id);
      } else {
        response = await albunsApi.create(albumData);
        albumId = response.data?.id;
      }

      if (response.error) {
        throw new Error(response.error);
      }

      // Salvar hinos do álbum
      if (albumId && selectedHinos.length > 0) {
        const hinoIds = selectedHinos.map(h => h.id);
        await albunsApi.addHinos(albumId, hinoIds);
      }

      navigate('/admin/albuns');
    } catch (error: any) {
      console.error('Erro ao salvar álbum:', error);
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
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Hinário 5"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Artista
                </label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Congregação Cristã"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Gênero
                </label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Hinos Cantados"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Data de Lançamento
                </label>
                <input
                  type="date"
                  value={formData.release_date}
                  onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-green-600"
                placeholder="Descrição do álbum..."
              />
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
              className="flex-1 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center transition-colors"
            >
              Cancelar
            </Link>
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
