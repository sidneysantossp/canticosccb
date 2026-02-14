import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Eye } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { generateBreadcrumbSchema } from '@/utils/schemaGenerator';
import { fetchHinarioList, HinarioHymn, HINARIO_CATEGORIES } from '@/api/hinario';

const normalize = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const HinarioListPage: React.FC = () => {
  const [hymns, setHymns] = useState<HinarioHymn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    loadHymns();
  }, []);

  const loadHymns = async () => {
    try {
      setIsLoading(true);
      const data = await fetchHinarioList({ is_active: true });
      setHymns(data);
    } catch (err) {
      console.error('Erro ao carregar hinário:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = hymns.filter(h => {
    const q = normalize(searchTerm.trim());
    const matchSearch = !searchTerm ||
      normalize(h.titulo).includes(q) ||
      String(h.numero) === searchTerm.trim() ||
      String(h.numero).startsWith(searchTerm.trim());
    const matchCategory = !filterCategory || h.categoria === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <>
      <SEOHead
        title="Hinário CCB - Letras dos Hinos"
        description="Leia as letras dos hinos do Hinário da Congregação Cristã no Brasil. Navegue por número ou busque por título."
        keywords="hinário, CCB, letras, hinos, congregação cristã, hinário 5"
        canonical="/hinario"
        schemaData={[
          generateBreadcrumbSchema([
            { name: 'Início', url: '/' },
            { name: 'Hinário', url: '/hinario' },
          ]),
        ]}
      />

      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Hinário
          </h1>
          <p className="text-gray-400 mt-2">Letras dos hinos da Congregação Cristã no Brasil</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número ou título..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos</option>
            {HINARIO_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-gray-400 mb-2">
              {searchTerm || filterCategory ? 'Nenhum hino encontrado' : 'Nenhum hino disponível'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterCategory ? 'Tente ajustar a busca' : 'Em breve teremos hinos disponíveis'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(hymn => (
              <Link
                key={hymn.id}
                to={`/hinario/${hymn.numero}`}
                className="group flex items-center gap-4 bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/50 hover:border-primary-500/40 rounded-xl px-4 py-3 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-400 font-bold text-lg">{hymn.numero}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium group-hover:text-primary-400 transition-colors text-sm">
                    {hymn.titulo}
                  </h3>
                  {hymn.subtitulo && (
                    <p className="text-gray-500 text-xs line-clamp-1">{hymn.subtitulo}</p>
                  )}
                </div>
                <span className="text-gray-600 text-xs flex items-center gap-1 flex-shrink-0">
                  <Eye className="w-3 h-3" />
                  {hymn.views_count}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default HinarioListPage;
