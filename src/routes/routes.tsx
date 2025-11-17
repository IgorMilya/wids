import { Navigate, Route, Routes } from 'react-router-dom'
import {
  Blacklist,
  Dashboard,
  HomeLayout,
  Scanner,
  Whitelist,
  Login,
  Registration,
  Logs,
  ResetPassword,
} from 'pages'
import { ProtectedRoute } from './ProtectedRoute'
import { ROUTES } from './routes.utils'

export const AppRouter = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTRATION} element={<Registration />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} />} />
        <Route path={ROUTES.HOME} element={<HomeLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.SCANNER} element={<Scanner />} />
          <Route path={ROUTES.BLACKLIST} element={<Blacklist />} />
          <Route path={ROUTES.WHITELIST} element={<Whitelist />} />
          <Route path={ROUTES.LOGS} element={<Logs />} />
        </Route>
      </Route>
    </Routes>
  )
}
