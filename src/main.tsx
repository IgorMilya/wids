import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { AppRouter } from 'routes'
import { store } from 'store'
import { setTokens, logoutUser } from 'store/reducers/user.slice'
import './style/index.css'

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