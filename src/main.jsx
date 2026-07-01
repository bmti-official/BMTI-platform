import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Kakao SDK 초기화
if (window.Kakao && !window.Kakao.isInitialized()) {
  window.Kakao.init('81f5d019eb6bd236aeb9e763fef136e8');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
