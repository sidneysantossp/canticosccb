import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/layout/Layout';
import './styles/globals.css';

// Página de teste simples
const TestPage = () => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: '#121212',
    color: '#ffffff',
    padding: '2rem',
    fontFamily: 'Montserrat, system-ui, sans-serif'
  }}>
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#1db954', marginBottom: '2rem' }}>
        🎵 Teste com Layout
      </h1>
      
      <div style={{
        backgroundColor: '#1f1f1f',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #333',
        marginBottom: '1rem'
      }}>
        <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>✅ Layout Carregado</h3>
        <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
          Se você consegue ver esta página, o Layout está funcionando.
          O problema deve estar em páginas específicas como HomePage, AdminUsers, etc.
        </p>
      </div>
      
      <div style={{
        backgroundColor: '#1f1f1f',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <p style={{ color: '#888', fontSize: '0.8rem' }}>
          Próximo passo: testar páginas específicas que estavam com tela preta.
        </p>
      </div>
    </div>
  </div>
);

function App() {
  console.log('🔥 App com Layout carregando...');
  
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <PlayerProvider>
            <MobileMenuProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<TestPage />} />
                  </Route>
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
