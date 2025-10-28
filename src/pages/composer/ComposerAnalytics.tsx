import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Play,
  Users,
  Heart,
  Share2,
  Download,
  Clock,
  MapPin,
  Calendar,
  Music,
  BarChart3
} from 'lucide-react';
import { ComposerPageWrapper } from '@/components/ComposerPageWrapper';
import { useAuth } from '@/contexts/AuthContext';
import {
  getComposerOverview,
  getTopSongs,
  getPlaysSeries,
  getEngagementCounts,
  getEngagementCountsWindow,
  getAudienceTopCountries,
  getAudienceDevices,
} from '@/lib/composerStatsApi';
import type { ComposerOverview, TopSong } from '@/lib/composerStatsApi';

const ComposerAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'songs' | 'audience' | 'engagement'>('overview');
  const [overview, setOverview] = useState<ComposerOverview | null>(null);
  const [topSongsData, setTopSongsData] = useState<TopSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<{ day: string; plays: number }[]>([]);
  const [engagement, setEngagement] = useState<{ likes: number; shares: number; downloads: number } | null>(null);
  const [engagementPrev, setEngagementPrev] = useState<{ likes: number; shares: number; downloads: number } | null>(null);
  const [countries, setCountries] = useState<{ country: string; plays: number }[]>([]);
  const [devices, setDevices] = useState<{ mobile: number; desktop: number; other: number } | null>(null);
  console.log('🎯 Render: ComposerAnalytics');

  useEffect(() => {
    const run = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        setLoading(true);
        const [overviewData, topSongs] = await Promise.all([
          getComposerOverview(user.id, timeRange),
          getTopSongs(user.id, 5)
        ]);
        setOverview(overviewData);
        setTopSongsData(topSongs);
      } catch (e) {
        console.error('❌ Error loading composer overview:', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?.id, timeRange]);

  // carregar série de plays quando muda o período
  useEffect(() => {
    const loadSeries = async () => {
      if (!user?.id) return;
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const data = await getPlaysSeries(user.id, days);
      setSeries(data);

      // engagement do período
      const e = await getEngagementCounts(user.id, days);
      setEngagement(e);

      // período anterior para delta
      const end = new Date();
      const start = new Date(); start.setDate(end.getDate() - days);
      const prevEnd = new Date(start); // início do atual
      const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - days);
      const ePrev = await getEngagementCountsWindow(user.id, prevStart.toISOString(), prevEnd.toISOString());
      setEngagementPrev(ePrev);

      // público (países e devices)
      const [cc, dd] = await Promise.all([
        getAudienceTopCountries(user.id, days, 5),
        getAudienceDevices(user.id, days)
      ]);
      setCountries(cc);
      setDevices(dd);
    };
    loadSeries();
  }, [user?.id, timeRange]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatShort = (n: number) => {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return `${n}`;
  };

  // Dados reais (fallback para 0 quando ainda carregando)
  const performanceMetrics = [
    { label: 'Plays', value: overview?.plays ?? 0, change: 0, icon: Play, color: 'primary' },
    { label: 'Seguidores', value: overview?.followers ?? 0, change: 0, icon: Users, color: 'blue' },
    { label: 'Curtidas', value: engagement?.likes ?? 0, change: 0, icon: Heart, color: 'red' },
    { label: 'Compartilhamentos', value: engagement?.shares ?? 0, change: 0, icon: Share2, color: 'green' },
    { label: 'Downloads', value: engagement?.downloads ?? 0, change: 0, icon: Download, color: 'purple' },
    { label: 'Tempo de Audição', value: formatSeconds(overview?.averageListenTimeSeconds ?? 0), change: 0, icon: Clock, color: 'orange' }
  ];

  const topSongs = topSongsData.map((s) => ({
    id: s.id,
    title: s.title,
    coverUrl: s.coverUrl,
    plays: s.plays,
    listeners: Math.max(1, Math.floor((s.plays || 0) * 0.7)), // estimativa até termos tabela de ouvintes
    avgCompletion: 85,
    saves: s.likes,
    shares: 0
  }));

  const audienceInsights = {
    gender: [
      { label: 'Feminino', percentage: 58, color: 'bg-pink-500' },
      { label: 'Masculino', percentage: 40, color: 'bg-blue-500' },
      { label: 'Outro', percentage: 2, color: 'bg-purple-500' }
    ],
    devices: [
      { label: 'Mobile', percentage: 72 },
      { label: 'Desktop', percentage: 23 },
      { label: 'Tablet', percentage: 5 }
    ],
    timeOfDay: [
      { hour: '00h-06h', plays: 5 },
      { hour: '06h-12h', plays: 25 },
      { hour: '12h-18h', plays: 35 },
      { hour: '18h-00h', plays: 35 }
    ]
  };

  const topCities = [
    { city: 'São Paulo', state: 'SP', plays: 245678 },
    { city: 'Rio de Janeiro', state: 'RJ', plays: 156789 },
    { city: 'Belo Horizonte', state: 'MG', plays: 98765 },
    { city: 'Curitiba', state: 'PR', plays: 87654 },
    { city: 'Porto Alegre', state: 'RS', plays: 76543 }
  ];

  const formatNumber = (num: number | string) => {
    if (typeof num === 'string') return num;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      primary: 'text-primary-400 bg-primary-500/20',
      blue: 'text-blue-400 bg-blue-500/20',
      red: 'text-red-400 bg-red-500/20',
      green: 'text-green-400 bg-green-500/20',
      purple: 'text-purple-400 bg-purple-500/20',
      orange: 'text-orange-400 bg-orange-500/20'
    };
    return colors[color] || colors.primary;
  };

  if (loading) {
    return (
      <ComposerPageWrapper requireComposer>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando analytics...</p>
            </div>
          </div>
        </div>
      </ComposerPageWrapper>
    );
  }

  return (
    <ComposerPageWrapper requireComposer>
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-text-muted">Insights detalhados sobre sua performance</p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="mt-4 md:mt-0 px-4 py-2 bg-background-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="90d">Últimos 90 dias</option>
          <option value="1y">Último ano</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide border-b border-gray-700">
        {[
          { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
          { id: 'songs', label: 'Hinos', icon: Music },
          { id: 'audience', label: 'Público', icon: Users },
          { id: 'engagement', label: 'Engajamento', icon: Heart }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-400 border-primary-400'
                  : 'text-text-muted border-transparent hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {performanceMetrics.map((metric) => {
              const Icon = metric.icon;
              const isPositive = metric.change >= 0;
              return (
                <div key={metric.label} className="bg-background-secondary rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClass(metric.color)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {Math.abs(metric.change)}%
                    </div>
                  </div>
                  <p className="text-text-muted text-sm mb-1">{metric.label}</p>
                  <h3 className="text-2xl font-bold text-white">{formatNumber(metric.value)}</h3>
                </div>
              );
            })}
          </div>

          {/* Chart - Série real */}
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Plays ao Longo do Tempo</h2>
              {series.length > 0 && (
                (() => {
                  const total = series.reduce((s, p) => s + p.plays, 0);
                  const avg = Math.round(total / series.length);
                  const peak = Math.max(...series.map(p => p.plays));
                  return (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 rounded bg-background-tertiary border border-gray-800 text-text-muted">Média: <span className="text-white">{formatShort(avg)}</span></span>
                      <span className="px-2 py-1 rounded bg-background-tertiary border border-gray-800 text-text-muted">Pico: <span className="text-white">{formatShort(peak)}</span></span>
                    </div>
                  );
                })()
              )}
            </div>
            <div className="h-64 bg-background-tertiary rounded-lg p-4 flex items-end gap-1 overflow-x-auto">
              {series.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>Nenhum dado no período</p>
                  </div>
                </div>
              ) : (
                (() => {
                  const max = Math.max(...series.map(s => s.plays), 1);
                  return series.map((pt, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="text-[10px] text-white/80 mb-1 select-none">{formatShort(pt.plays)}</div>
                      <div
                        title={`${pt.day}: ${pt.plays}`}
                        className="w-2 md:w-3 bg-primary-500 rounded-t"
                        style={{ height: `${Math.max(8, Math.round((pt.plays / max) * 200))}px` }}
                      />
                      <div className="text-[10px] text-text-muted mt-1">
                        {pt.day.slice(5)}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </>
      )}

      {/* Engagement Tab */}
      {activeTab === 'engagement' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-red-400" />
                <span className="text-text-muted text-sm">Curtidas</span>
              </div>
              {engagement && engagementPrev && (
                (() => {
                  const curr = engagement.likes; const prev = Math.max(1, engagementPrev.likes);
                  const delta = ((curr - prev) / prev) * 100;
                  const up = delta >= 0;
                  return (
                    <span className={`text-xs px-2 py-0.5 rounded ${up ? 'text-green-400 bg-green-500/15' : 'text-red-400 bg-red-500/15'}`}>{up ? '+' : ''}{delta.toFixed(1)}%</span>
                  );
                })()
              )}
            </div>
            <div className="text-3xl font-bold text-white">{formatNumber(engagement?.likes ?? 0)}</div>
            <p className="text-text-muted text-xs mt-1">No período selecionado</p>
          </div>

          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-green-400" />
                <span className="text-text-muted text-sm">Compartilhamentos</span>
              </div>
              {engagement && engagementPrev && (
                (() => {
                  const curr = engagement.shares; const prev = Math.max(1, engagementPrev.shares);
                  const delta = ((curr - prev) / prev) * 100;
                  const up = delta >= 0;
                  return (
                    <span className={`text-xs px-2 py-0.5 rounded ${up ? 'text-green-400 bg-green-500/15' : 'text-red-400 bg-red-500/15'}`}>{up ? '+' : ''}{delta.toFixed(1)}%</span>
                  );
                })()
              )}
            </div>
            <div className="text-3xl font-bold text-white">{formatNumber(engagement?.shares ?? 0)}</div>
            <p className="text-text-muted text-xs mt-1">No período selecionado</p>
          </div>

          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-purple-400" />
                <span className="text-text-muted text-sm">Downloads</span>
              </div>
              {engagement && engagementPrev && (
                (() => {
                  const curr = engagement.downloads; const prev = Math.max(1, engagementPrev.downloads);
                  const delta = ((curr - prev) / prev) * 100;
                  const up = delta >= 0;
                  return (
                    <span className={`text-xs px-2 py-0.5 rounded ${up ? 'text-green-400 bg-green-500/15' : 'text-red-400 bg-red-500/15'}`}>{up ? '+' : ''}{delta.toFixed(1)}%</span>
                  );
                })()
              )}
            </div>
            <div className="text-3xl font-bold text-white">{formatNumber(engagement?.downloads ?? 0)}</div>
            <p className="text-text-muted text-xs mt-1">No período selecionado</p>
          </div>
        </div>
      )}

      {/* Audience Tab */}
      {activeTab === 'audience' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top countries */}
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <h3 className="text-white font-semibold mb-4">Top Países</h3>
            {countries.length === 0 ? (
              <p className="text-text-muted">Sem dados no período.</p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const total = countries.reduce((s, c) => s + c.plays, 0) || 1;
                  const max = Math.max(...countries.map(c => c.plays), 1);
                  return countries.map((c, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-text-muted">{c.country}</span>
                        <span className="text-white">{formatShort(c.plays)} ({Math.round((c.plays/total)*100)}%)</span>
                      </div>
                      <div className="h-2 rounded bg-gray-800 overflow-hidden">
                        <div className="h-full bg-primary-500" style={{ width: `${(c.plays/max)*100}%` }} />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Devices */}
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <h3 className="text-white font-semibold mb-4">Dispositivos</h3>
            {devices ? (
              (() => {
                const total = Math.max(1, devices.mobile + devices.desktop + devices.other);
                const rows = [
                  { label: 'Mobile', value: devices.mobile, color: 'bg-green-500' },
                  { label: 'Desktop', value: devices.desktop, color: 'bg-blue-500' },
                  { label: 'Outros', value: devices.other, color: 'bg-purple-500' },
                ];
                return (
                  <div className="space-y-3">
                    {rows.map((r) => (
                      <div key={r.label}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-text-muted">{r.label}</span>
                          <span className="text-white">{formatShort(r.value)} ({Math.round((r.value/total)*100)}%)</span>
                        </div>
                        <div className="h-2 rounded bg-gray-800 overflow-hidden">
                          <div className={`h-full ${r.color}`} style={{ width: `${(r.value/total)*100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (
              <p className="text-text-muted">Sem dados no período.</p>
            )}
          </div>
        </div>
      )}

      {/* Songs Tab */}
      {activeTab === 'songs' && (
        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-6">Hinos com Melhor Desempenho</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-text-muted font-medium pb-3 px-2">#</th>
                  <th className="text-left text-text-muted font-medium pb-3 px-2">Hino</th>
                  <th className="text-left text-text-muted font-medium pb-3 px-2">Plays</th>
                  <th className="text-left text-text-muted font-medium pb-3 px-2">Ouvintes</th>
                  <th className="text-left text-text-muted font-medium pb-3 px-2">Conclusão</th>
                  <th className="text-left text-text-muted font-medium pb-3 px-2">Salvamentos</th>
                  <th className="text-left text-text-muted font-medium pb-3 px-2">Shares</th>
                </tr>
              </thead>
              <tbody>
                {topSongs.map((song, index) => (
                  <tr key={song.id} className="border-b border-gray-700/50">
                    <td className="py-4 px-2">
                      <span className="text-text-muted font-bold">{index + 1}</span>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        {song.coverUrl ? (
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="w-10 h-10 rounded object-cover border border-gray-700"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-background-tertiary border border-gray-700 flex items-center justify-center text-text-muted">
                            <Music className="w-5 h-5" />
                          </div>
                        )}
                        <span className="text-white font-medium">{song.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-white">{formatNumber(song.plays)}</span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-white">{formatNumber(song.listeners)}</span>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-background-tertiary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500"
                            style={{ width: `${song.avgCompletion}%` }}
                          />
                        </div>
                        <span className="text-white text-sm">{song.avgCompletion}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-white">{formatNumber(song.saves)}</span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-white">{formatNumber(song.shares)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audience Tab */}
      {activeTab === 'audience' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gender Distribution */}
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Distribuição por Gênero</h2>
            <div className="space-y-4">
              {audienceInsights.gender.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white">{item.label}</span>
                    <span className="text-text-muted">{item.percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-background-tertiary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Distribution */}
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Dispositivos</h2>
            <div className="space-y-4">
              {audienceInsights.devices.map((device) => (
                <div key={device.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white">{device.label}</span>
                    <span className="text-text-muted">{device.percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-background-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${device.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cities */}
          <div className="lg:col-span-2 bg-background-secondary rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Principais Cidades</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topCities.map((city, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{city.city}, {city.state}</h3>
                    <p className="text-text-muted text-sm">{formatNumber(city.plays)} plays</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time of Day */}
          <div className="lg:col-span-2 bg-background-secondary rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Horários de Audição</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {audienceInsights.timeOfDay.map((time) => (
                <div key={time.hour} className="bg-background-tertiary rounded-lg p-4 text-center">
                  <Clock className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                  <p className="text-text-muted text-sm mb-1">{time.hour}</p>
                  <p className="text-white text-xl font-bold">{time.plays}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Engagement Tab */}
      {activeTab === 'engagement' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Taxa de Engajamento</h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white">Taxa de Conclusão</span>
                  <span className="text-primary-400 font-bold">87.5%</span>
                </div>
                <p className="text-text-muted text-sm mb-2">
                  Porcentagem média de cada hino que os ouvintes escutam
                </p>
                <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500" style={{ width: '87.5%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white">Taxa de Salvamento</span>
                  <span className="text-green-400 font-bold">23.5%</span>
                </div>
                <p className="text-text-muted text-sm mb-2">
                  Ouvintes que salvaram seus hinos
                </p>
                <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '23.5%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white">Taxa de Compartilhamento</span>
                  <span className="text-blue-400 font-bold">4.3%</span>
                </div>
                <p className="text-text-muted text-sm mb-2">
                  Ouvintes que compartilharam seus hinos
                </p>
                <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '4.3%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Crescimento de Seguidores</h2>
            <div className="h-64 flex items-center justify-center bg-background-tertiary rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-text-muted mx-auto mb-2" />
                <p className="text-text-muted">Gráfico de crescimento</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </ComposerPageWrapper>
  );
};

export default ComposerAnalytics;
