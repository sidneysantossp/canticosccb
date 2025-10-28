import React from 'react';

export default function TestPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#121212',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✅ FUNCIONOU!</h1>
        <p style={{ fontSize: '24px', color: '#10b981' }}>
          O Vite está rodando corretamente!
        </p>
        <p style={{ fontSize: '16px', color: '#888', marginTop: '20px' }}>
          Servidor: http://localhost:5175/
        </p>
        <p style={{ fontSize: '16px', color: '#888' }}>
          Timestamp: {new Date().toLocaleString()}
        </p>
        <div style={{ marginTop: '40px' }}>
          <a href="/login" style={{ color: '#10b981', marginRight: '20px' }}>Login</a>
          <a href="/register" style={{ color: '#10b981' }}>Cadastro</a>
        </div>
      </div>
    </div>
  );
}
