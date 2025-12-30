import { useState, useEffect } from 'react'
import './index.css'
import { Dashboard } from './pages/Dashboard'
import { FirstTimeSetup, StationSetup, Login, TokenSetup } from './pages/Auth'
import { api } from './services/api'

type SetupStep = 'register' | 'station' | 'settings' | 'complete' | 'login' | 'token';

function App() {
  const [currentStep, setCurrentStep] = useState<SetupStep | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check setup status
    const checkSetupStatus = () => {
      const setupCompleted = localStorage.getItem('azuracast_setup_completed')

      if (setupCompleted === 'true') {
        const isLoggedIn = localStorage.getItem('azuracast_is_logged_in')
        if (isLoggedIn === 'true') {
          // If logged in, check if we have API Token (for better stability)
          const hasToken = localStorage.getItem('azuracast_api_token')
          if (hasToken) {
            setCurrentStep('complete')
          } else {
            setCurrentStep('token')
          }
        } else {
          setCurrentStep('login')
        }
      } else {
        const stationCreated = localStorage.getItem('azuracast_station_created')
        if (stationCreated === 'true') {
          setCurrentStep('complete')
        } else {
          const userRegistered = localStorage.getItem('azuracast_user_registered')
          if (userRegistered === 'true') {
            setCurrentStep('station')
          } else {
            setCurrentStep('register')
          }
        }
      }
      setIsLoading(false)
    }

    checkSetupStatus()
  }, [])

  const handleRegistrationComplete = (email: string, _password: string) => {
    localStorage.setItem('azuracast_user_registered', 'true')
    localStorage.setItem('azuracast_admin_email', email)
    localStorage.setItem('azuracast_is_logged_in', 'true')
    setCurrentStep('station')
  }

  const handleStationComplete = () => {
    localStorage.setItem('azuracast_station_created', 'true')
    localStorage.setItem('azuracast_setup_completed', 'true')
    setCurrentStep('token') // Ask for token after station setup (or complete directly?)
    // Actually better to complete, token is optional enhancement or specifically requested?
    // User requested "show a page to assign token". 
    // Let's show it.
  }

  const handleBackToRegister = () => {
    localStorage.removeItem('azuracast_user_registered')
    setCurrentStep('register')
  }

  const handleLoginSuccess = () => {
    localStorage.setItem('azuracast_is_logged_in', 'true');
    const hasToken = localStorage.getItem('azuracast_api_token');
    if (hasToken) {
      setCurrentStep('complete');
    } else {
      setCurrentStep('token');
    }
  }

  const handleTokenComplete = (token: string) => {
    // api.setToken(token) is handled in component before calling this, or we rely on localStorage
    // But let's make sure
    api.setToken(token);
    setCurrentStep('complete');
  }

  const handleTokenSkip = () => {
    setCurrentStep('complete');
  }

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch (e) {
      console.error('Logout error:', e)
    }
    localStorage.removeItem('azuracast_is_logged_in')
    // We retain the token? Security-wise better to remove.
    // api.setToken(null); 
    // Let's keep it simple: Logout clears session. Token might persist or not.
    // If we clear token, user has to re-enter.
    // Let's clear it for security.
    api.setToken(null);
    setCurrentStep('login')
  }

  if (isLoading || currentStep === null) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading SoundMates...</p>
      </div>
    )
  }

  if (currentStep === 'register') {
    return <FirstTimeSetup onComplete={handleRegistrationComplete} />
  }

  if (currentStep === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  if (currentStep === 'station') {
    return (
      <StationSetup
        onComplete={handleStationComplete}
        onBack={handleBackToRegister}
      />
    )
  }

  if (currentStep === 'token') {
    return <TokenSetup onComplete={handleTokenComplete} onSkip={handleTokenSkip} />
  }

  return <Dashboard onLogout={handleLogout} />
}

export default App
