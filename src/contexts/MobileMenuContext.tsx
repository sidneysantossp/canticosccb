import React, { createContext, useContext, useState, useCallback } from 'react';

interface MobileMenuContextType {
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined);

export const MobileMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openMenu = useCallback(() => {
    console.log('📱 MobileMenu: OPENING');
    setIsMenuOpen(true);
  }, []);
  const closeMenu = useCallback(() => {
    console.log('📱 MobileMenu: CLOSING');
    setIsMenuOpen(false);
  }, []);

  // Debug: log state changes
  React.useEffect(() => {
    console.log('📱 MobileMenu state changed:', isMenuOpen);
  }, [isMenuOpen]);

  return (
    <MobileMenuContext.Provider value={{ isMenuOpen, openMenu, closeMenu }}>
      {children}
    </MobileMenuContext.Provider>
  );
};

export const useMobileMenu = () => {
  const context = useContext(MobileMenuContext);
  if (context === undefined) {
    throw new Error('useMobileMenu must be used within a MobileMenuProvider');
  }
  return context;
};
