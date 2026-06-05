import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Load game fonts
const link = document.createElement('link')
link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap'
link.rel = 'stylesheet'
document.head.appendChild(link)

// Reset styles
const style = document.createElement('style')
style.textContent = `* { margin: 0; padding: 0; box-sizing: border-box; } body { background: #070a12; }`
document.head.appendChild(style)

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<React.StrictMode><App /></React.StrictMode>)
