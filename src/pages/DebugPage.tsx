/**
 * Página de Debug - Ver qual API está sendo usada
 */

import React from 'react';

const DebugPage: React.FC = () => {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE_URL = isLocalhost 
    ? 'http://localhost/1canticosccb/api'
    : (import.meta.env.VITE_API_BASE_URL || 'https://canticosccb.com.br/api');

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Debug - API Configuration</h1>
      
      <h2>Ambiente:</h2>
      <ul>
        <li><strong>Hostname:</strong> {window.location.hostname}</li>
        <li><strong>Port:</strong> {window.location.port}</li>
        <li><strong>Is Localhost:</strong> {isLocalhost ? '✅ SIM' : '❌ NÃO'}</li>
      </ul>

      <h2>Configuração da API:</h2>
      <ul>
        <li><strong>API_BASE_URL:</strong> <code>{API_BASE_URL}</code></li>
        <li><strong>VITE_API_BASE_URL:</strong> <code>{import.meta.env.VITE_API_BASE_URL || '(não definido)'}</code></li>
      </ul>

      <h2>Teste de Login:</h2>
      <button 
        onClick={async () => {
          const url = `${API_BASE_URL}/auth/login`;
          alert(`Tentando acessar: ${url}`);
          
          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: 'admin@canticosccb.com.br',
                senha: 'admin123'
              })
            });
            const data = await response.json();
            alert(`Sucesso! Token: ${data.token?.substring(0, 20)}...`);
          } catch (error: any) {
            alert(`Erro: ${error.message}`);
          }
        }}
        style={{
          padding: '10px 20px',
          background: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        🧪 Testar Login
      </button>
    </div>
  );
};

export default DebugPage;
