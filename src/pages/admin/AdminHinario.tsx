import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, BookOpen } from 'lucide-react';
import { fetchHinarioList, HinarioHymn, HINARIO_CATEGORIES } from '@/api/hinario';
import { supabaseDelete, supabaseUpdate } from '@/lib/supabaseRest';

const AdminHinario: React.FC = () => {
  const [hymns, setHymns] = useState<HinarioHymn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    loadHymns();
  }, []);

  const loadHymns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchHinarioList();
      setHymns(data);
    } catch (err: any) {
      console.error('Erro ao carregar hinário:', err);
      setError(err?.message || 'Erro ao carregar hinário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, titulo: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o hino "${titulo}"?`)) return;
    try {
      await supabaseDelete('hinario', { id: `eq.${id}` });
      await loadHymns();
    } catch (err) {
      console.error('Erro ao deletar hino:', err);
      alert('Erro ao deletar hino.');
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await supabaseUpdate('hinario', { id: `eq.${id}` }, { is_active: !currentActive });
      await loadHymns();
    } catch (err) {
      console.error('Erro ao alternar status:', err);
    }
  };

  const filtered = hymns.filter(h => {
    const matchSearch = !searchTerm ||
      h.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(h.numero) === searchTerm.trim();
    const matchCategory = !filterCategory || h.categoria === filterCategory;
    return matchSearch && matchCategory;
  });

  const getCategoryLabel = (value: string) =>
    HINARIO_CATEGORIES.find(c => c.value === value)?.label || value;

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary-400" />
            Hinário
          </h1>
          <p className="text-gray-400 mt-1">Gerencie as letras do hinário da CCB</p>
        </div>
        <Link
          to="/admin/hinario/new"
          className="inline-flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-black font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Hino
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número ou título..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todas as Categorias</option>
          {HINARIO_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total</p>
          <p className="text-2xl font-bold text-white">{hymns.length}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Ativos</p>
          <p className="text-2xl font-bold text-green-400">{hymns.filter(h => h.is_active).length}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Visualizações</p>
          <p className="text-2xl font-bold text-primary-400">{hymns.reduce((sum, h) => sum + h.views_count, 0).toLocaleString()}</p>
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
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl text-gray-400 mb-2">
            {searchTerm || filterCategory ? 'Nenhum hino encontrado' : 'Nenhum hino cadastrado'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterCategory ? 'Tente ajustar os filtros' : 'Comece adicionando o primeiro hino'}
          </p>
          {!searchTerm && !filterCategory && (
            <Link
              to="/admin/hinario/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-black font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Hino
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Nº</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Título</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400 hidden md:table-cell">Categoria</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400 hidden lg:table-cell">Views</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filtered.map(hymn => (
                  <tr key={hymn.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-primary-400 font-bold">{hymn.numero}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{hymn.titulo}</p>
                      {hymn.subtitulo && <p className="text-gray-500 text-sm">{hymn.subtitulo}</p>}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-gray-300 text-sm">{getCategoryLabel(hymn.categoria)}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-gray-300 text-sm">{hymn.views_count.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(hymn.id, hymn.is_active)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          hymn.is_active
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
                        {hymn.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {hymn.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/hinario/${hymn.numero}`}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="Visualizar"
                          target="_blank"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/hinario/${hymn.id}/edit`}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(hymn.id, hymn.titulo)}
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

export default AdminHinario;
