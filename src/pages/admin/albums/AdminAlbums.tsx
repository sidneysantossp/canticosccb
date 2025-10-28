import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Album,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Music,
  User,
  Calendar,
  MoreVertical
} from 'lucide-react';

const AdminAlbums: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const albums = [
    {
      id: 1,
      cover: 'https://picsum.photos/seed/alb1/300',
      title: 'Hinos da Congregação - Vol. 1',
      composer: 'Coral CCB',
      year: 2023,
      songsCount: 15,
      plays: '2.4M',
      releaseDate: '2023-06-15',
      status: 'published'
    },
    {
      id: 2,
      cover: 'https://picsum.photos/seed/alb2/300',
      title: 'Louvores e Adoração',
      composer: 'João Silva',
      year: 2024,
      songsCount: 12,
      plays: '145K',
      releaseDate: '2024-01-10',
      status: 'published'
    },
    {
      id: 3,
      cover: 'https://picsum.photos/seed/alb3/300',
      title: 'Paz do Senhor',
      composer: 'Maria Santos',
      year: 2023,
      songsCount: 10,
      plays: '89K',
      releaseDate: '2023-11-22',
      status: 'published'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Álbuns</h1>
          <p className="text-gray-400">Total de {albums.length} álbuns cadastrados</p>
        </div>
        <Link
          to="/admin/albums/create"
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Criar Álbum
        </Link>
      </div>

      {/* Search */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar álbum..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
          />
        </div>
      </div>

      {/* Albums Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.map((album) => (
          <div
            key={album.id}
            className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group"
          >
            <div className="relative aspect-square">
              <img
                src={album.cover}
                alt={album.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Link
                  to={`/admin/albums/${album.id}`}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  <Eye className="w-5 h-5 text-white" />
                </Link>
                <Link
                  to={`/admin/albums/${album.id}/edit`}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  <Edit className="w-5 h-5 text-white" />
                </Link>
                <button className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-white font-bold text-lg mb-1 truncate">{album.title}</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <User className="w-4 h-4" />
                  <span>{album.composer}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Music className="w-4 h-4" />
                  <span>{album.songsCount} faixas</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{album.year}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <p className="text-gray-400 text-sm">
                  {album.plays} plays
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAlbums;
