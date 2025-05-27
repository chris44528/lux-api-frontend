import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ToastProvider } from './hooks/use-toast'
import { AuthProvider } from './hooks/useAuth'
import { ThemeProvider } from './contexts/ThemeContext'
import { UIPermissionProvider } from './contexts/UIPermissionContext'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider>
        <UIPermissionProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </UIPermissionProvider>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
)
