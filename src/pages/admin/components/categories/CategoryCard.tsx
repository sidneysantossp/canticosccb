import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { Categoria } from '@/lib/api-client';

interface Props {
  category: Categoria;
  onEdit: (category: Categoria) => void;
  onDelete: (id: number, name: string) => void;
}

const CategoryCard: React.FC<Props> = ({ category, onEdit, onDelete }) => {
  return (
    <div
      className="relative bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
    >
      <div
        className="relative p-6 min-h-[150px]"
        style={{ backgroundColor: '#6366f1' }}
      >
        {category.imagem_url && (
          <div className="absolute bottom-0 right-0 w-36 h-36 opacity-50 overflow-hidden rounded-lg">
            <img
              src={category.imagem_url}
              alt={category.nome}
              className="w-full h-full object-cover rounded-lg"
              style={{ transform: 'rotate(15deg)', transformOrigin: 'bottom right' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-white/20 backdrop-blur-sm">
              📁
            </div>
            <div className="flex gap-2">
              <Link
                to={`/admin/categories/editar/${category.id}`}
                className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white transition-colors"
              >
                <Edit className="w-4 h-4" />
              </Link>
              <button
                onClick={() => onDelete(category.id, category.nome)}
                className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-red-500 text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <h3 className="text-white font-bold text-lg mb-1">{category.nome}</h3>
          {category.descricao && (
            <p className="text-white/80 text-sm line-clamp-2">{category.descricao}</p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                category.ativo ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}
            >
              {category.ativo ? 'Ativo' : 'Inativo'}
            </span>
            <span className="text-xs text-white/60">ID: {category.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;
