import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveComposer } from '@/hooks/useActiveComposer';
import {
  getComposerRecentActivityByComposerId,
  getComposerHistorySummaryByComposerId,
  type ComposerRecentActivity,
  type ComposerHistorySummary,
} from '@/lib/composerCatalogApi';
import { Clock, Music, Users, Disc3, PenSquare, ExternalLink } from 'lucide-react';

const emptySummary: ComposerHistorySummary = {
  totalEvents: 0,
  songsAddedLast30Days: 0,
  updatesLast30Days: 0,
  newFollowersLast30Days: 0,
  albumsCreatedLast30Days: 0,
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'agora';

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getActivityIcon = (type: ComposerRecentActivity['type']) => {
  switch (type) {
    case 'song_created':
    case 'song_updated':
      return Music;
    case 'album_created':
    case 'album_updated':
      return Disc3;
    case 'follower':
      return Users;
    default:
      return Clock;
  }
};

const ComposerHistory: React.FC = () => {
  const { composerId, loading: loadingComposer } = useActiveComposer();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ComposerHistorySummary>(emptySummary);
  const [activities, setActivities] = useState<ComposerRecentActivity[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!composerId || loadingComposer) return;
      setLoading(true);
      try {
        const [historySummary, historyActivities] = await Promise.all([
          getComposerHistorySummaryByComposerId(composerId),
          getComposerRecentActivityByComposerId(composerId, 40),
        ]);
        setSummary(historySummary);
        setActivities(historyActivities);
      } catch (error) {
        console.error('Erro ao carregar histórico do catálogo:', error);
        setSummary(emptySummary);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [composerId, loadingComposer]);

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Histórico do Catálogo</h1>
          <p className="text-text-muted">Linha do tempo real das publicações, edições, álbuns e novos seguidores.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <p className="text-text-muted text-sm mb-2">Eventos mapeados</p>
            <p className="text-white text-3xl font-bold">{summary.totalEvents}</p>
          </div>
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <p className="text-text-muted text-sm mb-2">Hinos adicionados (30 dias)</p>
            <p className="text-white text-3xl font-bold">{summary.songsAddedLast30Days}</p>
          </div>
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <p className="text-text-muted text-sm mb-2">Atualizações recentes</p>
            <p className="text-white text-3xl font-bold">{summary.updatesLast30Days}</p>
          </div>
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <p className="text-text-muted text-sm mb-2">Novos seguidores (30 dias)</p>
            <p className="text-white text-3xl font-bold">{summary.newFollowersLast30Days}</p>
          </div>
        </div>

        <div className="bg-background-secondary rounded-xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activities.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-white font-semibold mb-1">{activity.description}</p>
                          <p className="text-text-muted text-sm">{activity.message}</p>
                        </div>
                        <p className="text-xs text-text-muted whitespace-nowrap">{formatDateTime(activity.timestamp)}</p>
                      </div>
                    </div>

                    {activity.href ? (
                      <div className="flex items-center gap-2">
                        <Link
                          to={activity.href}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-background-tertiary text-white hover:bg-gray-700 transition-colors"
                        >
                          {activity.href.includes('/edit') ? <PenSquare className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                          <span className="hidden md:inline">Abrir</span>
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center">
              <Clock className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-white font-medium mb-2">Ainda não há histórico suficiente</p>
              <p className="text-text-muted">
                Assim que o catálogo receber novos hinos, álbuns, edições e seguidores, esta linha do tempo será preenchida.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ComposerHistory;
