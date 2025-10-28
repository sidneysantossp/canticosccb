import React, { createContext, useContext, useState } from 'react';

export type PlayerTheme = 'default' | 'album';

interface PlayerContextType {
  isFullScreenOpen: boolean;
  playerTheme: PlayerTheme;
  openFullScreen: (theme?: PlayerTheme) => void;
  closeFullScreen: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [playerTheme, setPlayerTheme] = useState<PlayerTheme>('default');

  const openFullScreen = (theme: PlayerTheme = 'default') => {
    setPlayerTheme(theme);
    // Só abre no mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsFullScreenOpen(true);
    }
  };

  const closeFullScreen = () => {
    setIsFullScreenOpen(false);
    // Resetar tema ao fechar
    setTimeout(() => setPlayerTheme('default'), 300);
  };

  return (
    <PlayerContext.Provider value={{ isFullScreenOpen, playerTheme, openFullScreen, closeFullScreen }}>
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
