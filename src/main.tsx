import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App.tsx'
import './styles/globals.css'
import { installChunkLoadRecovery } from './utils/chunkLoadRecovery'

installChunkLoadRecovery()

const root = document.getElementById('root')

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </Router>
    </React.StrictMode>,
  )
} else {
  console.error('❌ Root element não encontrado!')
}
