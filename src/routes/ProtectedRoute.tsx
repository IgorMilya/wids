import { Navigate, Outlet } from 'react-router-dom'
import { FC } from 'react'
import { ROUTES } from './routes.utils'
import { cookieUtils } from '../utils/cookies'

export const ProtectedRoute: FC = () => {
  const token = cookieUtils.getToken()
  return token ? <Outlet /> : <Navigate to={ROUTES.REGISTRATION} />
}