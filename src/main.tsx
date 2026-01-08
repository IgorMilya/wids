import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { AppRouter } from 'routes'
import { store } from 'store'
import { setTokens, logoutUser } from 'store/reducers/user.slice'
import { api } from 'store/api'
import './style/index.css'



window.addEventListener('tokensRefreshed', ((event: CustomEvent<{ token: string; refresh_token: string }>) => {
  store.dispatch(setTokens({ token: event.detail.token, refresh_token: event.detail.refresh_token }))
}) as EventListener)

window.addEventListener('authLogout', () => {
  // Reset RTK Query cache to clear all cached data
  store.dispatch(api.util.resetApiState())
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