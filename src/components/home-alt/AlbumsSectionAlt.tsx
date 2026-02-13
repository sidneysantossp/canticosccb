import React from 'react';
import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';
import { buildAlbumUrl } from '@/utils/slugUrl';

interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
}

interface AlbumsSectionAltProps {
  albums: Album[];
  isDarkMode: boolean;
}

const AlbumsSectionAlt: React.FC<AlbumsSectionAltProps> = ({ albums, isDarkMode }) => {
  if (!albums || albums.length === 0) return null;

  return (
    <div className="px-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Álbuns
        </h2>
        <Link
          to="/albuns"
          className={`text-sm font-semibold hover:underline ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Ver todos
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {albums.slice(0, 12).map((album) => (
          <Link
            key={album.id}
            to={buildAlbumUrl(album.id, album.title, album.artist)}
            className={`group rounded-lg overflow-hidden transition-all duration-300 ${
              isDarkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <div className="aspect-square relative overflow-hidden">
              {album.coverUrl ? (
                <img
                  src={album.coverUrl}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                }`}>
                  <Music className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} size={48} />
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className={`font-semibold text-sm truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {album.title}
              </h3>
              <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {album.artist}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AlbumsSectionAlt;
