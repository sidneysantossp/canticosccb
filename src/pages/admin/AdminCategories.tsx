import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Grid } from 'lucide-react';
import { categoriasApi, Categoria } from '@/lib/api-client';
import CategoryCard from '@/pages/admin/components/categories/CategoryCard';

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await categoriasApi.list({ limit: 100 });
      
      if (response.error) {
        setError(response.error);
        setCategories([]);
        return;
      }
      
      if (response.data) {
        // A API pode retornar response.data.categorias, response.data.data ou response.data diretamente
        const categoriasData = response.data.categorias || response.data.data || response.data;
        
        if (Array.isArray(categoriasData)) {
          setCategories(categoriasData);
        } else {
          console.error('Dados de categorias não são um array:', categoriasData);
          setCategories([]);
        }
      } else {
        setCategories([]);
      }
    } catch (error: any) {
      console.error('Error loading categories:', error);
      setError(error?.message || 'Erro ao carregar categorias');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${name}"?`)) return;

    try {
      await categoriasApi.delete(id);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar categorias</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadCategories}
            className="btn-primary"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Categorias</h1>
          <p className="text-gray-400">Total: {categories.length} categorias</p>
        </div>
        <Link
          to="/admin/categories/criar"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Categoria
        </Link>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onEdit={(cat) => {}} // Não usado mais, removido do card
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <Grid className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">Nenhuma categoria criada</p>
          <p className="text-gray-500 text-sm mb-4">Crie sua primeira categoria temática</p>
          <Link
            to="/admin/categories/criar"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Criar Categoria
          </Link>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
