import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { AppRouter } from 'routes'
import { store } from 'store'
import { setTokens, logoutUser } from 'store/reducers/user.slice'
import { initializeApp } from 'utils/appInit'
import './style/index.css'

// Initialize app (check for temp user mode, load cached networks, etc.)
// This runs asynchronously and doesn't block app rendering
// If offline, it will automatically enable guest mode
initializeApp().catch((error) => {
  console.error('App initialization error:', error)
  // Don't block app startup even if initialization fails
  // The app should still be usable in offline mode
})

// Listen for token refresh events and update Redux store
window.addEventListener('tokensRefreshed', ((event: CustomEvent<{ token: string; refresh_token: string }>) => {
  store.dispatch(setTokens({ token: event.detail.token, refresh_token: event.detail.refresh_token }))
}) as EventListener)

// Listen for logout events and update Redux store
window.addEventListener('authLogout', () => {
  store.dispatch(logoutUser())
  window.location.href = '/login'
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <Provider store={store}>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </Provider>,
)