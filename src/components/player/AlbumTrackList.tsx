import React from 'react';
import { Play, Trash2, Music } from 'lucide-react';

interface TrackLike {
  id: string | number;
  title: string;
  artist: string;
  duration?: string;
  coverUrl?: string;
  audio_url?: string;
}

interface Props {
  tracks: TrackLike[];
  currentTrack: any;
  isPlaying: boolean;
  onSelect: (t: any) => void;
  playbackContext?: { type: string; id?: string } | null;
  onRemoveFromPlaylist: (t: any) => void;
}

const AlbumTrackList: React.FC<Props> = ({ tracks, currentTrack, isPlaying, onSelect, playbackContext, onRemoveFromPlaylist }) => {
  if (!tracks || tracks.length === 0) return null;
  return (
    <div className="mt-6 bg-purple-500/10 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Music className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-bold text-white">Faixas do Álbum</h3>
      </div>
      <div className="space-y-1">
        {tracks.map((t, idx) => (
          <div
            key={String(t.id)}
            className={`group flex items-center justify-between gap-3 p-2 rounded-md transition-colors cursor-pointer ${
              currentTrack?.id === t.id ? 'bg-purple-500/30 border border-purple-400/30' : 'hover:bg-white/5'
            }`}
            onClick={() => onSelect(t)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                <img src={currentTrack?.coverUrl || 'https://picsum.photos/200/200'} alt={t.title} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${currentTrack?.id === t.id ? 'text-purple-300' : 'text-white'}`}>{t.title}</p>
                <p className="text-xs text-gray-400 truncate">{t.artist}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {playbackContext?.type === 'playlist' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveFromPlaylist(t); }}
                  className="p-2 rounded-full hover:bg-white/10"
                  title="Remover da playlist"
                >
                  <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </button>
              )}
              {t.duration ? <span className="text-[11px] text-gray-400">{t.duration}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlbumTrackList;
