import React from 'react';
import { Play } from 'lucide-react';

interface PersonalizedSectionAltProps {
  title: string;
  items: any[];
  onPlay: (item: any) => void;
  isDarkMode: boolean;
}

const PersonalizedSectionAlt: React.FC<PersonalizedSectionAltProps> = ({
  title,
  items,
  onPlay,
  isDarkMode
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="px-6">
      <h2 className={`text-2xl md:text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
        {title}
      </h2>
      
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`group flex-shrink-0 w-40 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer ${
              isDarkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => onPlay(item)}
          >
            <div className="aspect-square relative overflow-hidden">
              <img
                src={item.cover_url || '/placeholder-hymn.jpg'}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                isDarkMode ? 'bg-black/60' : 'bg-white/60'
              }`}>
                <Play className={isDarkMode ? 'text-white' : 'text-black'} size={32} />
              </div>
            </div>
            <div className="p-3">
              <h3 className={`font-semibold text-sm truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {item.title}
              </h3>
              <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {item.composer_name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalizedSectionAlt;
