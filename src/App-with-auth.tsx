import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import './styles/globals.css';

// Página de teste com contexto de autenticação
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
        🎵 Cânticos CCB - Teste com AuthProvider
      </h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#1f1f1f',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>✅ React Router</h3>
          <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
            Roteamento funcionando
          </p>
        </div>
        
        <div style={{
          backgroundColor: '#1f1f1f',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>✅ AuthProvider</h3>
          <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
            Contexto de autenticação
          </p>
        </div>
        
        <div style={{
          backgroundColor: '#1f1f1f',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>🔄 Testando</h3>
          <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
            Supabase + Auth
          </p>
        </div>
      </div>
      
      <div style={{
        backgroundColor: '#1f1f1f',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          Testando se o AuthProvider (que usa Supabase) está causando problemas.
        </p>
      </div>
    </div>
  </div>
);

function App() {
  console.log('🔥 App com AuthProvider carregando...');
  
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="*" element={<TestPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
