import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Service Worker disabled for stability during development
// If you want to re-enable PWA features, register 'sw.js' here.

createRoot(document.getElementById('root')).render(
  <App />
)
