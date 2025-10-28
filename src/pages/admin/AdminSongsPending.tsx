/**
 * ⚠️ ARQUIVO OBSOLETO - NÃO USAR!
 * Use: src/pages/admin/songs/AdminSongsPending.tsx
 * 
 * Este arquivo foi substituído por uma versão atualizada
 * com modais customizados e sistema de toast.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Eye, Clock, Music } from 'lucide-react';
import { getAllSongs, updateSong, Song } from '@/lib/admin/songsAdminApi';

const AdminSongsPending: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadSongs();
  }, [currentPage]);

  const loadSongs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Buscar apenas músicas com status 'draft' (pendentes)
      const result = await getAllSongs(currentPage, 20, { status: 'draft', search: '' });
      setSongs(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.count);
    } catch (error: any) {
      console.error('Error loading pending songs:', error);
      setError(error?.message || 'Erro ao carregar músicas pendentes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, title: string) => {
    if (!window.confirm(`Aprovar e publicar "${title}"?`)) return;

    try {
      await updateSong(id, { status: 'published' });
      loadSongs();
    } catch (error) {
      console.error('Error approving song:', error);
    }
  };

  const handleReject = async (id: string, title: string) => {
    if (!window.confirm(`Rejeitar "${title}"? Essa ação não pode ser desfeita.`)) return;

    try {
      // Você pode criar um status 'rejected' ou deletar
      await updateSong(id, { status: 'draft' }); // Mantém como draft
      loadSongs();
    } catch (error) {
      console.error('Error rejecting song:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando músicas pendentes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar músicas pendentes</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadSongs}
            className="btn-primary"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Músicas Pendentes de Aprovação</h1>
        <p className="text-gray-400">Total: {totalCount} músicas aguardando aprovação</p>
      </div>

      {/* Stats Card */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500/20 p-3 rounded-lg">
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Aguardando Aprovação</p>
            <p className="text-white text-3xl font-bold">{totalCount}</p>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Música
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Compositor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Gênero
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Data de Envio
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {songs.map((song) => (
                <tr key={song.id} className="hover:bg-gray-800/30 transition-colors">
                  {/* Song */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={song.cover_url || 'https://via.placeholder.com/80'}
                        alt={song.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div>
                        <p className="text-white font-semibold">{song.title}</p>
                        <p className="text-gray-400 text-sm">#{song.number || 'N/A'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Composer */}
                  <td className="px-6 py-4">
                    <span className="text-gray-300">{(song as any).composer_name || 'Desconhecido'}</span>
                  </td>

                  {/* Genre */}
                  <td className="px-6 py-4">
                    <span className="text-gray-300">{(song as any).genre_name || 'N/A'}</span>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4">
                    <span className="text-gray-400 text-sm">
                      {new Date(song.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* View/Edit */}
                      <Link
                        to={`/admin/songs/edit/${song.id}`}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        title="Visualizar/Editar"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {/* Approve */}
                      <button
                        onClick={() => handleApprove(song.id, song.title)}
                        className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                        title="Aprovar e Publicar"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>

                      {/* Reject */}
                      <button
                        onClick={() => handleReject(song.id, song.title)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Rejeitar"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {songs.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">Nenhuma música pendente</p>
            <p className="text-gray-500 text-sm">Todas as músicas foram aprovadas ou rejeitadas</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSongsPending;
