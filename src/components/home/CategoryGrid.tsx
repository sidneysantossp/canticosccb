import React from 'react';
import { Link } from 'react-router-dom';

interface Category {
  id: number;
  name: string;
  description: string;
  image: string;
  color: string;
  link: string;
}

const categories: Category[] = [
  {
    id: 1,
    name: "Hinos Cantados",
    description: "Vozes que elevam a alma",
    image: "https://picsum.photos/seed/cat1/300/200",
    color: "from-blue-600 to-purple-600",
    link: "/hinos-cantados"
  },
  {
    id: 2,
    name: "Hinos Tocados",
    description: "Melodias instrumentais",
    image: "https://picsum.photos/seed/cat2/300/200",
    color: "from-green-600 to-teal-600",
    link: "/hinos-tocados"
  },
  {
    id: 3,
    name: "Instrumentais",
    description: "Música para reflexão",
    image: "https://picsum.photos/seed/cat3/300/200",
    color: "from-purple-600 to-pink-600",
    link: "/instrumentais"
  },
  {
    id: 4,
    name: "Bíblia Narrada",
    description: "A palavra falada",
    image: "https://picsum.photos/seed/cat4/300/200",
    color: "from-orange-600 to-red-600",
    link: "/biblia-narrada"
  }
];

const CategoryGrid: React.FC = () => {
  return (
    <section className="mb-12">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
        Explore por Categoria
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={category.link}
            className="group relative overflow-hidden rounded-lg bg-background-secondary hover:bg-background-tertiary transition-all duration-300 hover:scale-105"
          >
            {/* Background Image */}
            <div className="aspect-[4/3] relative overflow-hidden">
              <img 
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-60 group-hover:opacity-70 transition-opacity`}></div>
            </div>
            
            {/* Content */}
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
              <h3 className="text-lg font-bold text-white mb-1">
                {category.name}
              </h3>
              <p className="text-sm text-gray-200 opacity-90">
                {category.description}
              </p>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
