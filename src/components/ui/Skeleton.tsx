import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-300 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Could be enhanced with custom wave animation
    none: ''
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className = '' 
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        variant="text"
        height="1rem"
        width={index === lines - 1 ? '75%' : '100%'}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-background-secondary rounded-lg p-4 ${className}`}>
    <Skeleton variant="rectangular" height="12rem" className="mb-4" />
    <Skeleton variant="text" height="1.25rem" className="mb-2" />
    <Skeleton variant="text" height="1rem" width="60%" />
  </div>
);

export const SkeletonTrack: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-4 p-4 ${className}`}>
    <Skeleton variant="rectangular" width="3rem" height="3rem" />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" height="1rem" width="70%" />
      <Skeleton variant="text" height="0.875rem" width="50%" />
    </div>
    <Skeleton variant="text" width="3rem" height="0.875rem" />
  </div>
);

export const SkeletonPlaylist: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-background-secondary rounded-lg overflow-hidden ${className}`}>
    <Skeleton variant="rectangular" height="12rem" />
    <div className="p-4">
      <Skeleton variant="text" height="1.25rem" className="mb-2" />
      <Skeleton variant="text" height="0.875rem" width="60%" />
    </div>
  </div>
);

export default Skeleton;
