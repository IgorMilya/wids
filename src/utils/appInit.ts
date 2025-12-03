import { store } from 'store'
import { cookieUtils } from './cookies'

/**
 * Initialize app state on startup
 * - Check for authentication token
 * - No automatic temp user mode - users must click "Login as guest" manually
 */
export const initializeApp = async (): Promise<void> => {
  // Just check for token - no automatic temp user mode
  // Users can manually enable guest mode by clicking "Login as guest" button
  const token = cookieUtils.getToken()
  
  if (token) {
    // User is authenticated, normal flow
    return
  }
  
  // No token - user will be redirected to login/registration by ProtectedRoute
  // They can choose to login as guest from there
}

