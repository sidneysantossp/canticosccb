import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Music, FileText, Sparkles, PenSquare } from 'lucide-react';
import { fetchCifras, deleteCifra, toggleCifraActive, Cifra, INSTRUMENTS, CATEGORIES } from '@/api/cifras';
import { fetchLegacyCifraMigrationStatuses, type LegacyCifraMigrationStatus } from '@/lib/admin/cifrasV2AdminApi';

const AdminCifras: React.FC = () => {
  const [cifras, setCifras] = useState<Cifra[]>([]);
  const [migrationStatuses, setMigrationStatuses] = useState<Record<number, LegacyCifraMigrationStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInstrument, setFilterInstrument] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    loadCifras();
  }, []);

  const loadCifras = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchCifras();
      setCifras(data);
      const statuses = await fetchLegacyCifraMigrationStatuses(data.map((item) => item.id));
      setMigrationStatuses(statuses);
    } catch (err: any) {
      console.error('Erro ao carregar cifras:', err);
      setError(err?.message || 'Erro ao carregar cifras');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a cifra "${title}"?`)) return;
    try {
      await deleteCifra(id);
      await loadCifras();
    } catch (err) {
      console.error('Erro ao deletar cifra:', err);
      alert('Erro ao deletar cifra.');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await toggleCifraActive(id);
      await loadCifras();
    } catch (err) {
      console.error('Erro ao alternar status:', err);
    }
  };

  const filtered = cifras.filter(c => {
    const matchSearch = !searchTerm ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchInstrument = !filterInstrument || c.instrument === filterInstrument;
    const matchCategory = !filterCategory || c.category === filterCategory;
    return matchSearch && matchInstrument && matchCategory;
  });

  const getInstrumentLabel = (value: string) =>
    INSTRUMENTS.find(i => i.value === value)?.label || value;

  const getCategoryLabel = (value: string) =>
    CATEGORIES.find(c => c.value === value)?.label || value;

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary-400" />
            Cifras
          </h1>
          <p className="text-gray-400 mt-1">Gerencie as cifras musicais da plataforma</p>
        </div>
        <Link
          to="/admin/cifras-v2/new"
          className="inline-flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-black font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Cifra V2
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título ou artista..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterInstrument}
          onChange={e => setFilterInstrument(e.target.value)}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos os Instrumentos</option>
          {INSTRUMENTS.map(i => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todas as Categorias</option>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total</p>
          <p className="text-2xl font-bold text-white">{cifras.length}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Ativas</p>
          <p className="text-2xl font-bold text-green-400">{cifras.filter(c => c.is_active).length}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Inativas</p>
          <p className="text-2xl font-bold text-red-400">{cifras.filter(c => !c.is_active).length}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Visualizações</p>
          <p className="text-2xl font-bold text-primary-400">{cifras.reduce((sum, c) => sum + c.views_count, 0).toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Migradas V2</p>
          <p className="text-2xl font-bold text-cyan-400">{Object.keys(migrationStatuses).length}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl text-gray-400 mb-2">
            {searchTerm || filterInstrument || filterCategory ? 'Nenhuma cifra encontrada' : 'Nenhuma cifra cadastrada'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterInstrument || filterCategory ? 'Tente ajustar os filtros' : 'Comece adicionando a primeira cifra'}
          </p>
          {!searchTerm && !filterInstrument && !filterCategory && (
            <Link
              to="/admin/cifras-v2/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-black font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nova Cifra V2
            </Link>
          )}
        </div>
      ) : (
        /* Table */
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Cifra</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400 hidden md:table-cell">Instrumento</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400 hidden md:table-cell">Tom</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400 hidden lg:table-cell">Categoria</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400 hidden lg:table-cell">Views</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filtered.map(cifra => (
                  <tr key={cifra.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {cifra.cover_url ? (
                          <img src={cifra.cover_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                            <Music className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{cifra.title}</p>
                          <p className="text-gray-400 text-sm">{cifra.artist}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-gray-300 text-sm">{getInstrumentLabel(cifra.instrument)}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="px-2.5 py-1 bg-primary-500/20 text-primary-400 text-sm font-medium rounded-lg">
                        {cifra.original_key}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-gray-300 text-sm">{getCategoryLabel(cifra.category)}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-gray-300 text-sm">{cifra.views_count.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-2">
                        <button
                          onClick={() => handleToggleActive(cifra.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            cifra.is_active
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                        >
                          {cifra.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {cifra.is_active ? 'Ativa' : 'Inativa'}
                        </button>
                        {migrationStatuses[cifra.id] ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300">
                            <Sparkles className="w-3.5 h-3.5" />
                            V2 {migrationStatuses[cifra.id].versionStatus || 'ok'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300">
                            <Sparkles className="w-3.5 h-3.5" />
                            V2 pendente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/cifra/${cifra.slug}`}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="Visualizar"
                          target="_blank"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={migrationStatuses[cifra.id]?.versionId
                            ? `/admin/cifras-v2/versions/${migrationStatuses[cifra.id].versionId}/edit`
                            : `/admin/cifras/${cifra.id}/migrate`}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                          title={migrationStatuses[cifra.id]?.versionId ? 'Editar no V2' : 'Migrar para editar no V2'}
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/cifras/${cifra.id}/migrate`}
                          className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors text-cyan-400 hover:text-cyan-300"
                          title="Preview / migrar V2"
                        >
                          <Sparkles className="w-4 h-4" />
                        </Link>
                        {migrationStatuses[cifra.id]?.versionId && (
                          <Link
                            to={`/admin/cifras-v2/versions/${migrationStatuses[cifra.id].versionId}/edit`}
                            className="p-2 hover:bg-primary-500/20 rounded-lg transition-colors text-primary-400 hover:text-primary-300"
                            title="Abrir editor V2"
                          >
                            <PenSquare className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(cifra.id, cifra.title)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCifras;
