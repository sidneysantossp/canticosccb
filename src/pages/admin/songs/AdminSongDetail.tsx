import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Play, Heart, Share2, Download, TrendingUp } from 'lucide-react';

const AdminSongDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock data
  const song = {
    id: 1,
    thumbnail: 'https://picsum.photos/seed/detail1/400',
    title: 'Hino 50 - Saudosa Lembrança',
    composer: 'Coral CCB',
    category: 'Adoração',
    genre: 'Hino',
    number: '50',
    duration: '4:32',
    plays: 125400,
    likes: 8200,
    downloads: 3400,
    shares: 567,
    uploadDate: '2024-01-15',
    status: 'approved',
    lyrics: 'Saudosa lembrança\nDos dias que lá se vão...',
    tags: ['adoração', 'hino', 'CCB', 'clássico']
  };

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
                src={song.thumbnail}
                alt={song.title}
                className="w-48 h-48 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{song.title}</h2>
                <p className="text-gray-400 mb-4">{song.composer}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-primary-500/20 text-primary-400 text-sm rounded-full">
                    {song.category}
                  </span>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">
                    {song.genre}
                  </span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                    Aprovado
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/admin/songs/${id}/edit`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Letra</h3>
            <pre className="text-gray-300 whitespace-pre-wrap font-sans">{song.lyrics}</pre>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {song.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-gray-800 text-white rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
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
                <span className="text-white font-bold">{song.plays.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  <span className="text-gray-400">Likes</span>
                </div>
                <span className="text-white font-bold">{song.likes.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400">Downloads</span>
                </div>
                <span className="text-white font-bold">{song.downloads.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400">Compartilhamentos</span>
                </div>
                <span className="text-white font-bold">{song.shares.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Informações</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Número do Hino</p>
                <p className="text-white">{song.number}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Duração</p>
                <p className="text-white">{song.duration}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Data de Upload</p>
                <p className="text-white">{song.uploadDate}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Performance</h3>
            <div className="h-40 flex items-center justify-center text-gray-400">
              [Gráfico de Performance]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSongDetail;
