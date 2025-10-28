import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Book, Youtube, Clock } from 'lucide-react';
import { formatDuration } from '@/utils/youtubeApi';
import { 
  fetchBibleNarrated, 
  deleteBibleNarrated, 
  toggleBibleNarratedActive,
  BibleNarrated
} from '@/api/bibleNarrated';
import { getBibleNarratedSectionEnabled, setBibleNarratedSectionEnabled } from '@/api/bibleNarrated';

const AdminBibleNarrated: React.FC = () => {
  const [bibleData, setBibleData] = useState<BibleNarrated[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionEnabled, setSectionEnabled] = useState<boolean>(true);
  const [sectionSaving, setSectionSaving] = useState<boolean>(false);

  useEffect(() => {
    loadBibleData();
    // Carregar flag global da seção
    (async () => {
      try {
        const enabled = await getBibleNarratedSectionEnabled();
        setSectionEnabled(enabled);
      } catch {}
    })();
  }, []);

  const loadBibleData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchBibleNarrated();
      setBibleData(data);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setError(error?.message || 'Erro ao carregar dados da Bíblia Narrada');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSection = async () => {
    const newValue = !sectionEnabled;
    setSectionEnabled(newValue); // otimista
    setSectionSaving(true);
    try {
      await setBibleNarratedSectionEnabled(newValue);
    } catch (e) {
      // rollback em caso de erro
      setSectionEnabled(!newValue);
      alert('Falha ao salvar preferência.');
    } finally {
      setSectionSaving(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${title}"?`)) return;

    try {
      await deleteBibleNarrated(id);
      await loadBibleData();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao deletar. Verifique o console para mais detalhes.');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await toggleBibleNarratedActive(id);
      await loadBibleData();
    } catch (error) {
      console.error('Erro ao alternar status:', error);
      alert('Erro ao alternar status. Verifique o console para mais detalhes.');
    }
  };

  const filteredData = bibleData.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.book_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando Bíblia Narrada...</p>
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
          <h1 className="text-3xl font-bold text-white">Bíblia Narrada</h1>
          <p className="text-gray-400 mt-1">{filteredData.length} itens cadastrados</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-300 select-none">
            <input
              type="checkbox"
              checked={sectionEnabled}
              onChange={handleToggleSection}
              className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-green-600"
            />
            {sectionSaving ? 'Salvando…' : 'Exibir seção na Home'}
          </label>
          <Link
            to="/admin/bible-narrated/criar"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Item
          </Link>
        </div>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por título, livro ou descrição..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-600"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((item) => (
          <div
            key={item.id}
            className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group"
          >
            <div className="relative aspect-video">
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleToggleActive(item.id)}
                  className={`p-2 rounded-lg text-white transition-colors ${
                    item.is_active 
                      ? 'bg-green-500/90 hover:bg-green-600' 
                      : 'bg-gray-500/90 hover:bg-gray-600'
                  }`}
                  title={item.is_active ? 'Ativo' : 'Inativo'}
                >
                  {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <Link
                  to={`/admin/bible-narrated/editar/${item.id}`}
                  className="p-2 rounded-lg bg-blue-500/90 text-white hover:bg-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="p-2 rounded-lg bg-red-500/90 text-white hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {item.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(item.duration)}
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Book className="w-4 h-4 text-green-500" />
                <span className="text-green-500 text-sm font-semibold">{item.book_name}</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                {item.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">
                  Ordem: {item.display_order}
                </span>
                <a
                  href={item.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-red-500 hover:text-red-400 text-xs transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                  Ver no YouTube
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Book className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">Nenhum item encontrado</p>
          <p className="text-gray-500 text-sm">
            {searchTerm ? 'Tente ajustar sua busca' : 'Adicione o primeiro item'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminBibleNarrated;
