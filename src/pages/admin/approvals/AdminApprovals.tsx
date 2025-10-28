import React, { useState, useEffect } from 'react';
import { CheckCircle, Music, Mic2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPendingComposers } from '@/lib/admin/composersAdminApi';

const AdminApprovals: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCounts, setPendingCounts] = useState({
    songs: 0,
    composers: 0,
    reports: 0,
    total: 0
  });

  useEffect(() => {
    loadPendingCounts();
  }, []);

  const loadPendingCounts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load pending composers from API
      const composers = await getPendingComposers();
      const composersCount = composers.length;
      
      // Mock data for songs and reports (replace with real API calls when available)
      const songsCount = 12; // Mock: getPendingSongs
      const reportsCount = 23; // Mock: getOpenReports
      
      setPendingCounts({
        songs: songsCount,
        composers: composersCount,
        reports: reportsCount,
        total: songsCount + composersCount + reportsCount
      });
    } catch (error: any) {
      console.error('Error loading pending counts:', error);
      setError(error?.message || 'Erro ao carregar aprovações pendentes');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando aprovações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar aprovações</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadPendingCounts}
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
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Central de Aprovações</h1>
        <p className="text-gray-400">Gerencie todas as aprovações pendentes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/songs/pending"
          className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <Music className="w-12 h-12 text-yellow-500" />
            <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 font-bold rounded-full text-lg">
              {pendingCounts.songs}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Hinos Pendentes</h3>
          <p className="text-gray-400 text-sm">Hinos aguardando aprovação</p>
        </Link>

        <Link
          to="/admin/composers/pending"
          className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-blue-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <Mic2 className="w-12 h-12 text-blue-500" />
            <span className="px-4 py-2 bg-blue-500/20 text-blue-400 font-bold rounded-full text-lg">
              {pendingCounts.composers}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Compositores Pendentes</h3>
          <p className="text-gray-400 text-sm">Solicitações de compositores</p>
        </Link>

        <Link
          to="/admin/reports"
          className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-red-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <span className="px-4 py-2 bg-red-500/20 text-red-400 font-bold rounded-full text-lg">
              {pendingCounts.reports}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Denúncias Abertas</h3>
          <p className="text-gray-400 text-sm">Denúncias aguardando análise</p>
        </Link>
      </div>

      {pendingCounts.total > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-yellow-500 text-sm">
            ⚠️ Você tem {pendingCounts.total} {pendingCounts.total === 1 ? 'item' : 'itens'} aguardando aprovação. Revise-os o mais rápido possível.
          </p>
        </div>
      )}

      {pendingCounts.total === 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-400 text-sm">
              ✓ Tudo em dia! Não há itens aguardando aprovação.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
