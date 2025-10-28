import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Edit, Trash2, Video } from 'lucide-react';
import { Banner } from '@/lib/admin/bannersAdminApi';

interface Props {
  banner: Banner;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string, title: string) => void;
}

const BannerListItem: React.FC<Props> = ({ banner, onToggleActive, onDelete }) => {
  const isVideo = banner.image_url.includes('.mp4') || banner.image_url.includes('.webm') || banner.image_url.includes('.mov');

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
      <div className="flex gap-4">
        <div className="w-64 h-32 bg-gray-800 flex-shrink-0 relative">
          {isVideo ? (
            <>
              <video
                src={banner.image_url}
                className="w-full h-full object-cover"
                muted
                loop
                autoPlay
                playsInline
                preload="auto"
                onLoadedData={(e) => {
                  const video = e.target as HTMLVideoElement;
                  video.currentTime = 0;
                  video.play().catch(() => {});
                }}
              />
              <div className="absolute top-2 left-2 bg-black/50 rounded px-2 py-1 flex items-center gap-1">
                <Video className="w-3 h-3 text-white" />
                <span className="text-white text-xs">Vídeo</span>
              </div>
            </>
          ) : (
            <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
          )}
        </div>

        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-white font-semibold text-lg">{banner.title}</h3>
              <span className="text-gray-500 text-sm">Posição: {banner.position}</span>
              <span
                className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                  banner.is_active
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-700 text-gray-400 border border-gray-600'
                }`}
              >
                {banner.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            {banner.description && <p className="text-gray-400 text-sm mb-2">{banner.description}</p>}
            {banner.link_url && <p className="text-blue-400 text-sm">Link: {banner.link_url}</p>}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onToggleActive(banner.id, banner.is_active)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                banner.is_active ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {banner.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {banner.is_active ? 'Desativar' : 'Ativar'}
            </button>
            <Link to={`/admin/banners/editar/${banner.id}`} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Edit className="w-4 h-4 text-blue-400" />
            </Link>
            <button onClick={() => onDelete(banner.id, banner.title)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerListItem;
