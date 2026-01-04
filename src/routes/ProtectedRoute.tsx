import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FC } from 'react'
import { useSelector } from 'react-redux'
import { ROUTES } from './routes.utils'
import { cookieUtils } from 'utils'
import { RootState } from 'store'

export const ProtectedRoute: FC = () => {
  const token = cookieUtils.getToken()
  const isTempUser = useSelector((state: RootState) => state.user.isTempUser)
  const location = useLocation()
  
  if (isTempUser) {
    if (location.pathname === ROUTES.SCANNER) {
      return <Outlet />
    }
    return <Navigate to={ROUTES.SCANNER} replace />
  }
  
  return token ? <Outlet /> : <Navigate to={ROUTES.REGISTRATION} />
}