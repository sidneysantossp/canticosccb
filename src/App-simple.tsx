import React from 'react';
import './styles/globals.css';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'Montserrat, system-ui, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: '#1f1f1f',
        borderRadius: '12px',
        border: '1px solid #333',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#1db954', marginBottom: '1rem', fontSize: '2rem' }}>
          🎵 Cânticos CCB
        </h1>
        <p style={{ marginBottom: '1rem', color: '#b3b3b3' }}>
          Aplicação funcionando com CSS inline!
        </p>
        <div style={{
          backgroundColor: '#1db954',
          color: '#000',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          ✅ React Carregado
        </div>
        <p style={{ fontSize: '0.9rem', color: '#888' }}>
          Se você consegue ver esta página, o problema era com as rotas ou componentes complexos.
        </p>
      </div>
    </div>
  );
}

export default App;
