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
import BusinessLocations from './pages/business/settings/location/BusinessLocations'
import CreateBusinessLocation from './pages/business/settings/location/CreateBusinessLocation'
import InvoiceSettings from './pages/business/settings/invoice/InvoiceSettings'
import CreateInvoiceSettings from './pages/business/settings/invoice/CreateInvoiceSettings'
import EditInvoiceSettings from './pages/business/settings/invoice/EditInvoiceSettings'
import Suppliers from './pages/business/contacts/suppliers/Suppliers'
import SupplierProfile from './pages/business/contacts/suppliers/SupplierProfile'
import ProductsList from './pages/business/products/ProductsList'
import CreateProduct from './pages/business/products/CreateProduct'
import ProductUnits from './pages/business/units/ProductUnits'
import CreateProductUnit from './pages/business/units/CreateProductUnit'
import EditBusinessCategory from './pages/business/categories/EditBusinessCategory'
import EditSubCategory from './pages/business/subcategories/EditSubCategory'
import BrandsList from './pages/business/brands/BrandsList'
import WarrantiesList from './pages/business/warranties/WarrantiesList'
import EditProduct from './pages/business/products/EditProduct'
import ProductDetails from './pages/business/products/ProductDetails'
import ProductOpeningStock from './pages/business/products/ProductOpeningStock'

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
          <Route path="/products/categories" element={<BusinessCategoriesList />} />
          <Route path="/products/categories/create" element={<CreateBusinessCategory />} />
          <Route path="/products/categories/:id/edit" element={<EditBusinessCategory />} />

          {/* SUB CATEGORIES */}
          <Route path="/products/sub-categories" element={<BusinessSubCategoryList />} />
          <Route path="/inventory/sub-categories/create" element={<CreateSubCategory />} />
          <Route path="/inventory/sub-categories/:id/edit" element={<EditSubCategory />} />

          {/* UNITS */}
          <Route path="/products/units" element={<ProductUnits />} /> 

          {/* BRANDS */}
          <Route path="/products/brands" element={<BrandsList />} />


          {/* WARRANTIES */}
          <Route path="/products/warranties" element={<WarrantiesList />} />

          {/* SETTINGS */}
          <Route path="/business/settings" element={<BusinessSettings />} />
          <Route path="/business/locations" element={<BusinessLocations />} />
          <Route path="/business/locations/create" element={<CreateBusinessLocation />} />
          <Route path="/business/invoice-settings" element={<InvoiceSettings />} />
          <Route path="/business/invoice-settings/create" element={<CreateInvoiceSettings />} />
          <Route path="/business/invoice-settings/:id/edit" element={<EditInvoiceSettings />} />


          {/* CONTACTS */}
          <Route path="/contacts/suppliers" element={<Suppliers />} />
          <Route path="/contacts/suppliers/:id" element={<SupplierProfile />} />


          {/* PRODUCTS */}
          <Route path="/products/list" element={<ProductsList />} />
          <Route path="/products/create" element={<CreateProduct />} />
          <Route path="/products/:id/edit" element={<EditProduct />} />
          <Route path="/products/:id/view" element={<ProductDetails />} />
          <Route path="/products/:id/opening-stock" element={<ProductOpeningStock />} />
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
