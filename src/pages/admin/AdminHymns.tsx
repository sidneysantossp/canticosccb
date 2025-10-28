import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music, Plus, Search, Edit, Trash2, Play } from 'lucide-react';
import { hinosApi } from '@/lib/api-client';

interface Hymn {
  id: number;
  numero: number;
  titulo: string;
  categoria: string;
  compositor?: string;
  cover_url?: string;
  audio_url?: string;
  duracao?: string;
  ativo: number;
}

const AdminHymns: React.FC = () => {
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHymns();
  }, []);

  const loadHymns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await hinosApi.list({ limit: 1000 });
      
      if (response.error) {
        setError(response.error);
        setHymns([]);
        return;
      }
      
      if (response.data) {
        const hinosData = response.data.hinos || response.data.data || response.data;
        if (Array.isArray(hinosData)) {
          setHymns(hinosData);
        } else {
          console.error('Dados de hinos não são um array:', hinosData);
          setHymns([]);
        }
      } else {
        setHymns([]);
      }
    } catch (error: any) {
      console.error('Error loading hymns:', error);
      setError(error?.message || 'Erro ao carregar hinos');
      setHymns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, titulo: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${titulo}"?`)) return;

    try {
      await hinosApi.delete(id);
      loadHymns();
    } catch (error) {
      console.error('Error deleting hymn:', error);
    }
  };

  // Filtrar hinos
  const filteredHymns = hymns.filter((hymn) => {
    const matchesSearch = 
      hymn.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hymn.numero.toString().includes(searchQuery) ||
      (hymn.compositor && hymn.compositor.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || hymn.categoria === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando hinos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Hinos</h1>
          <p className="text-gray-400 mt-1">{filteredHymns.length} hinos encontrados</p>
        </div>
        <Link
          to="/admin/hino/criar"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Hino
        </Link>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por número, título ou compositor..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-600"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
        >
          <option value="all">Todas as Categorias</option>
          <option value="Cantados">Cantados</option>
          <option value="Tocados">Tocados</option>
          <option value="Avulsos">Avulsos</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-400 text-sm font-semibold">#</th>
                <th className="px-4 py-3 text-left text-gray-400 text-sm font-semibold">Capa</th>
                <th className="px-4 py-3 text-left text-gray-400 text-sm font-semibold">Título</th>
                <th className="px-4 py-3 text-left text-gray-400 text-sm font-semibold">Categoria</th>
                <th className="px-4 py-3 text-left text-gray-400 text-sm font-semibold">Compositor</th>
                <th className="px-4 py-3 text-left text-gray-400 text-sm font-semibold">Duração</th>
                <th className="px-4 py-3 text-left text-gray-400 text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-right text-gray-400 text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredHymns.map((hymn) => (
                <tr key={hymn.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-white font-semibold">{hymn.numero}</td>
                  <td className="px-4 py-3">
                    <img
                      src={hymn.cover_url || 'https://via.placeholder.com/64?text=' + hymn.numero}
                      alt={hymn.titulo}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{hymn.titulo}</td>
                  <td className="px-4 py-3 text-gray-400">{hymn.categoria}</td>
                  <td className="px-4 py-3 text-gray-400">{hymn.compositor || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{hymn.duracao || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      hymn.ativo ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                    }`}>
                      {hymn.ativo ? 'Publicado' : 'Rascunho'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {hymn.audio_url && (
                        <a
                          href={hymn.audio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-colors"
                          title="Ouvir"
                        >
                          <Play className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        to={`/admin/hino/editar/${hymn.id}`}
                        className="p-2 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(hymn.id, hymn.titulo)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredHymns.length === 0 && (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">Nenhum hino encontrado</p>
              <p className="text-gray-500 text-sm">Tente ajustar os filtros ou adicione o primeiro hino</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHymns;
