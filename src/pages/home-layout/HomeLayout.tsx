import { Outlet } from 'react-router-dom'
import { Navbar } from 'UI'
import { navLink } from './homeLayout.utils'

const HomeLayout = ()=> {

  return (
    <div className="bg-primary h-screen">
      <div className="flex">
      <Navbar data={navLink} />
      <Outlet />
      </div>
    </div>
  )
}

export default HomeLayout
