import { Shield, Store, UserRound } from 'lucide-react'
import { useMemo } from 'react'
import { useAuthStore } from '../auth/authStore'
import AdminDashboard from './admin/AdminDashboard'
import BusinessDashboard from './business/BusinessDashboard'

function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const primaryRole = useAuthStore((state) => state.primaryRole)

  const workspaceRole = useMemo(() => {
    const roleCode = primaryRole ?? user?.roles?.[0]?.code?.toLowerCase().trim()

    if (roleCode === 'admin' || !roleCode) {
      return 'admin'
    }

    if (roleCode === 'business') {
      return 'business'
    }

    return roleCode
  }, [primaryRole, user])

  if (workspaceRole === 'admin') {
    return <AdminDashboard />
  }

  if (workspaceRole === 'business') {
    return <BusinessDashboard />
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-6 py-12">
      <div className="w-full rounded-[2rem] border border-border bg-surface p-8 shadow-2xl shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <UserRound className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Dashboard</p>
            <h1 className="text-2xl font-semibold text-text">No dashboard template for this role yet</h1>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-background p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-surface-alt p-3 text-muted">
              {workspaceRole === 'business' ? <Store className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm text-muted">Logged in as</p>
              <p className="text-lg font-semibold text-text">
                {user?.fullName ?? 'Unknown user'}
              </p>
              <p className="text-sm text-muted">
                Role: {workspaceRole}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
