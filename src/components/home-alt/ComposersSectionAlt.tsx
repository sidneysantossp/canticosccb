import React from 'react';
import ComposersSection from '@/components/home/ComposersSection';

interface ComposersSectionAltProps {
  isDarkMode: boolean;
}

const ComposersSectionAlt: React.FC<ComposersSectionAltProps> = ({ isDarkMode }) => {
  return (
    <div className={isDarkMode ? 'text-white' : 'text-black'}>
      <ComposersSection />
    </div>
  );
};

export default ComposersSectionAlt;
