import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features?: string[];
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ 
  title, 
  description, 
  icon: Icon,
  features = []
}) => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-400">{description}</p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Em Desenvolvimento</h3>
          <p className="text-gray-400 mb-6">
            Este módulo está sendo desenvolvido e estará disponível em breve.
          </p>
          
          {features.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Funcionalidades Planejadas:</p>
              <ul className="text-sm text-gray-300 space-y-1">
                {features.map((feature, index) => (
                  <li key={index}>✓ {feature}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
