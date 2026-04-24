import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { seedDatabase } from './utils/sampleData.js'
import { AuthProvider } from './context/AuthContext.jsx'

// Start seeding in background (won't block UI)
seedDatabase().catch(err => console.error(err));

// Render immediately
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
