import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Play, Heart, Music } from 'lucide-react';
import { getSongById, Song } from '@/lib/admin/songsAdminApi';

const AdminSongDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadSong();
  }, [id]);

  const loadSong = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSongById(id!);
      setSong(data);
    } catch (err: any) {
      console.error('Error loading song:', err);
      setError(err?.message || 'Erro ao carregar hino');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando hino...</p>
        </div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <Music className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Hino não encontrado</h2>
          <p className="text-red-300 mb-4">{error || 'O hino solicitado não existe.'}</p>
          <button onClick={() => navigate('/admin/songs')} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
            Voltar para Hinos
          </button>
        </div>
      </div>
    );
  }

  const songAny = song as any;
  const stats = songAny?.song_stats || {};
  const composer = songAny?.composers;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/songs')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-3xl font-bold text-white">Detalhes do Hino</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex gap-6">
              <img
                src={song.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title || 'H')}&background=1f2937&color=9ca3af&size=400`}
                alt={song.title}
                className="w-48 h-48 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {songAny.number ? `Hino ${songAny.number} - ` : ''}{song.title}
                </h2>
                <p className="text-gray-400 mb-4">{composer?.artistic_name || composer?.name || 'Sem compositor'}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {songAny?.genres?.name && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">
                      {songAny.genres.name}
                    </span>
                  )}
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    song.status === 'published' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {song.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/admin/songs/edit/${id}`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {songAny.lyrics && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Letra</h3>
              <pre className="text-gray-300 whitespace-pre-wrap font-sans">{songAny.lyrics}</pre>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Estatísticas</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400">Plays</span>
                </div>
                <span className="text-white font-bold">{(stats.total_plays || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  <span className="text-gray-400">Likes</span>
                </div>
                <span className="text-white font-bold">{(stats.total_likes || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Informações</h3>
            <div className="space-y-3 text-sm">
              {songAny.number && (
                <div>
                  <p className="text-gray-400 mb-1">Número do Hino</p>
                  <p className="text-white">{songAny.number}</p>
                </div>
              )}
              {songAny.duration && (
                <div>
                  <p className="text-gray-400 mb-1">Duração</p>
                  <p className="text-white">{songAny.duration}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400 mb-1">Criado em</p>
                <p className="text-white">{song.created_at ? new Date(song.created_at).toLocaleDateString('pt-BR') : '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSongDetail;
