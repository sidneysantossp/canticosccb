import React from 'react';
import BannerCTA from '@/components/home/BannerCTA';

interface BannerCTAAltProps {
  isDarkMode: boolean;
}

const BannerCTAAlt: React.FC<BannerCTAAltProps> = ({ isDarkMode }) => {
  return (
    <div className={isDarkMode ? 'text-white' : 'text-black'}>
      <BannerCTA />
    </div>
  );
};

export default BannerCTAAlt;
