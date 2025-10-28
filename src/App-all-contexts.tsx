import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import './styles/globals.css';

// Página de teste com todos os contextos
const TestPage = () => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: '#121212',
    color: '#ffffff',
    padding: '2rem',
    fontFamily: 'Montserrat, system-ui, sans-serif'
  }}>
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#1db954', marginBottom: '2rem' }}>
        🎵 Cânticos CCB - Teste com Todos os Contextos
      </h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#1f1f1f',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>✅ Router</h3>
          <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>React Router</p>
        </div>
        
        <div style={{
          backgroundColor: '#1f1f1f',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>✅ Auth</h3>
          <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>AuthProvider</p>
        </div>
        
        <div style={{
          backgroundColor: '#1f1f1f',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>✅ Player</h3>
          <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>PlayerProvider</p>
        </div>
        
        <div style={{
          backgroundColor: '#1f1f1f',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>✅ Menu</h3>
          <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>MobileMenuProvider</p>
        </div>
        
        <div style={{
          backgroundColor: '#1f1f1f',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>✅ Helmet</h3>
          <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>HelmetProvider</p>
        </div>
        
        <div style={{
          backgroundColor: '#1f1f1f',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>✅ Error</h3>
          <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>ErrorBoundary</p>
        </div>
      </div>
      
      <div style={{
        backgroundColor: '#1f1f1f',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          Se esta página aparecer, todos os contextos estão funcionando. 
          O problema deve estar nos componentes Layout ou páginas específicas.
        </p>
      </div>
    </div>
  </div>
);

function App() {
  console.log('🔥 App com todos os contextos carregando...');
  
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <PlayerProvider>
            <MobileMenuProvider>
              <Router>
                <Routes>
                  <Route path="*" element={<TestPage />} />
                </Routes>
              </Router>
            </MobileMenuProvider>
          </PlayerProvider>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
