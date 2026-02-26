import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Mic2, Radio, Sparkles } from 'lucide-react';

interface CategoryGridAltProps {
  isDarkMode: boolean;
}

const CategoryGridAlt: React.FC<CategoryGridAltProps> = ({ isDarkMode }) => {
  const categories = [
    { id: 'cantados', name: 'Hinos Cantados', icon: Mic2, color: isDarkMode ? 'from-blue-600 to-blue-800' : 'from-blue-400 to-blue-600' },
    { id: 'tocados', name: 'Hinos Tocados', icon: Music, color: isDarkMode ? 'from-purple-600 to-purple-800' : 'from-purple-400 to-purple-600' },
    { id: 'avulsos', name: 'Hinos Avulsos', icon: Radio, color: isDarkMode ? 'from-green-600 to-green-800' : 'from-green-400 to-green-600' },
    { id: 'recem-chegados', name: 'Novos Lançamentos', icon: Sparkles, color: isDarkMode ? 'from-orange-600 to-orange-800' : 'from-orange-400 to-orange-600', directPath: '/recem-chegados' },
  ];

  return (
    <div>
      <h2 className={`text-2xl md:text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
        Categorias
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.id}
              to={(category as any).directPath || `/categoria/${category.id}`}
              className={`group relative overflow-hidden rounded-lg bg-gradient-to-br ${category.color} p-6 transition-transform hover:scale-105`}
            >
              <Icon className="text-white mb-2" size={32} />
              <h3 className="text-white font-bold text-lg">{category.name}</h3>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryGridAlt;
