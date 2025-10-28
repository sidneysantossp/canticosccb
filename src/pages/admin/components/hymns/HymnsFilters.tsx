import React from 'react';
import { Search } from 'lucide-react';

interface Props {
  searchInput: string;
  setSearchInput: (v: string) => void;
  statusFilter: 'all' | 'published' | 'draft';
  setStatusFilter: (v: 'all' | 'published' | 'draft') => void;
}

const HymnsFilters: React.FC<Props> = ({ searchInput, setSearchInput, statusFilter, setStatusFilter }) => {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título ou número..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              statusFilter === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              statusFilter === 'published' ? 'bg-primary-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Publicados
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              statusFilter === 'draft' ? 'bg-primary-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Rascunhos
          </button>
        </div>
      </div>
    </div>
  );
};

export default HymnsFilters;
