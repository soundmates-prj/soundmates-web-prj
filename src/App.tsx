import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import './index.css'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Auth'
import { Home } from './pages/Home'
import { api } from './services/api'

// Auth Guard Component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const isLoggedIn = localStorage.getItem('azuracast_is_logged_in')

  if (isLoggedIn !== 'true') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// App Content with routing logic
function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  useEffect(() => {
    // Only redirect on initial load if at root
    if (initialCheckDone) return;

    const checkSetupStatus = () => {
      const isLoggedIn = localStorage.getItem('azuracast_is_logged_in')

      // If on a valid route, don't redirect
      const currentPath = location.pathname
      const validPaths = ['/login', '/home', '/dashboard', '/stations', '/register', '/forgot-password']

      // Check if current path matches any valid path or starts with /station/
      const isValidPath = validPaths.some(p => currentPath.startsWith(p)) || currentPath.startsWith('/station/')

      if (currentPath !== '/' && isValidPath) {
        setIsLoading(false)
        setInitialCheckDone(true)
        return
      }

      // Redirect default to home (public)
      navigate('/home', { replace: true })
      setIsLoading(false)
      setInitialCheckDone(true)
    }

    checkSetupStatus()
  }, [navigate, location.pathname, initialCheckDone])

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch (e) {
      console.error('Logout error:', e)
    }
    localStorage.clear()
    api.setToken(null)
    navigate('/login')
  }

  if (isLoading) {
    return null
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />

      {/* Home Route (public) */}
      <Route path="/home" element={<Home />} />

      {/* Dashboard Routes */}
      <Route path="/dashboard" element={
        <AuthGuard>
          <Dashboard onLogout={handleLogout} />
        </AuthGuard>
      } />
      <Route path="/dashboard/:section" element={
        <AuthGuard>
          <Dashboard onLogout={handleLogout} />
        </AuthGuard>
      } />

      {/* Station Management Routes */}
      <Route path="/station/:stationId" element={
        <AuthGuard>
          <Dashboard onLogout={handleLogout} />
        </AuthGuard>
      } />
      <Route path="/station/:stationId/:page" element={
        <AuthGuard>
          <Dashboard onLogout={handleLogout} />
        </AuthGuard>
      } />
      <Route path="/station/:stationId/:page/:subpage" element={
        <AuthGuard>
          <Dashboard onLogout={handleLogout} />
        </AuthGuard>
      } />

      {/* Stations List */}
      <Route path="/stations" element={
        <AuthGuard>
          <Dashboard onLogout={handleLogout} />
        </AuthGuard>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
