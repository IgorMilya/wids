import React, { FC } from 'react'
import { LinkItemType } from 'types'
import { NavLink, useLocation } from 'react-router-dom'

interface NavbarProps {
  data: LinkItemType
  disabled?: boolean
}

const NavItem: FC<NavbarProps> = ({ data, disabled = false }) => {
  const { icon, title, link } = data
  const { pathname } = useLocation()

  const isActive = pathname === link

  if (disabled) {
    return (
      <div
        className="block text-xs small-laptop:text-sm normal-laptop:text-[14px] p-3 small-laptop:p-[12px] normal-laptop:p-[15px] font-medium transition cursor-not-allowed opacity-50 text-gray-500"
        title="Login required to access this feature"
      >
        <div className="flex items-center">
          {!!icon && <span className="mr-2 flex-shrink-0">{icon}</span>}
          <span className="truncate">{title}</span>
        </div>
      </div>
    )
  }

  return (
    <NavLink
      to={link}
      className={`block text-xs small-laptop:text-sm normal-laptop:text-[14px] p-3 small-laptop:p-[12px] normal-laptop:p-[15px] font-medium transition ${
          isActive
            ? 'bg-[rgba(255,255,255,0.1)] text-white border-l-[4px] border-[#3e3caa]'
            : 'text-gray-300 hover:bg-[rgba(255,255,255,0.1)] hover:text-white'
        }`}
    >
      <div className="flex items-center">
        {!!icon && <span className="mr-2 flex-shrink-0">{icon}</span>}
        <span className="truncate">{title}</span>
      </div>
    </NavLink>
  )
}

export default NavItem
