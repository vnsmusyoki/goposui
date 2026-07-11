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
import BusinessCategoriesList from './pages/business/categories/BusinessCategoriesList'
import CreateBusinessCategory from './pages/business/categories/CreateBusinessCategory'
import BusinessSubCategoryList from './pages/business/subcategories/BusinessSubCategoryList'
import CreateSubCategory from './pages/business/subcategories/CreateSubCategory'
import AdminModuleList from './pages/admin/modules/AdminModuleList'
import AdminBusinessesList from './pages/admin/business/AdminBusinessesList'
import AdminBusinessDetails from './pages/admin/business/AdminBusinessDetails'
import BusinessSettings from './pages/business/settings/BusinessSettings'

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
          <Route path="/home" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute requiredRoles="Business" />}>
        <Route element={<AppLayout />} >
          <Route path="/business" element={<Navigate to="/home" replace />} />

          {/* CATEGORIES  */}
          <Route path="/inventory/categories" element={<BusinessCategoriesList />} />
          <Route path="/inventory/categories/create" element={<CreateBusinessCategory />} />

          {/* SUB CATEGORIES */}
          <Route path="/inventory/subcategories" element={<BusinessSubCategoryList />} />
          <Route path="/inventory/subcategories/create" element={<CreateSubCategory />} />

          {/* SETTINGS */}


          {/* BUSINESS SETTINGS */}

          <Route path="/business/settings" element={<BusinessSettings />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute requiredRoles="Admin"/>} >
        <Route element={<AppLayout />} >
            <Route path="/admin/modules-management" element={<AdminModuleList />} />
            <Route path="/business-management/list" element={<AdminBusinessesList />} />
            <Route path="/business-management/details/:id" element={<AdminBusinessDetails />} />
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
