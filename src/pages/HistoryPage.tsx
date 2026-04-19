import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, History as HistoryIcon, Trash2 } from 'lucide-react';
import * as historyApi from '@/lib/historyApi';

const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const history = await historyApi.listHistory(user.id, 100);
        setItems(history);
      } catch (err) {
        console.error('Erro ao carregar histórico:', err);
        setError('Não foi possível carregar seu histórico');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [user?.id]);

  const clearHistory = async () => {
    if (!user?.id) return;
    try {
      await historyApi.clearHistory(user.id);
      setItems([]);
    } catch (err) {
      console.error('Erro ao limpar histórico:', err);
    }
  };

  const formatDuration = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Histórico</h1>
          <p className="text-gray-400">Veja os hinos tocados recentemente na sua conta</p>
        </div>
        {items.length > 0 && (
          <button onClick={clearHistory} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
            <Trash2 className="w-5 h-5" /> Limpar histórico
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400">Carregando...</p>
        </div>
      ) : error ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <HistoryIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Você ainda não possui reproduções registradas</p>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {items.map((it) => (
            <div key={it.id} className="p-4 flex items-center gap-4">
              <img src={it.cover_url || 'https://placehold.co/56x56/1a1a1a/green?text=CCB'} alt={it.title || 'Hino'} className="w-14 h-14 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-white truncate">{it.title || `Hino #${it.hino_id}`}</p>
                <p className="text-sm text-text-muted truncate">{it.composer_name || 'Compositor desconhecido'}</p>
              </div>
              <div className="text-sm text-text-muted flex items-center gap-1">
                <Clock className="w-4 h-4" /> {formatDuration(it.duration_sec)}
              </div>
              <div className="text-sm text-text-muted w-40 text-right">
                {new Date(it.started_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
