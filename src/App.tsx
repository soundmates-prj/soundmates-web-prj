import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import './index.css'
import { Dashboard } from './pages/Dashboard'
import { FirstTimeSetup, StationSetup, Login, TokenSetup } from './pages/Auth'
import { api } from './services/api'

// Auth Guard Component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const setupCompleted = localStorage.getItem('azuracast_setup_completed')
  const isLoggedIn = localStorage.getItem('azuracast_is_logged_in')
  const hasToken = localStorage.getItem('azuracast_api_token')

  if (setupCompleted !== 'true') {
    const userRegistered = localStorage.getItem('azuracast_user_registered')
    if (userRegistered === 'true') {
      return <Navigate to="/setup/station" replace />
    }
    return <Navigate to="/setup" replace />
  }

  if (isLoggedIn !== 'true') {
    return <Navigate to="/login" replace />
  }

  if (!hasToken) {
    return <Navigate to="/setup/token" replace />
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
      const setupCompleted = localStorage.getItem('azuracast_setup_completed')
      const isLoggedIn = localStorage.getItem('azuracast_is_logged_in')
      const hasToken = localStorage.getItem('azuracast_api_token')

      // If on a valid route, don't redirect
      const currentPath = location.pathname
      const validPaths = ['/setup', '/setup/station', '/setup/token', '/login', '/dashboard', '/stations']

      // Check if current path matches any valid path or starts with /station/
      const isValidPath = validPaths.some(p => currentPath.startsWith(p)) || currentPath.startsWith('/station/')

      if (currentPath !== '/' && isValidPath) {
        setIsLoading(false)
        setInitialCheckDone(true)
        return
      }

      // Redirect based on status
      if (setupCompleted === 'true') {
        if (isLoggedIn === 'true') {
          if (hasToken) {
            navigate('/dashboard', { replace: true })
          } else {
            navigate('/setup/token', { replace: true })
          }
        } else {
          navigate('/login', { replace: true })
        }
      } else {
        const stationCreated = localStorage.getItem('azuracast_station_created')
        if (stationCreated === 'true') {
          navigate('/dashboard', { replace: true })
        } else {
          const userRegistered = localStorage.getItem('azuracast_user_registered')
          if (userRegistered === 'true') {
            navigate('/setup/station', { replace: true })
          } else {
            navigate('/setup', { replace: true })
          }
        }
      }
      setIsLoading(false)
      setInitialCheckDone(true)
    }

    checkSetupStatus()
  }, [navigate, location.pathname, initialCheckDone])

  const handleRegistrationComplete = (email: string, _password: string) => {
    localStorage.setItem('azuracast_user_registered', 'true')
    localStorage.setItem('azuracast_admin_email', email)
    localStorage.setItem('azuracast_is_logged_in', 'true')
    navigate('/setup/station')
  }

  const handleStationComplete = () => {
    localStorage.setItem('azuracast_station_created', 'true')
    localStorage.setItem('azuracast_setup_completed', 'true')
    navigate('/setup/token')
  }

  const handleBackToRegister = () => {
    localStorage.removeItem('azuracast_user_registered')
    navigate('/setup')
  }

  const handleLoginSuccess = () => {
    localStorage.setItem('azuracast_is_logged_in', 'true');
    const hasToken = localStorage.getItem('azuracast_api_token');
    if (hasToken) {
      navigate('/dashboard');
    } else {
      navigate('/setup/token');
    }
  }

  const handleTokenComplete = (token: string) => {
    api.setToken(token);
    navigate('/dashboard');
  }

  const handleTokenSkip = () => {
    navigate('/dashboard');
  }

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch (e) {
      console.error('Logout error:', e)
    }
    localStorage.removeItem('azuracast_is_logged_in')
    api.setToken(null);
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading SoundMates...</p>
      </div>
    )
  }

  return (
    <Routes>
      {/* Setup Routes */}
      <Route path="/setup" element={<FirstTimeSetup onComplete={handleRegistrationComplete} />} />
      <Route path="/setup/station" element={
        <StationSetup onComplete={handleStationComplete} onBack={handleBackToRegister} />
      } />
      <Route path="/setup/token" element={
        <TokenSetup onComplete={handleTokenComplete} onSkip={handleTokenSkip} />
      } />

      {/* Auth Routes */}
      <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />

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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
