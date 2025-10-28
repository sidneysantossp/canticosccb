import React, { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-lg',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-2xl'
};

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  name, 
  size = 'md', 
  className = '' 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Gerar iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Gerar cor baseada no nome
  const getColorFromName = (name: string) => {
    const colors = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600',
      'from-red-500 to-pink-600',
      'from-yellow-500 to-orange-600',
      'from-indigo-500 to-blue-600',
      'from-purple-500 to-indigo-600',
      'from-pink-500 to-red-600',
      'from-teal-500 to-green-600'
    ];
    
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const baseClasses = `rounded-full object-cover flex items-center justify-center font-bold text-white ${sizeClasses[size]} ${className}`;

  // Se tem imagem e não deu erro, mostrar imagem
  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name}
        className={baseClasses}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback para iniciais com gradiente
  return (
    <div className={`bg-gradient-to-br ${getColorFromName(name)} ${baseClasses}`}>
      {getInitials(name)}
    </div>
  );
};
