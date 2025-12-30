import { useState, useEffect } from 'react'
import './index.css'
import { Dashboard } from './pages/Dashboard'
import { FirstTimeSetup } from './pages/Auth'

function App() {
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if this is the first time running the app
    const setupCompleted = localStorage.getItem('azuracast_setup_completed')
    setIsFirstRun(!setupCompleted)
    setIsLoading(false)
  }, [])

  const handleSetupComplete = (email: string, _password: string) => {
    // Store that setup has been completed
    localStorage.setItem('azuracast_setup_completed', 'true')
    localStorage.setItem('azuracast_admin_email', email)
    setIsFirstRun(false)
  }

  // Show loading while checking setup status
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  // Show first-time setup if not completed
  if (isFirstRun) {
    return <FirstTimeSetup onComplete={handleSetupComplete} />
  }

  // Show main dashboard
  return <Dashboard />
}

export default App
