import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = '100%', 
  height = '20px',
  rounded = false,
  animate = true
}) => {
  return (
    <div 
      className={`
        bg-gray-800/50 
        ${animate ? 'animate-pulse' : ''} 
        ${rounded ? 'rounded-full' : 'rounded-lg'} 
        ${className}
      `}
      style={{ width, height }}
    />
  );
};

// Skeleton para Cards de Compositores
export const ComposerCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center space-y-3 p-4">
      {/* Avatar circular */}
      <Skeleton 
        width="120px" 
        height="120px" 
        rounded 
        className="mx-auto"
      />
      
      {/* Nome */}
      <Skeleton 
        width="140px" 
        height="16px" 
        className="mx-auto"
      />
      
      {/* Categoria */}
      <Skeleton 
        width="80px" 
        height="12px" 
        className="mx-auto"
      />
      
      {/* Seguidores */}
      <div className="flex items-center space-x-2">
        <Skeleton width="60px" height="14px" />
        <Skeleton width="20px" height="20px" rounded />
      </div>
    </div>
  );
};

// Skeleton para Lista de Admin
export const AdminTableSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex space-x-4 p-4">
        <Skeleton width="200px" height="20px" />
        <Skeleton width="100px" height="20px" />
        <Skeleton width="80px" height="20px" />
        <Skeleton width="120px" height="20px" />
      </div>
      
      {/* Rows */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <Skeleton width="48px" height="48px" rounded />
            <div className="space-y-2">
              <Skeleton width="160px" height="16px" />
              <Skeleton width="100px" height="12px" />
            </div>
          </div>
          <Skeleton width="80px" height="14px" />
          <Skeleton width="60px" height="24px" rounded />
          <div className="flex space-x-2">
            <Skeleton width="32px" height="32px" rounded />
            <Skeleton width="32px" height="32px" rounded />
            <Skeleton width="32px" height="32px" rounded />
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton para Dashboard
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton width="80px" height="14px" />
              <Skeleton width="24px" height="24px" rounded />
            </div>
            <Skeleton width="120px" height="32px" className="mb-2" />
            <Skeleton width="100px" height="12px" />
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <Skeleton width="200px" height="20px" className="mb-4" />
          <Skeleton width="100%" height="300px" />
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <Skeleton width="180px" height="20px" className="mb-4" />
          <Skeleton width="100%" height="300px" />
        </div>
      </div>
    </div>
  );
};
