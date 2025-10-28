import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreVertical,
  Music,
  Calendar,
  Play,
  Edit,
  Trash2,
  Eye,
  Share2
} from 'lucide-react';
import { albunsApi, compositoresApi } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

const ComposerAlbums: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const lastNonEmptyAlbumsRef = useRef<any[]>([]);

  // Carregar álbuns do banco de dados
  useEffect(() => {
    const loadAlbums = async () => {
      console.log('🔄 Carregando álbuns...');
      try {
        setLoading(true);
        // Tentar já filtrar no backend por compositor/usuário
        let resolvedCompositorId: number | string | undefined = undefined;
        try {
          if (user?.id) {
            const comp0 = await compositoresApi.getByUsuarioId(user.id);
            const c0: any = (comp0 as any)?.data || comp0;
            if (c0?.id) resolvedCompositorId = String(c0.id);
          }
        } catch {}
        const response = await albunsApi.list({ page: 1, limit: 1000 } as any);
        console.log(' Resposta completa da API:', response);
        
        // A API retorna { "albuns": [...], "total": 9, ... }
        const raw: any = response as any;
        console.log(' Raw response completa:', raw);
        
        let albumsData = [];
        
        // A API retorna { "albuns": [...], "total": 9, ... }
        if (Array.isArray(raw?.albuns)) {
          albumsData = raw.albuns;
          console.log(' Dados extraídos de raw.albuns');
        } else if (Array.isArray(raw?.data?.albuns)) {
          albumsData = raw.data.albuns;
          console.log(' Dados extraídos de raw.data.albuns');
        } else if (Array.isArray(raw?.data)) {
          albumsData = raw.data;
          console.log(' Dados extraídos de raw.data');
        } else {
          console.log(' Nenhuma estrutura de array encontrada');
          console.log(' Estrutura disponível:', Object.keys(raw || {}));
        }

        console.log(' Albums data extraído:', albumsData.length, albumsData);
        console.log(' Quantidade total de álbuns:', albumsData.length);
        
        // Debug: Mostrar compositor_id de cada álbum
        albumsData.forEach((album, index) => {
          console.log(` Álbum ${index + 1}:`, {
            id: album.id,
            titulo: album.titulo,
            compositor_id: album.compositor_id,
            tipo: typeof album.compositor_id
          });
        });
        
        // Descobrir compositor_id real do usuário logado
        let compositorId: string | number | null = null;
        let compositorNome: string | null = null;
        if (user?.id) {
          try {
            const comp = await compositoresApi.getByUsuarioId(user.id);
            const cdata: any = (comp as any)?.data || comp;
            compositorId = cdata?.id ?? null;
            compositorNome = cdata?.nome || cdata?.nome_artistico || null;
            console.log(' Compositor resolvido:', { compositorId, compositorNome });
          } catch (e) {
            console.warn('Não foi possível resolver compositor pelo usuario_id');
          }
        }

        // FILTRAR APENAS ÁLBUNS DO COMPOSITOR LOGADO
        let myAlbums = albumsData;
        if (compositorId != null) {
          myAlbums = albumsData.filter((album: any) => String(album.compositor_id) === String(compositorId));
        }

        // Fallback adicional: após criar um álbum, mostrar pelo id/título gravado localmente
        if (myAlbums.length === 0) {
          const lastId = localStorage.getItem('lastAlbumId');
          const lastTitle = localStorage.getItem('lastAlbumTitle');
          const lastPrev = localStorage.getItem('lastAlbumIdPrev');
          const myIdsRaw = localStorage.getItem('myAlbumIds');
          const myIds: string[] = (() => { try { return JSON.parse(myIdsRaw || '[]') } catch { return [] } })();
          if (lastId || lastTitle) {
            const byLast = albumsData.filter((a: any) =>
              (lastId && String(a.id) === String(lastId)) ||
              (lastTitle && String(a.titulo || a.title || '').toLowerCase().trim() === String(lastTitle).toLowerCase().trim())
            );
            if (byLast.length > 0) {
              console.log('✅ Fallback exibindo último álbum criado:', byLast.map((a: any) => a.id));
              myAlbums = byLast;
            }
          }

          // Fallback por IDs persistidos do usuário
          if (myAlbums.length === 0 && myIds.length > 0) {
            const byIds = albumsData.filter((a: any) => myIds.includes(String(a.id)) || (lastPrev && String(a.id) === String(lastPrev)));
            if (byIds.length > 0) {
              console.log('✅ Fallback por myAlbumIds:', byIds.map((a: any) => a.id));
              myAlbums = byIds;
            }
          }
        }

        // Fallback 2: scan por hinos do compositor (para álbuns antigos com compositor_id = NULL)
        if (myAlbums.length === 0 && compositorNome) {
          try {
            console.log('🧭 Executando fallback de varredura por hinos do compositor:', compositorNome);
            const allResp = await albunsApi.list({ page: 1, limit: 200 } as any);
            const rawAll: any = allResp as any;
            let allData: any[] = [];
            if (Array.isArray(rawAll?.albuns)) allData = rawAll.albuns;
            else if (Array.isArray(rawAll?.data?.albuns)) allData = rawAll.data.albuns;
            else if (Array.isArray(rawAll?.data)) allData = rawAll.data;

            const limited = allData.slice(0, 60);
            const matches: any[] = [];
            const expect = String(compositorNome).toLowerCase();
            for (const a of limited) {
              try {
                const hr = await albunsApi.listHinos(parseInt(a.id));
                const rawH: any = hr as any;
                const list = Array.isArray(rawH?.data?.hinos)
                  ? rawH.data.hinos
                  : Array.isArray(rawH?.hinos)
                  ? rawH.hinos
                  : Array.isArray(rawH?.data)
                  ? rawH.data
                  : [];
                const hasMine = list.some((h: any) => String(h.compositor || '').toLowerCase().includes(expect));
                if (hasMine) matches.push(a);
              } catch (e) {}
            }
            if (matches.length > 0) {
              console.log('✅ Fallback por hinos encontrou álbuns:', matches.map((m: any) => m.id));
              myAlbums = matches;
            }
          } catch (scanErr) {
            console.warn('Fallback por hinos falhou:', scanErr);
          }
        }
        
        console.log('👤 ID do usuário logado:', user?.id, '(tipo:', typeof user?.id, ')');
        console.log('🎵 Meus álbuns (filtrados):', myAlbums.length);
        
        
        console.log('🎯 Final - myAlbums antes da normalização:', myAlbums.length, myAlbums);
        
        // Normalizar dados para o formato esperado pela UI (usando apenas meus álbuns)
        const normalizedAlbums = myAlbums.map(album => ({
          id: album.id,
          title: album.titulo || album.title,
          coverUrl: album.cover_url || album.coverUrl || 'https://via.placeholder.com/300',
          songCount: (album.total_hinos ?? album.total_tracks ?? album.hinos_count ?? 0),
          releaseDate: album.ano ? `${album.ano}-01-01` : (album.created_at || new Date().toISOString().split('T')[0]),
          status: album.ativo ? 'published' : 'draft',
          plays: (album.total_plays ?? album.plays ?? 0),
          likes: (album.total_likes ?? album.likes ?? 0)
        }));
        
        console.log(' Final - normalizedAlbums:', normalizedAlbums.length, normalizedAlbums);
        // Evitar sumir após segundo carregamento: se vier vazio, mantém o último não-vazio
        if (normalizedAlbums.length > 0) {
          setAlbums(normalizedAlbums);
          lastNonEmptyAlbumsRef.current = normalizedAlbums;
        } else {
          console.log('🛑 Resposta vazia ignorada – mantendo último estado não-vazio');
          if (lastNonEmptyAlbumsRef.current.length > 0) {
            setAlbums(lastNonEmptyAlbumsRef.current);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar álbuns:', error);
        // Mantém último estado não-vazio em caso de erro para evitar flicker
        if (lastNonEmptyAlbumsRef.current.length > 0) {
          setAlbums(lastNonEmptyAlbumsRef.current);
        }
      } finally {
        setLoading(false);
      }
    };
    loadAlbums();
  }, [user?.id]);

  // Debug: Verificar se o componente está renderizando os dados
  useEffect(() => {
    console.log('🎯 Estado atual dos álbuns:', albums.length, albums);
  }, [albums]);
  
  // Mock data (removido)
  const albumsMock = [
    {
      id: 1,
      title: 'Hinos de Louvor - Vol. 1',
      coverUrl: 'https://picsum.photos/seed/album1/300/300',
      songCount: 15,
      releaseDate: '2024-01-15',
      status: 'published',
      plays: 125430,
      likes: 8920
    },
    {
      id: 2,
      title: 'Adoração e Gratidão',
      coverUrl: 'https://picsum.photos/seed/album2/300/300',
      songCount: 12,
      releaseDate: '2023-11-20',
      status: 'published',
      plays: 98234,
      likes: 6543
    },
    {
      id: 3,
      title: 'Hinos Instrumentais',
      coverUrl: 'https://picsum.photos/seed/album3/300/300',
      songCount: 10,
      releaseDate: '2023-08-10',
      status: 'published',
      plays: 76543,
      likes: 5432
    },
    {
      id: 4,
      title: 'Cânticos de Esperança',
      coverUrl: 'https://picsum.photos/seed/album4/300/300',
      songCount: 8,
      releaseDate: '2024-03-05',
      status: 'draft',
      plays: 0,
      likes: 0
    },
    {
      id: 5,
      title: 'Hinos Clássicos Renovados',
      coverUrl: 'https://picsum.photos/seed/album5/300/300',
      songCount: 20,
      releaseDate: '2023-05-15',
      status: 'published',
      plays: 154320,
      likes: 12340
    },
    {
      id: 6,
      title: 'Mensagens de Fé',
      coverUrl: 'https://picsum.photos/seed/album6/300/300',
      songCount: 14,
      releaseDate: '2023-12-01',
      status: 'published',
      plays: 87650,
      likes: 7890
    }
  ];

  const filteredAlbums = albums.filter(album =>
    album.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Meus Álbuns</h1>
          <p className="text-text-muted">
            {filteredAlbums.length} {filteredAlbums.length === 1 ? 'álbum' : 'álbuns'}
          </p>
        </div>
        
        <Link
          to="/composer/albums/new"
          className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-primary-500 text-black rounded-lg font-medium hover:bg-primary-400 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Álbum
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar álbuns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-3 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-500 text-black'
                : 'bg-background-secondary text-white hover:bg-background-hover'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-3 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-500 text-black'
                : 'bg-background-secondary text-white hover:bg-background-hover'
            }`}
          >
            Lista
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="text-text-muted text-sm">Total de Álbuns</p>
              <p className="text-white text-2xl font-bold">{albums.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-text-muted text-sm">Total de Plays</p>
              <p className="text-white text-2xl font-bold">
                {formatNumber(albums.reduce((sum, album) => sum + album.plays, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-text-muted text-sm">Total de Hinos</p>
              <p className="text-white text-2xl font-bold">
                {albums.reduce((sum, album) => sum + album.songCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white mt-4">Carregando álbuns...</p>
        </div>
      )}

      {/* Sem álbuns */}
      {!loading && filteredAlbums.length === 0 && (
        <div className="text-center py-20">
          <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchQuery ? 'Nenhum álbum encontrado' : 'Nenhum álbum ainda'}
          </h3>
          <p className="text-text-muted mb-6">
            {searchQuery ? 'Tente buscar com outros termos' : 'Crie seu primeiro álbum para começar!'}
          </p>
          {!searchQuery && (
            <Link
              to="/composer/albums/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-black rounded-lg font-medium hover:bg-primary-400 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Álbum
            </Link>
          )}
        </div>
      )}

      {/* Albums Grid/List */}
      {!loading && filteredAlbums.length > 0 && viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlbums.map((album) => (
            <div
              key={album.id}
              className="bg-background-secondary rounded-xl overflow-hidden border border-gray-800 hover:border-primary-500 transition-all group"
            >
              <div className="relative aspect-square">
                <img
                  src={album.coverUrl}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Link
                    to={`/composer/albums/${album.id}`}
                    className="w-12 h-12 bg-primary-500 text-black rounded-full flex items-center justify-center hover:bg-primary-400 transition-colors"
                  >
                    <Eye className="w-6 h-6" />
                  </Link>
                  <button className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Play className="w-6 h-6 ml-0.5" />
                  </button>
                </div>
                {album.status === 'draft' && (
                  <div className="absolute top-3 right-3 px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                    Rascunho
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-white font-semibold mb-1 truncate">{album.title}</h3>
                <p className="text-text-muted text-sm mb-3">
                  {album.songCount} {album.songCount === 1 ? 'hino' : 'hinos'} • {formatDate(album.releaseDate)}
                </p>
                
                {album.status === 'published' && (
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      {formatNumber(album.plays)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Music className="w-4 h-4" />
                      {formatNumber(album.likes)}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                  <Link
                    to={`/composer/albums/edit/${album.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-background-tertiary text-white rounded-lg hover:bg-background-hover transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Link>
                  <button className="flex items-center justify-center px-3 py-2 bg-background-tertiary text-white rounded-lg hover:bg-background-hover transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="flex items-center justify-center px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && filteredAlbums.length > 0 && (
        <div className="bg-background-secondary rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-background-tertiary">
              <tr>
                <th className="text-left text-text-muted font-medium p-4">Álbum</th>
                <th className="text-left text-text-muted font-medium p-4">Hinos</th>
                <th className="text-left text-text-muted font-medium p-4">Lançamento</th>
                <th className="text-left text-text-muted font-medium p-4">Status</th>
                <th className="text-left text-text-muted font-medium p-4">Plays</th>
                <th className="text-left text-text-muted font-medium p-4">Curtidas</th>
                <th className="text-right text-text-muted font-medium p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlbums.map((album) => (
                <tr key={album.id} className="border-t border-gray-700 hover:bg-background-hover transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={album.coverUrl}
                        alt={album.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <span className="text-white font-medium">{album.title}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-white">{album.songCount}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-text-muted">{formatDate(album.releaseDate)}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      album.status === 'published'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {album.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-white">{formatNumber(album.plays)}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-white">{formatNumber(album.likes)}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/composer/albums/edit/${album.id}`}
                        className="p-2 text-text-muted hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button className="p-2 text-text-muted hover:text-white transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-text-muted hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredAlbums.length === 0 && (
        <div className="text-center py-16">
          <Music className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Nenhum álbum encontrado</h3>
          <p className="text-text-muted mb-6">
            {searchQuery
              ? 'Tente ajustar sua busca'
              : 'Comece criando seu primeiro álbum'}
          </p>
          {!searchQuery && (
            <Link
              to="/composer/albums/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-black rounded-lg font-medium hover:bg-primary-400 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Álbum
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ComposerAlbums;
