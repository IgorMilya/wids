import { store } from 'store'
import { cookieUtils } from './cookies'
import { enableGuestMode } from './guestMode'

/**
 * Check if device is offline (synchronously)
 * Uses navigator.onLine which is reliable for detecting network connectivity
 */
const isOffline = (): boolean => {
  return !navigator.onLine
}

/**
 * Initialize app state on startup
 * - Check for authentication token
 * - If offline and no token, automatically enable guest mode for offline usage
 * - If online but no token, redirect to login/registration
 */
export const initializeApp = async (): Promise<void> => {
  const token = cookieUtils.getToken()
  
  if (token) {
    // User is authenticated, normal flow
    return
  }
  
  // No token - check if we're offline
  // If offline, automatically enable guest mode so users can scan networks
  // This is especially important for Tauri desktop app when deployed
  if (isOffline()) {
    console.log('Device is offline - automatically enabling guest mode')
    try {
      await enableGuestMode()
      console.log('Guest mode enabled automatically due to offline status')
    } catch (error) {
      console.error('Failed to enable guest mode on offline detection:', error)
      // Continue anyway - guest mode might still work partially
    }
    return
  }
  
  // Online but no token - user will be redirected to login/registration by ProtectedRoute
  // They can choose to login as guest from there if needed
}

