import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/globals.css';

// Página simples de teste
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
        🎵 Cânticos CCB - Teste Intermediário
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
          <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>✅ CSS Global</h3>
          <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
            Estilos aplicados
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
            Componentes complexos
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
          Se esta página aparecer corretamente, vou adicionar os contextos e componentes um por vez.
        </p>
      </div>
    </div>
  </div>
);

function App() {
  console.log('🔥 App intermediário carregando...');
  
  return (
    <Router>
      <Routes>
        <Route path="*" element={<TestPage />} />
      </Routes>
    </Router>
  );
}

export default App;
