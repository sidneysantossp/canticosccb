import React from 'react';
import { Star, Play, Heart, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Hymn } from '@/lib/admin/hymnsAdminApi';

interface Props {
  hymns: Hymn[];
  getStatusBadge: (status: string) => React.ReactNode;
  onToggleFeatured: (hymnId: string, currentFeatured: boolean) => void;
  onEdit: (hymn: Hymn) => void;
  onDelete: (hymnId: string, hymnTitle: string) => void;
}

const HymnsTable: React.FC<Props> = ({ hymns, getStatusBadge, onToggleFeatured, onEdit, onDelete }) => {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50 border-b border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Hino</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Gênero</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estatísticas</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {hymns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Nenhum hino encontrado</td>
              </tr>
            ) : (
              hymns.map((hymn) => (
                <tr key={hymn.id} className="hover:bg-gray-800/30 transition-colors">
                  {/* Number */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {hymn.is_featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                      {hymn.is_featured && (
                        <span className="text-yellow-500 font-mono text-sm">★</span>
                      )}
                      <span className="text-gray-400 font-mono">{hymn.number}</span>
                    </div>
                  </td>

                  {/* Title */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={hymn.cover_url || `https://picsum.photos/seed/hymn${hymn.number}/100`}
                        alt={hymn.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-white font-semibold">{hymn.title}</p>
                        <p className="text-gray-400 text-sm">{hymn.composer_name || 'Compositor CCB'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Genre/Category */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-300">{hymn.category || 'Hinos Cantados'}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(hymn.status)}</td>

                  {/* Stats */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Play className="w-4 h-4" />
                        {hymn.plays_count || 0}
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Heart className="w-4 h-4" />
                        {hymn.likes_count || 0}
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {/* Toggle Status */}
                      <button
                        className={`p-2 rounded-lg transition-colors ${
                          hymn.status === 'published'
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                        title={hymn.status === 'published' ? 'Despublicar' : 'Publicar'}
                      >
                        {hymn.status === 'published' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </button>

                      {/* Toggle Featured */}
                      <button
                        onClick={() => onToggleFeatured(hymn.id, hymn.is_featured || false)}
                        className={`p-2 rounded-lg transition-colors ${
                          hymn.is_featured
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                        title={
                          hymn.is_featured
                            ? 'Remover dos destaques (Hinos Populares)'
                            : 'Adicionar aos destaques (Hinos Populares)'
                        }
                      >
                        <Star className={`w-4 h-4 ${hymn.is_featured ? 'fill-yellow-400' : ''}`} />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(hymn)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(hymn.id, hymn.title)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HymnsTable;
