import React from 'react';
import { DashboardSkeleton } from './SkeletonLoader';

interface LoadingFallbackProps {
  type?: 'spinner' | 'skeleton' | 'minimal';
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  type = 'skeleton',
  message = 'Carregando...'
}) => {
  if (type === 'skeleton') {
    return <DashboardSkeleton />;
  }

  if (type === 'minimal') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400 text-sm">{message}</div>
      </div>
    );
  }

  // Default spinner
  return (
    <div className="flex items-center justify-center min-h-screen bg-background-primary">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <p className="text-gray-400 text-sm">{message}</p>
      </div>
    </div>
  );
};
