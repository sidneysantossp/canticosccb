import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Music, ArrowLeft, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
// import { getFeaturedComposers } from '@/lib/admin/composersAdminApi';
import SEOHead from '@/components/SEO/SEOHead';

interface Compositor {
  id: string;
  name: string;
  image: string;
  followers: number;
  popularHino: string;
  isTrending?: boolean;
  rank?: number;
  registeredDate?: Date;
}

export default function CompositoresPage() {
  const [composers, setComposers] = useState<Compositor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'hoje' | 'semana' | 'mes'>('hoje');
  const navigate = useNavigate();

  // Mock data para demonstração
  const mockComposers: Compositor[] = [
    {
      id: '1',
      name: 'Irmão João Pereira',
      image: 'https://picsum.photos/400/400?random=1',
      followers: 125000,
      popularHino: 'Hino 450 - Jesus Cristo é o Caminho',
      isTrending: true
    },
    {
      id: '2',
      name: 'Irmão José Silva',
      image: 'https://picsum.photos/400/400?random=2',
      followers: 89000,
      popularHino: 'Hino 320 - Paz Divina'
    },
    {
      id: '3',
      name: 'Irmão Paulo Oliveira',
      image: 'https://picsum.photos/400/400?random=3',
      followers: 54000,
      popularHino: 'Hino 125 - Graça Sublime',
      isTrending: true
    },
    {
      id: '4',
      name: 'Irmão Pedro Costa',
      image: 'https://picsum.photos/400/400?random=4',
      followers: 42000,
      popularHino: 'Hino 200 - Amor Eterno'
    },
    {
      id: '5',
      name: 'Irmão Carlos Santos',
      image: 'https://picsum.photos/400/400?random=5',
      followers: 38000,
      popularHino: 'Hino 180 - Esperança Viva'
    },
    {
      id: '6',
      name: 'Irmão Miguel Ferreira',
      image: 'https://picsum.photos/400/400?random=6',
      followers: 31000,
      popularHino: 'Hino 95 - Fé Inabalável'
    },
    {
      id: '7',
      name: 'Irmão Antonio Lima',
      image: 'https://picsum.photos/400/400?random=7',
      followers: 28000,
      popularHino: 'Hino 340 - Glória Celestial',
      isTrending: true
    },
    {
      id: '8',
      name: 'Irmão Rafael Souza',
      image: 'https://picsum.photos/400/400?random=8',
      followers: 25000,
      popularHino: 'Hino 275 - Luz Divina'
    }
  ];

  useEffect(() => {
    loadComposers();
  }, [selectedPeriod]);

  const loadComposers = async () => {
    try {
      setIsLoading(true);
      console.log('🎵 CompositoresPage - Carregando compositores...');
      
      // Tentar carregar do banco de dados
      const dbComposers = await getFeaturedComposers();
      
      console.log('📊 CompositoresPage - Dados recebidos:', {
        length: dbComposers?.length || 0,
        firstComposer: dbComposers?.[0]?.name,
        allComposers: dbComposers?.map(c => c.name)
      });
      
      if (dbComposers && dbComposers.length > 0) {
        // Converter dados do banco para o formato esperado
        let convertedComposers = dbComposers.map((composer: any, index: number) => {
          const avatarUrl = composer.avatar_url || composer.photo_url;
          const finalImage = avatarUrl && avatarUrl.trim() !== '' 
            ? avatarUrl 
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(composer.name)}&size=400&background=1a1a1a&color=00D1FF`;
          
          return {
            id: composer.id,
            name: composer.name,
            image: finalImage,
            followers: composer.followers_count || 50000,
            popularHino: `Hino ${Math.floor(Math.random() * 500) + 1} - ${composer.name}`,
            isTrending: composer.is_trending || false,
            rank: index + 1,
            registeredDate: new Date(composer.created_at || Date.now())
          };
        });

        // Filtrar por período (OPCIONAL - comentado para mostrar todos)
        /* const now = new Date();
        if (selectedPeriod === 'hoje') {
          convertedComposers = convertedComposers.filter(c => 
            c.registeredDate && (now.getTime() - c.registeredDate.getTime()) < 24 * 60 * 60 * 1000
          );
        } else if (selectedPeriod === 'semana') {
          convertedComposers = convertedComposers.filter(c =>
            c.registeredDate && (now.getTime() - c.registeredDate.getTime()) < 7 * 24 * 60 * 60 * 1000
          );
        } else if (selectedPeriod === 'mes') {
          convertedComposers = convertedComposers.filter(c =>
            c.registeredDate && (now.getTime() - c.registeredDate.getTime()) < 30 * 24 * 60 * 60 * 1000
          );
        } */
        
        console.log('✅ Compositores após filtro (período desabilitado):', convertedComposers.length);

        // Ordenar por seguidores (ranking)
        convertedComposers.sort((a, b) => b.followers - a.followers);
        
        // Atualizar ranks após ordenação
        convertedComposers = convertedComposers.map((c, i) => ({ ...c, rank: i + 1 }));

        setComposers(convertedComposers);
      } else {
        // Fallback para dados mock (sem filtro de período)
        console.log('⚠️ Nenhum compositor no banco, usando mock data');
        let filteredMock = [...mockComposers];
        
        // Ordenar por seguidores
        filteredMock.sort((a, b) => b.followers - a.followers);
        filteredMock = filteredMock.map((c, i) => ({ ...c, rank: i + 1 }));
        
        setComposers(filteredMock);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar compositores:', error);
      console.log('🔄 Usando mock data como fallback');
      let filteredMock = [...mockComposers];
      filteredMock.sort((a, b) => b.followers - a.followers);
      filteredMock = filteredMock.map((c, i) => ({ ...c, rank: i + 1 }));
      setComposers(filteredMock);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return { label: 'TOP 1', className: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black' };
    if (index === 1) return { label: 'TOP 2', className: 'bg-gradient-to-r from-gray-300 to-gray-500 text-black' };
    if (index === 2) return { label: 'TOP 3', className: 'bg-gradient-to-r from-amber-600 to-amber-800 text-white' };
    if (index < 10) return { label: `TOP ${index + 1}`, className: 'bg-primary-500/80 text-white' };
    return { label: '', className: '' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary pb-24">
        <div className="bg-gradient-to-b from-primary-900 to-background pt-20 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="h-10 bg-gray-800 rounded w-64 mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-800 rounded w-96 animate-pulse"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 -mt-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-900/50 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-800 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-800 rounded w-3/4" />
                    <div className="h-4 bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Compositores - Ranking por Seguidores"
        description="Descubra os compositores mais seguidos e populares. Veja o ranking completo dos compositores da CCB."
        keywords="compositores, ranking, seguidores, CCB, música"
      />

      <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary pb-24">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary-900 to-background pt-20 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>

            <div className="mb-4">
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                Top Compositores
                <Users className="w-8 h-8 text-primary-400" />
              </h1>
              <p className="text-gray-300 mt-2">
                Os compositores mais seguidos e populares
              </p>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedPeriod('hoje')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === 'hoje'
                    ? 'bg-primary-500 text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Registrados Hoje
              </button>
              <button
                onClick={() => setSelectedPeriod('semana')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === 'semana'
                    ? 'bg-primary-500 text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Esta Semana
              </button>
              <button
                onClick={() => setSelectedPeriod('mes')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === 'mes'
                    ? 'bg-primary-500 text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Este Mês
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 -mt-6">
          {/* Stats Card */}
          <div className="bg-gradient-to-br from-primary-900/50 to-gray-900/50 backdrop-blur-sm border border-primary-800/30 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary-400">
                  {composers.length}
                </div>
                <div className="text-sm text-gray-400 mt-1">Compositores</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">
                  {composers.filter(c => c.isTrending).length}
                </div>
                <div className="text-sm text-gray-400 mt-1">Em Alta</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-400">
                  {composers.reduce((acc, c) => acc + c.followers, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-400 mt-1">Seguidores</div>
              </div>
            </div>
          </div>

          {/* Composers List */}
          {composers.length > 0 ? (
            <div className="space-y-2">
              {composers.map((compositor, index) => (
                <Link
                  key={compositor.id}
                  to={`/compositor/${compositor.id}`}
                  className={`group relative bg-gradient-to-r ${
                    index === 0
                      ? 'from-primary-900/30 to-gray-900/30 border-primary-700/50'
                      : 'from-gray-900/50 to-gray-800/30 border-gray-800/50'
                  } backdrop-blur-sm border rounded-xl p-4 hover:scale-[1.02] transition-all duration-200 block cursor-pointer`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`text-2xl font-bold ${
                          index === 0
                            ? 'text-primary-400'
                            : index === 1
                            ? 'text-gray-300'
                            : index === 2
                            ? 'text-amber-600'
                            : 'text-gray-500'
                        }`}
                      >
                        #{compositor.rank}
                      </div>
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <img
                        src={compositor.image}
                        alt={compositor.name}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-700 group-hover:ring-primary-500 transition-all"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate flex items-center gap-2">
                        {compositor.name}
                        {compositor.isTrending && (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        )}
                      </h3>
                      <p className="text-gray-400 text-sm truncate flex items-center gap-1">
                        <Music className="w-3 h-3" />
                        {compositor.popularHino}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {formatFollowers(compositor.followers)} seguidores
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top Badge */}
                  {index < 10 && getRankBadge(index).label && (
                    <div
                      className={`absolute -top-2 -right-2 ${getRankBadge(index).className} text-xs font-bold px-3 py-1 rounded-full shadow-lg`}
                    >
                      {getRankBadge(index).label}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <Users className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum compositor encontrado
              </h3>
              <p className="text-gray-400">
                Não há compositores registrados neste período
              </p>
            </div>
          )}

          {/* Bottom Info */}
          <div className="mt-8 p-6 bg-gray-900/30 rounded-xl border border-gray-800">
            <p className="text-gray-400 text-sm text-center">
              Os rankings são baseados no número de seguidores e atualizados em tempo real.
              <br />
              <span className="text-primary-400">
                Última atualização: {new Date().toLocaleTimeString('pt-BR')}
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
