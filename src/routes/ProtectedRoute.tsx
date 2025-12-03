import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FC } from 'react'
import { useSelector } from 'react-redux'
import { ROUTES } from './routes.utils'
import { cookieUtils } from '../utils/cookies'
import { RootState } from 'store'

export const ProtectedRoute: FC = () => {
  const token = cookieUtils.getToken()
  const isTempUser = useSelector((state: RootState) => state.user.isTempUser)
  const location = useLocation()
  
  // Allow temp users to access Scanner only
  if (isTempUser) {
    if (location.pathname === ROUTES.SCANNER) {
      return <Outlet />
    }
    // Redirect temp users from other pages to Scanner
    return <Navigate to={ROUTES.SCANNER} replace />
  }
  
  // Normal authentication check
  return token ? <Outlet /> : <Navigate to={ROUTES.REGISTRATION} />
}