import React, { createContext, useContext, useState } from 'react';

interface PlayerContextType {
  isFullScreenOpen: boolean;
  openFullScreen: () => void;
  closeFullScreen: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);

  const openFullScreen = () => {
    // Só abre no mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      console.log('Opening fullscreen');
      setIsFullScreenOpen(true);
    }
  };

  const closeFullScreen = () => {
    console.log('Closing fullscreen');
    setIsFullScreenOpen(false);
  };

  return (
    <PlayerContext.Provider value={{ isFullScreenOpen, openFullScreen, closeFullScreen }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayerContext must be used within PlayerProvider');
  }
  return context;
};
