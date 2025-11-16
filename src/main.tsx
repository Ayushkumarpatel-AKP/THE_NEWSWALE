import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import NewsWale from './NewsWale.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NewsWale />
  </StrictMode>,
)
