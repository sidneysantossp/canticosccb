import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  TrendingUp,
  MapPin,
  Calendar,
  Music,
  Heart,
  UserPlus,
  Download
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getFollowerStats,
  getFollowers,
  getTopFans,
  getFollowerGrowth,
  type FollowerStats,
  type Follower,
  type TopFan,
  type FollowerGrowthPoint
} from '@/lib/composerFollowersApi';

const ComposerFollowers: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'recent' | 'active'>('all');
  const [loading, setLoading] = useState(true);
  
  // Real data states
  const [followerStats, setFollowerStats] = useState<FollowerStats>({
    total: 0,
    thisMonth: 0,
    growth: 0,
    engagement: 0,
    averagePlays: 0
  });
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [topFans, setTopFans] = useState<TopFan[]>([]);
  const [growthData, setGrowthData] = useState<FollowerGrowthPoint[]>([]);

  // Load real data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const [stats, followersData, fansData, growth] = await Promise.all([
          getFollowerStats(user.id),
          getFollowers(user.id, 6, 0, searchQuery, filterBy),
          getTopFans(user.id, 3),
          getFollowerGrowth(user.id, 30)
        ]);

        setFollowerStats(stats);
        setFollowers(followersData);
        setTopFans(fansData);
        setGrowthData(growth);
      } catch (error) {
        console.error('Error loading follower data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, searchQuery, filterBy]);

  const filteredFollowers = followers.filter(follower => {
    const matchesSearch = follower.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (follower.email ? follower.email.toLowerCase().includes(searchQuery.toLowerCase()) : false);
    const matchesFilter = filterBy === 'all' ||
                         (filterBy === 'recent' && new Date(follower.followedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
                         (filterBy === 'active' && follower.isActive);
    return matchesSearch && matchesFilter;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Seguidores</h1>
        <p className="text-text-muted">Gerencie e interaja com sua irmandade</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-400" />
            </div>
            <span className="text-green-400 text-sm font-medium">+{followerStats.growth}%</span>
          </div>
          <p className="text-text-muted text-sm mb-1">Total de Seguidores</p>
          <h3 className="text-3xl font-bold text-white">{formatNumber(followerStats.total)}</h3>
        </div>

        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-blue-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-text-muted text-sm mb-1">Novos (30 dias)</p>
          <h3 className="text-3xl font-bold text-white">{formatNumber(followerStats.thisMonth)}</h3>
        </div>

        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <p className="text-text-muted text-sm mb-1">Taxa de Engajamento</p>
          <h3 className="text-3xl font-bold text-white">{followerStats.engagement}%</h3>
        </div>

        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-text-muted text-sm mb-1">Média de Plays</p>
          <h3 className="text-3xl font-bold text-white">{followerStats.averagePlays}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Top Fans */}
        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-6">Top Fãs</h2>
          <div className="space-y-4">
            {topFans.map((fan, index) => (
              <div key={fan.id} className="flex items-center gap-3">
                <span className="text-primary-400 font-bold text-lg w-6">{index + 1}</span>
                <img
                  src={fan.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fan.name)}&background=1f2937&color=ffffff`}
                  alt={fan.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-white font-medium">{fan.name}</h3>
                  <p className="text-text-muted text-sm">{fan.plays} plays • {fan.hoursListened}h</p>
                </div>
              </div>
            ))}
            {topFans.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-text-muted mx-auto mb-2" />
                <p className="text-text-muted">Nenhum fã ainda</p>
              </div>
            )}
          </div>
        </div>

        {/* Growth Chart Placeholder */}
        <div className="lg:col-span-2 bg-background-secondary rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-6">Crescimento de Seguidores</h2>
          <div className="h-64 flex items-center justify-center bg-background-tertiary rounded-lg">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-text-muted mx-auto mb-2" />
              <p className="text-text-muted">Gráfico de crescimento</p>
              <p className="text-text-muted text-sm">(Dados: {growthData.length} pontos)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar seguidores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todos</option>
            <option value="recent">Novos (7 dias)</option>
            <option value="active">Ativos</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-white hover:bg-background-hover transition-colors">
            <Download className="w-5 h-5" />
            <span className="hidden md:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Followers List */}
      <div className="bg-background-secondary rounded-xl border border-gray-800 overflow-hidden">
        {filteredFollowers.map((follower, index) => (
          <div
            key={follower.id}
            className={`flex items-center gap-4 p-4 hover:bg-background-hover transition-colors ${
              index !== 0 ? 'border-t border-gray-700' : ''
            }`}
          >
            <img
              src={follower.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.name)}&background=1f2937&color=ffffff`}
              alt={follower.name}
              className="w-14 h-14 rounded-full object-cover"
            />

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium mb-1">{follower.name}</h3>
              <div className="flex items-center gap-3 text-sm text-text-muted">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {follower.location || 'Localização não informada'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(follower.followedAt)}
                </span>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end gap-1">
              <span className="text-white font-medium">{follower.totalPlays} plays</span>
              <span className="text-text-muted text-sm truncate max-w-[200px]">
                {follower.favoriteSong || 'Nenhum hino favorito'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {follower.isActive && (
                <span className="w-2 h-2 bg-green-400 rounded-full" title="Ativo"></span>
              )}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredFollowers.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Nenhum seguidor encontrado</h3>
            <p className="text-text-muted">
              {searchQuery ? 'Tente ajustar sua busca' : 'Continue criando conteúdo incrível!'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {filteredFollowers.length > 0 && (
        <div className="mt-6 text-center text-sm text-text-muted">
          Exibindo {filteredFollowers.length} de {followers.length} seguidores
        </div>
      )}
    </div>
  );
};

export default ComposerFollowers;
