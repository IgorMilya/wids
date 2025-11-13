import { Navigate, Route, Routes } from 'react-router-dom'
import { Blacklist, Dashboard, HomeLayout, Scanner, Whitelist, Login, Logs } from 'pages'
import { ProtectedRoute } from './ProtectedRoute'
import { ROUTES } from './routes.utils'

export const AppRouter = () => {

  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<Login />} />
      {/*<Route path={ROUTES.CREATE_USER} element={<CreateUserPage />} />*/}

      {/* Protected */}
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