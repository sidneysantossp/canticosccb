import React, { useState, useMemo, useEffect } from 'react';
import { Download, Trash2, Play, Pause, Search, Filter, Wifi, WifiOff, HardDrive, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useOfflineDownloads, DownloadedHymn } from '@/hooks/useOfflineDownloads';
import { usePlayerStore } from '@/stores/playerStore';
import { formatDuration, formatFileSize } from '@/utils/formatters';

type FilterType = 'all' | 'completed' | 'downloading' | 'error';
type SortType = 'recent' | 'title' | 'size' | 'category';

const DownloadsPage: React.FC = () => {
  const { 
    downloads, 
    isLoading, 
    stats, 
    removeDownload, 
    resumeDownload, 
    clearAllDownloads,
    pauseDownload 
  } = useOfflineDownloads();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { currentTrack, isPlaying, play, pause } = usePlayerStore();
  
  // Detectar mudanças de status online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filtrar e ordenar downloads
  const filteredDownloads = useMemo(() => {
    let filtered = downloads;

    // Aplicar filtro por status
    if (filter !== 'all') {
      filtered = filtered.filter(d => d.status === filter);
    }

    // Aplicar busca
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.composer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.number.toString().includes(searchTerm)
      );
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      switch (sort) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'size':
          return (b.file_size || 0) - (a.file_size || 0);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'recent':
        default:
          return new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime();
      }
    });

    return filtered;
  }, [downloads, filter, searchTerm, sort]);

  // Tocar hino
  const handlePlay = (hymn: DownloadedHymn) => {
    if (currentTrack?.id === hymn.id && isPlaying) {
      pause();
    } else {
      play({
        id: hymn.id,
        title: hymn.title,
        artist: hymn.composer_name,
        audioUrl: hymn.localAudioUrl || hymn.audio_url,
        coverUrl: hymn.cover_url,
        duration: hymn.duration || '0:00',
        isOffline: true
      });
    }
  };

  // Remover download
  const handleRemove = async (hymnId: string) => {
    if (confirm('Tem certeza que deseja remover este hino dos downloads?')) {
      await removeDownload(hymnId);
    }
  };

  // Limpar todos
  const handleClearAll = async () => {
    if (showClearConfirm) {
      await clearAllDownloads();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  // Status do hino
  const getStatusIcon = (status: DownloadedHymn['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'downloading':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'paused':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando downloads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Download className="w-8 h-8 text-emerald-500" />
              <div>
                <h1 className="text-2xl font-bold">Meus Downloads</h1>
                <p className="text-slate-400">Hinos disponíveis offline</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="flex items-center gap-2 text-green-400">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm">Offline</span>
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-slate-400">Completos</span>
              </div>
              <p className="text-2xl font-bold">{stats.completedDownloads}</p>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-slate-400">Baixando</span>
              </div>
              <p className="text-2xl font-bold">{stats.downloadingCount}</p>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-slate-400">Armazenamento</span>
              </div>
              <p className="text-lg font-bold">{formatFileSize(stats.totalSize)}</p>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-slate-400">Erros</span>
              </div>
              <p className="text-2xl font-bold">{stats.errorCount}</p>
            </div>
          </div>

          {/* Controles */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título, compositor ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Todos</option>
                <option value="completed">Completos</option>
                <option value="downloading">Baixando</option>
                <option value="error">Com Erro</option>
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="recent">Mais Recentes</option>
                <option value="title">Título</option>
                <option value="size">Tamanho</option>
                <option value="category">Categoria</option>
              </select>

              {downloads.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    showClearConfirm
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {showClearConfirm ? 'Confirmar Limpeza' : 'Limpar Tudo'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Downloads */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredDownloads.length === 0 ? (
          <div className="text-center py-12">
            <Download className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {downloads.length === 0 ? 'Nenhum download ainda' : 'Nenhum resultado encontrado'}
            </h3>
            <p className="text-slate-400 mb-6">
              {downloads.length === 0 
                ? 'Comece baixando seus hinos favoritos para ouvir offline'
                : 'Tente ajustar os filtros ou termo de busca'
              }
            </p>
            {downloads.length === 0 && (
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
              >
                Explorar Hinos
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDownloads.map((hymn) => (
              <div
                key={hymn.id}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Capa */}
                  <div className="relative">
                    <img
                      src={hymn.cover_url || '/default-hymn-cover.jpg'}
                      alt={hymn.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <button
                      onClick={() => handlePlay(hymn)}
                      disabled={hymn.status !== 'completed'}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                    >
                      {currentTrack?.id === hymn.id && isPlaying ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white" />
                      )}
                    </button>
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{hymn.title}</h3>
                      {getStatusIcon(hymn.status)}
                    </div>
                    <p className="text-slate-400 text-sm mb-1">
                      Hino {hymn.number} • {hymn.composer_name}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{hymn.category}</span>
                      {hymn.duration && <span>{hymn.duration}</span>}
                      {hymn.file_size && <span>{formatFileSize(hymn.file_size)}</span>}
                      <span>{new Date(hymn.downloadedAt).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Barra de progresso para downloads */}
                    {hymn.status === 'downloading' && (
                      <div className="mt-2">
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${hymn.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{hymn.progress}% concluído</p>
                      </div>
                    )}
                    
                    {/* Mensagem de erro */}
                    {hymn.status === 'error' && hymn.error && (
                      <p className="text-red-400 text-xs mt-1">{hymn.error}</p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    {hymn.status === 'error' && (
                      <button
                        onClick={() => resumeDownload(hymn.id)}
                        className="p-2 text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Tentar novamente"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    
                    {hymn.status === 'downloading' && (
                      <button
                        onClick={() => pauseDownload(hymn.id)}
                        className="p-2 text-yellow-400 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Pausar download"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleRemove(hymn.id)}
                      className="p-2 text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Remover download"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadsPage;
