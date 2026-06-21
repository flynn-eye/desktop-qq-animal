import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './renderer/App'
import './renderer/styles.css'

console.log('[renderer] starting...')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
