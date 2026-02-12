import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App.tsx'
import './styles/globals.css'

// Build v2.0.0 - Launch
console.log('🚀 React carregando...')

const root = document.getElementById('root')
console.log('🎯 Root element:', root)

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Router>
        <App />
      </Router>
    </React.StrictMode>,
  )
  console.log('✅ React renderizado!')
} else {
  console.error('❌ Root element não encontrado!')
}
