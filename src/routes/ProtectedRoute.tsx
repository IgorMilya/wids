import { Navigate, Outlet } from 'react-router-dom'
import { FC } from 'react'
import { ROUTES } from './routes.utils'

export const ProtectedRoute: FC = () => {
  const token = localStorage.getItem('token')
  return token ? <Outlet /> : <Navigate to={ROUTES.REGISTRATION} />
}