import { Outlet } from 'react-router-dom'

function GuestLayout() {
  return (
    <div className="min-h-screen w-full">
      <Outlet />
    </div>
  )
}

export default GuestLayout
