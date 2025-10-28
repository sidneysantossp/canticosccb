import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Music,
  Play,
  BarChart3,
  Edit,
  Eye,
  MoreVertical,
  Download,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hinosApi, compositoresApi } from '@/lib/api-client';
// import {
//   getComposerSongs,
//   getComposerSongStats,
//   getComposerSongTrends,
//   deleteSong,
//   publishSong,
//   type ComposerSong,
//   type ComposerSongStats,
//   type SongTrend
// } from '@/lib/composerSongsApiSimple';

// Tipos locais para exibição
type ComposerSong = {
  id: number;
  title: string;
  cover_url?: string;
  duration?: string;
  status: 'published' | 'pending' | 'draft';
  created_at?: string;
  plays?: number;
  album?: string;
};
type ComposerSongStats = { total: number; published: number; pending: number; draft: number; totalPlays: number; totalLikes: number; averageRating: number; };
type SongTrend = any;

const ComposerSongs: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'pending' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'plays' | 'title'>('recent');
  const [loading, setLoading] = useState(true);
  
  // Real data states
  const [songs, setSongs] = useState<ComposerSong[]>([]);
  const [stats, setStats] = useState<ComposerSongStats>({
    total: 0,
    published: 0,
    pending: 0,
    draft: 0,
    totalPlays: 0,
    totalLikes: 0,
    averageRating: 0
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [trends, setTrends] = useState<SongTrend[]>([]);
  const [reloadTick, setReloadTick] = useState(0);

  // Load real data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Buscar nome do compositor a partir do usuário (fonte confiável: tabela compositores)
        let composerName = (user as any)?.nome || (user as any)?.name || '';
        try {
          const comp = await compositoresApi.getByUsuarioId(user.id);
          const cdata: any = comp?.data;
          if (cdata?.nome) composerName = cdata.nome;
          else if (cdata?.nome_artistico) composerName = cdata.nome_artistico;
        } catch {}

        const normalize = (s: string) => (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
        const composerNorm = normalize(composerName);
        // Buscar pendentes (globais) e publicados do compositor
        const [pendingRes, pubRes, allResMaybe] = await Promise.all([
          hinosApi.listPending(),
          hinosApi.list({ compositor: composerName, ativo: 1, limit: 1000 }),
          hinosApi.list({ compositor: composerName, limit: 1000 })
        ]);
        const pendingAll = (pendingRes.data?.hinos || []) as any[];
        // Publicados: aceitar vários formatos de resposta
        const pubRaw: any = pubRes.data as any;
        let publishedAll: any[] = [];
        if (Array.isArray(pubRaw)) publishedAll = pubRaw;
        else if (Array.isArray(pubRaw?.data)) publishedAll = pubRaw.data;
        else if (Array.isArray(pubRaw?.hinos)) publishedAll = pubRaw.hinos;
        else if (Array.isArray(pubRaw?.items)) publishedAll = pubRaw.items;

        // Filtrar pendentes por compositor (normalizado)
        const minePending = pendingAll.filter(h => normalize(h.compositor || '') === composerNorm);

        // Fallback para publicados: se API não filtrar, filtra no front
        let minePublished = publishedAll.filter(h => normalize(h.compositor || '') === composerNorm);
        // Base completa para drafts
        const allRaw: any = allResMaybe.data as any;
        const allArr: any[] = Array.isArray(allRaw) ? allRaw : (allRaw?.data || allRaw?.hinos || allRaw?.items || []);
        const mineAll = allArr.filter(h => normalize(h.compositor || '') === composerNorm);

        // Drafts: ativo=0 e não está em pendentes
        const pendingIds = new Set(minePending.map((h:any) => h.id));
        const mineDrafts = mineAll.filter(h => Number(h.ativo) === 0 && !pendingIds.has(h.id));

        const combined = [
          ...minePending.map(h => ({ ...h, __status: 'pending' as const })),
          ...mineDrafts.map(h => ({ ...h, __status: 'draft' as const })),
          ...minePublished.map(h => ({ ...h, __status: 'published' as const })),
        ];

        const mapped: ComposerSong[] = combined.map((h) => ({
          id: h.id,
          title: h.titulo,
          cover_url: h.cover_url,
          duration: h.duracao,
          status: (h as any).__status || (Number(h.ativo) === 1 ? 'published' : 'pending'),
          created_at: h.created_at,
          plays: 0,
          album: '',
        }));

        // Ordenação inicial por mais recentes
        const ordered = [...mapped].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setSongs(ordered);

        // Stats simples
        const published = ordered.filter(s => s.status === 'published').length;
        const pending = ordered.filter(s => s.status === 'pending').length;
        const draft = ordered.filter(s => s.status === 'draft').length;
        setStats({ total: ordered.length, published, pending, draft, totalPlays: 0, totalLikes: 0, averageRating: 0 });
        setTrends([]);
      } catch (error) {
        console.error('Error loading composer songs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, searchQuery, filterStatus, sortBy, reloadTick]);

  // Ações de excluir/publicar serão implementadas depois com endpoints reais

  // (mock removido)

  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (song.album || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || song.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const sortedSongs = [...filteredSongs].sort((a, b) => {
    switch (sortBy) {
      case 'plays':
        return b.plays - a.plays;
      case 'title':
        return a.title.localeCompare(b.title);
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Separar pendentes e publicados para destaque
  const pendingSongs = sortedSongs.filter(s => s.status === 'pending');
  const draftSongs = sortedSongs.filter(s => s.status === 'draft');
  const publishedSongs = sortedSongs.filter(s => s.status === 'published');

  // Paginação (aplicada nos publicados; pendentes sempre visíveis no topo)
  const totalPages = Math.max(1, Math.ceil(publishedSongs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paginatedPublished = publishedSongs.slice(start, end);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Calculate trends for display
  const getTrendForSong = (songId: string | number): string => {
    const trend = trends.find(t => t.song_id === songId);
    if (!trend) return '-';
    const percentage = trend.trend_percentage;
    return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Meus Hinos</h1>
          <p className="text-text-muted">
            {sortedSongs.length} {sortedSongs.length === 1 ? 'hino' : 'hinos'}
          </p>
        </div>
        
        <Link
          to="/composer/songs/new"
          className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-primary-500 text-black rounded-lg font-medium hover:bg-primary-400 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Hino
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-background-secondary rounded-xl p-4 border border-gray-800">
          <p className="text-text-muted text-sm mb-1">Total</p>
          <p className="text-white text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-background-secondary rounded-xl p-4 border border-gray-800">
          <p className="text-text-muted text-sm mb-1">Publicados</p>
          <p className="text-green-400 text-2xl font-bold">{stats.published}</p>
        </div>
        <div className="bg-background-secondary rounded-xl p-4 border border-gray-800">
          <p className="text-text-muted text-sm mb-1">Em análise</p>
          <p className="text-amber-400 text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-background-secondary rounded-xl p-4 border border-gray-800">
          <p className="text-text-muted text-sm mb-1">Rascunhos</p>
          <p className="text-orange-400 text-2xl font-bold">{stats.draft}</p>
        </div>
        <div className="bg-background-secondary rounded-xl p-4 border border-gray-800">
          <p className="text-text-muted text-sm mb-1">Total de Plays</p>
          <p className="text-primary-400 text-2xl font-bold">{formatNumber(stats.totalPlays)}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar hinos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todos</option>
            <option value="published">Publicados</option>
            <option value="pending">Em análise</option>
            <option value="draft">Rascunhos</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="recent">Mais recentes</option>
            <option value="plays">Mais tocados</option>
            <option value="title">Nome A-Z</option>
          </select>
        </div>
      </div>

      {/* Songs List */}
      <div className="bg-background-secondary rounded-xl border border-gray-800 overflow-visible">
        {/* Em análise (sempre no topo quando presentes) */}
        {filterStatus !== 'published' && pendingSongs.length > 0 && (
          <div className="p-4 border-b border-gray-800 bg-amber-500/5">
            <h3 className="text-amber-400 font-semibold mb-3">Em análise</h3>
            {pendingSongs.map((song, index) => (
              <div key={song.id} className={`flex items-center gap-4 p-3 rounded-lg ${index !== 0 ? 'mt-2' : ''} bg-transparent hover:bg-background-hover transition-colors`}>
                <div className="relative">
                  <img src={song.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title)}&background=1f2937&color=ffffff`} alt={song.title} className="w-14 h-14 rounded object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{song.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>Enviado em {song.created_at ? new Date(song.created_at).toLocaleDateString('pt-BR') : '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">Em análise</span>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-amber-400" />
                    <div className="absolute right-0 top-6 hidden group-hover:block bg-black/80 backdrop-blur-sm border border-white/10 text-white text-xs rounded-md p-3 w-64 z-20">
                      Seu hino está em análise e será publicado em alguns minutos. Este processo inicial garante segurança e controle do conteúdo.
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rascunhos (acima dos publicados) */}
        {filterStatus !== 'published' && draftSongs.length > 0 && (
          <div className="p-4 border-b border-gray-800 bg-orange-500/5">
            <h3 className="text-orange-400 font-semibold mb-3">Rascunhos</h3>
            {draftSongs.map((song, index) => (
              <div key={song.id} className={`flex items-center gap-4 p-3 rounded-lg ${index !== 0 ? 'mt-2' : ''} bg-transparent hover:bg-background-hover transition-colors`}>
                <div className="relative">
                  <img src={song.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title)}&background=1f2937&color=ffffff`} alt={song.title} className="w-14 h-14 rounded object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{song.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>Criado em {song.created_at ? new Date(song.created_at).toLocaleDateString('pt-BR') : '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400">Rascunho</span>
                  <button
                    onClick={async () => {
                      try {
                        await hinosApi.update(song.id, { ativo: 1 });
                        setSongs(prev => prev.map(s => s.id === song.id ? { ...s, status: 'published' } : s));
                        setReloadTick(t => t + 1); // refetch listas (inclui Trends e estatísticas locais)
                      } catch (e) {
                        alert('Falha ao publicar.');
                      }
                    }}
                    className="px-3 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
                  >
                    Publicar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Publicados (paginados) */}
        {(filterStatus !== 'pending' ? paginatedPublished : []).map((song, index) => (
          <div
            key={song.id}
            className={`flex items-center gap-4 p-4 hover:bg-background-hover transition-colors ${
              index !== 0 ? 'border-t border-gray-700' : pendingSongs.length > 0 ? 'border-t border-gray-700' : ''
            }`}
          >
            {/* Play Button & Cover */}
            <div className="relative group">
              <img
                src={song.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title)}&background=1f2937&color=ffffff`}
                alt={song.title}
                className="w-16 h-16 rounded object-cover"
              />
              {song.status === 'published' && (
                <button className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-6 h-6 text-white ml-0.5" />
                </button>
              )}
            </div>

            {/* Song Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium mb-1 truncate">{song.title}</h3>
              <p className="text-text-muted text-sm truncate">{song.album}</p>
            </div>

            {/* Duration */}
            <div className="hidden md:block text-text-muted text-sm">
              {song.duration}
            </div>

            {/* Status */}
            <div className="hidden md:flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                song.status === 'published'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                {song.status === 'published' ? 'Publicado' : 'Em análise'}
              </span>
              {song.status === 'pending' && (
                <div className="relative group">
                  <Info className="w-4 h-4 text-amber-400" />
                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-black/80 backdrop-blur-sm border border-white/10 text-white text-xs rounded-md p-3 w-64 z-30 shadow-xl break-words">
                    <div className="absolute -bottom-1 right-3 w-3 h-3 bg-black/80 border-r border-b border-white/10 rotate-45"></div>
                    Seu hino está em análise e será publicado em alguns minutos. Este processo inicial garante segurança e controle do conteúdo.
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            {song.status === 'published' && (
              <>
                <div className="hidden lg:flex items-center gap-1 text-text-muted min-w-[80px]">
                  <Play className="w-4 h-4" />
                  <span className="text-sm">{formatNumber(song.plays)}</span>
                </div>

                <div className="hidden lg:block min-w-[60px]">
                  <span className={`text-sm font-medium ${
                    getTrendForSong(song.id).startsWith('+') ? 'text-green-400' : 'text-text-muted'
                  }`}>
                    {getTrendForSong(song.id)}
                  </span>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                to={`/composer/analytics`}
                className="p-2 text-text-muted hover:text-white transition-colors"
                title="Ver Analytics"
              >
                <BarChart3 className="w-5 h-5" />
              </Link>
              
              <Link
                to={`/composer/songs/${song.id}/edit`}
                className="p-2 text-text-muted hover:text-white transition-colors"
                title="Editar"
              >
                <Edit className="w-5 h-5" />
              </Link>

              {/* Ações de excluir/publicar serão adicionadas futuramente */}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {sortedSongs.length === 0 && (
          <div className="text-center py-16">
            <Music className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Nenhum hino encontrado</h3>
            <p className="text-text-muted mb-6">
              {searchQuery
                ? 'Tente ajustar sua busca'
                : 'Comece enviando seu primeiro hino'}
            </p>
            {!searchQuery && (
              <Link
                to="/composer/songs/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-black rounded-lg font-medium hover:bg-primary-400 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Enviar Hino
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Paginação */}
      {filterStatus !== 'pending' && publishedSongs.length > pageSize && (
        <div className="mt-4 flex items-center justify-between">
          <button
            disabled={currentPage <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-2 rounded-lg bg-background-secondary border border-gray-700 text-white disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-text-muted text-sm">Página {currentPage} de {totalPages}</span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-2 rounded-lg bg-background-secondary border border-gray-700 text-white disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}

      {/* Bulk Actions */}
      {sortedSongs.length > 0 && (
        <div className="mt-6 flex items-center justify-between text-sm text-text-muted">
          <p>{sortedSongs.length} hinos exibidos</p>
          <div className="flex gap-4">
            <button className="hover:text-white transition-colors">Exportar dados</button>
            <button className="hover:text-white transition-colors">Download em massa</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComposerSongs;
