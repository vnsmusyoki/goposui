import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import GuestLayout from './layouts/GuestLayout'
import LandingPage from './pages/LandingPage'
import FogotPassword from './pages/auth/fogotpassword'
import Login from './pages/auth/login'
import Register from './pages/auth/register'
import PosLayout from './layouts/PosLayout'
import { GuestOnlyRoute, ProtectedRoute } from './auth/RequireAuth'
import Dashboard from './pages/Dashboard'
import BusinessDashboard from './pages/business/BusinessDashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<GuestLayout />}>
        <Route index element={<LandingPage />} />
      </Route>
      <Route element={<GuestOnlyRoute />}>
        <Route path="/" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<FogotPassword />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute requiredRoles="Business" />}>
        <Route element={<AppLayout />} >
          <Route path="/business" element={<Navigate to="/dashboard" replace />} />
          <Route path="/business/*" element={<BusinessDashboard />} />
        </Route>
      </Route>
      
      <Route element={<ProtectedRoute />}>
        <Route path="/pos" element={<PosLayout />}>
          <Route index element={<Navigate to="pos" replace />} />
          <Route path="pos" element={<PosLayout />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
