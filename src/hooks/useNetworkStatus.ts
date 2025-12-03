import { useState, useEffect } from 'react'

interface NetworkStatus {
  isOnline: boolean
  isOffline: boolean
  isServerReachable: boolean
}

/**
 * Hook to monitor network status and server connectivity
 * Uses navigator.onLine API and attempts a lightweight API ping
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isServerReachable, setIsServerReachable] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => {
      setIsOnline(false)
      setIsServerReachable(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check server reachability when online
    const checkServerReachability = async () => {
      if (navigator.onLine) {
        try {
          const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
          // Try to ping the API base URL with a lightweight request
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
          
          // Try HEAD request first (lightweight)
          try {
            const response = await fetch(`${apiUrl}`, {
              method: 'HEAD',
              signal: controller.signal,
              cache: 'no-cache',
            })
            
            clearTimeout(timeoutId)
            setIsServerReachable(response.ok || response.status < 500) // Accept any non-server-error response
          } catch (headError) {
            // If HEAD fails, try OPTIONS (CORS preflight)
            clearTimeout(timeoutId)
            const optionsController = new AbortController()
            const optionsTimeoutId = setTimeout(() => optionsController.abort(), 3000)
            
            try {
              await fetch(`${apiUrl}`, {
                method: 'OPTIONS',
                signal: optionsController.signal,
                cache: 'no-cache',
              })
              clearTimeout(optionsTimeoutId)
              setIsServerReachable(true)
            } catch {
              clearTimeout(optionsTimeoutId)
              setIsServerReachable(false)
            }
          }
        } catch (error) {
          setIsServerReachable(false)
        }
      } else {
        setIsServerReachable(false)
      }
    }

    // Initial check
    checkServerReachability()

    // Periodic check every 10 seconds when online
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        checkServerReachability()
      }
    }, 10000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(intervalId)
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
    isServerReachable: isOnline && isServerReachable,
  }
}

