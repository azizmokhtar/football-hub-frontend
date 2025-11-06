import { AppRouter } from '@/router'
import { useAuthInit } from '@/hooks/useAuthInit'

function App() {
  // Custom hook to initialize auth state from localStorage
  // and fetch user profile if a token exists
  const { isInitialized } = useAuthInit()

  // Show a global loader while we check auth
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return <AppRouter />
}

export default App