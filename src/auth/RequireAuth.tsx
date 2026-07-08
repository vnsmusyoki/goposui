import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from './AuthProvider'

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-text">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4 shadow-xl">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  )
}

type ProtectedRouteProps = {
  requiredRoles?: string | string[]
}

export function ProtectedRoute({ requiredRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const required = Array.isArray(requiredRoles)
    ? requiredRoles
    : requiredRoles
      ? [requiredRoles]
      : []

  if (isLoading) {
    return <FullScreenLoader label="Checking your session..." />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (required.length > 0) {
    const roleCodes = user.roles.map((role) => role.code.toLowerCase())
    const isAllowed = required.some((role) => roleCodes.includes(role.toLowerCase()))

    if (!isAllowed) {
      return <Navigate to={`/dashboard`} replace />
    }
  }

  return <Outlet />
}

export function RequireAuth() {
  return <ProtectedRoute />
}

export function GuestOnlyRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <FullScreenLoader label="Loading login..." />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
