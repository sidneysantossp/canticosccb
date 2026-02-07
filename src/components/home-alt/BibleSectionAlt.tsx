import React from 'react';
import BibleSection from '@/components/home/BibleSection';

interface BibleSectionAltProps {
  isDarkMode: boolean;
}

const BibleSectionAlt: React.FC<BibleSectionAltProps> = ({ isDarkMode }) => {
  return (
    <div className={isDarkMode ? 'text-white' : 'text-black'}>
      <BibleSection />
    </div>
  );
};

export default BibleSectionAlt;
