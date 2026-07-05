import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import GuestLayout from './layouts/GuestLayout'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import FogotPassword from './pages/auth/fogotpassword'
import Login from './pages/auth/login'
import Register from './pages/auth/register' 
import PosLayout from './layouts/PosLayout'

function App() {
  return (
    <Routes>
      <Route path="/" element={<GuestLayout />}>
        <Route index element={<LandingPage />} />
      </Route>
      <Route path="/" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<FogotPassword />} />
      </Route>
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
      </Route>
       <Route path="/pos" element={<PosLayout />}>
        <Route index element={<Navigate to="pos" replace />} />
        <Route path="pos" element={<PosLayout />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
