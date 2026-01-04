import { FC } from 'react'
import { LinkItemType } from 'types'
import { NavItem } from './nav-item'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'store/store'
import { logoutUser } from 'store/reducers/user.slice'
import { useLocation, NavLink, useNavigate } from 'react-router-dom'
import { ROUTES } from 'routes/routes.utils'
import { useLogoutMutation } from 'store/api'
import { Button } from 'UI'

interface NavbarProps {
  data: LinkItemType[]
}

const Navbar: FC<NavbarProps> = ({ data }) => {
  const user = useSelector((state: RootState) => state.user.user)
  const isTempUser = useSelector((state: RootState) => state.user.isTempUser)
  const refresh_token = useSelector((state: RootState) => state.user.refresh_token)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isProfileActive = pathname === ROUTES.PROFILE
  const [logout] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logout({ refresh_token: refresh_token || undefined }).unwrap()
    } catch (error) {
      console.error('Failed to revoke refresh token on server:', error)
    } finally {
      dispatch(logoutUser())
      navigate(ROUTES.LOGIN)
    }
  }

  const disabledRoutes = isTempUser 
    ? [ROUTES.BLACKLIST, ROUTES.WHITELIST, ROUTES.LOGS, ROUTES.ANALYTICS]
    : []

  return (
    <nav className="bg-secondary h-screen w-[25%] small-laptop:w-[22%] normal-laptop:w-[20%] large-laptop:w-[18%] wide-screen:w-[16%] flex flex-col">
      <div className="flex-1">
        {data.map((item) => (
          <NavItem 
            key={item.link} 
            data={item} 
            disabled={disabledRoutes.includes(item.link)}
          />
        ))}
      </div>
      {isTempUser ? (
        <>
          <Button
            onClick={() => navigate(ROUTES.LOGIN)}
            variant="outline"
            className="!block !w-full !text-left !text-xs small-laptop:!text-sm normal-laptop:!text-[14px] !p-3 small-laptop:!p-[12px] normal-laptop:!p-[15px] !font-medium !transition !border-t !border-gray-700 !text-gray-300 hover:!bg-[rgba(255,255,255,0.1)] hover:!text-white !bg-transparent !justify-start !gap-2 !normal-laptop:w-full !large-laptop:w-full !wide-screen:w-full !small-laptop:w-full"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            <span>Login</span>
          </Button>
          <Button
            onClick={() => navigate(ROUTES.REGISTRATION)}
            variant="outline"
            className="!block !w-full !text-left !text-xs small-laptop:!text-sm normal-laptop:!text-[14px] !p-3 small-laptop:!p-[12px] normal-laptop:!p-[15px] !font-medium !transition !border-t !border-gray-700 !text-gray-300 hover:!bg-[rgba(255,255,255,0.1)] hover:!text-white !bg-transparent !justify-start !gap-2 !normal-laptop:w-full !large-laptop:w-full !wide-screen:w-full !small-laptop:w-full"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            <span>Register</span>
          </Button>
        </>
      ) : (
        <>
          <NavLink
            to={ROUTES.PROFILE}
            className={`block text-xs small-laptop:text-sm normal-laptop:text-[14px] p-3 small-laptop:p-[12px] normal-laptop:p-[15px] font-medium transition border-t border-gray-700 ${
              isProfileActive
                ? 'bg-[rgba(255,255,255,0.1)] text-white border-l-[4px] border-[#3e3caa]'
                : 'text-gray-300 hover:bg-[rgba(255,255,255,0.1)] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 small-laptop:w-[18px] small-laptop:h-[18px] normal-laptop:w-5 normal-laptop:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="truncate">{user?.username || 'Profile'}</span>
            </div>
          </NavLink>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="!block !w-full !text-left !text-xs small-laptop:!text-sm normal-laptop:!text-[14px] !p-3 small-laptop:!p-[12px] normal-laptop:!p-[15px] !font-medium !transition !border-t !border-gray-700 !text-gray-300 hover:!bg-[rgba(255,255,255,0.1)] hover:!text-white !bg-transparent !justify-start !gap-2 !normal-laptop:w-full !large-laptop:w-full !wide-screen:w-full !small-laptop:w-full"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </Button>
        </>
      )}
    </nav>
  )
}

export default Navbar
