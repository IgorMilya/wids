import { FC } from 'react'
import { LinkItemType } from 'types'
import { NavItem } from './nav-item'
import { useSelector } from 'react-redux'
import { RootState } from 'store/store'
import { useLocation, NavLink } from 'react-router-dom'
import { ROUTES } from 'routes/routes.utils'

interface NavbarProps {
  data: LinkItemType[]
}

const Navbar: FC<NavbarProps> = ({ data }) => {
  const user = useSelector((state: RootState) => state.user.user)
  const { pathname } = useLocation()
  const isProfileActive = pathname === ROUTES.PROFILE

  return (
    <nav className="bg-secondary h-screen w-[20%] flex flex-col">
      <div className="flex-1">
        {data.map((item) => <NavItem key={item.link} data={item} />)}
      </div>
      <NavLink
        to={ROUTES.PROFILE}
        className={`block text-[14px] p-[15px] font-medium transition border-t border-gray-700 ${
          isProfileActive
            ? 'bg-[rgba(255,255,255,0.1)] text-white border-l-[4px] border-[#3e3caa]'
            : 'text-gray-300 hover:bg-[rgba(255,255,255,0.1)] hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2">
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span>{user?.username || 'Profile'}</span>
        </div>
      </NavLink>
    </nav>
  )
}

export default Navbar
