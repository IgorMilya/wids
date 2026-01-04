import { Outlet } from 'react-router-dom'
import { Navbar } from 'UI'
import { Tour } from 'components'
import { navLink } from './homeLayout.utils'

const HomeLayout = ()=> {
  return (
    <div className="bg-primary h-screen overflow-hidden">
      <Tour />
      <div className="flex h-full">
        <Navbar data={navLink} />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default HomeLayout
