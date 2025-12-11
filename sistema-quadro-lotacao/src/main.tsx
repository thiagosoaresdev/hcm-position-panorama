import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setupAxiosDefaults } from './core/auth'
import './index.css'
import App from './App.tsx'

// Setup axios defaults for authentication
setupAxiosDefaults();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
