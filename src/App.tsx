import { useState, useEffect } from 'react'
import './index.css'
import { Dashboard } from './pages/Dashboard'
import { FirstTimeSetup, StationSetup } from './pages/Auth'

type SetupStep = 'register' | 'station' | 'settings' | 'complete';

function App() {
  const [currentStep, setCurrentStep] = useState<SetupStep | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check setup status
    const checkSetupStatus = () => {
      const setupCompleted = localStorage.getItem('azuracast_setup_completed')
      const stationCreated = localStorage.getItem('azuracast_station_created')

      if (setupCompleted === 'true') {
        setCurrentStep('complete')
      } else if (stationCreated === 'true') {
        // Station created, skip to settings (or complete for now)
        setCurrentStep('complete')
      } else {
        // Check if user registered
        const userRegistered = localStorage.getItem('azuracast_user_registered')
        if (userRegistered === 'true') {
          setCurrentStep('station')
        } else {
          setCurrentStep('register')
        }
      }
      setIsLoading(false)
    }

    checkSetupStatus()
  }, [])

  const handleRegistrationComplete = (email: string, _password: string) => {
    // Store that registration has been completed
    localStorage.setItem('azuracast_user_registered', 'true')
    localStorage.setItem('azuracast_admin_email', email)
    // Move to station setup
    setCurrentStep('station')
  }

  const handleStationComplete = () => {
    // Store that station has been created
    localStorage.setItem('azuracast_station_created', 'true')
    localStorage.setItem('azuracast_setup_completed', 'true')
    // Move to dashboard
    setCurrentStep('complete')
  }

  const handleBackToRegister = () => {
    // Clear registration and go back
    localStorage.removeItem('azuracast_user_registered')
    setCurrentStep('register')
  }

  // Show loading while checking setup status
  if (isLoading || currentStep === null) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading SoundMates...</p>
      </div>
    )
  }

  // Show first-time setup (Step 1: Register)
  if (currentStep === 'register') {
    return <FirstTimeSetup onComplete={handleRegistrationComplete} />
  }

  // Show station setup (Step 2: Create Station)
  if (currentStep === 'station') {
    return (
      <StationSetup
        onComplete={handleStationComplete}
        onBack={handleBackToRegister}
      />
    )
  }

  // Show main dashboard (Setup complete)
  return <Dashboard />
}

export default App
