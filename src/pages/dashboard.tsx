import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, LayoutDashboard, Shield, Store, Sparkles } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { getWorkspaceLabel, getWorkspaceSlug } from '../auth/workspace'

const workspaceIcons: Record<string, typeof LayoutDashboard> = {
  admin: Shield,
  business: Store,
}

function DashboardPage() {
  const { user } = useAuth()
  const params = useParams<{ workspace?: string }>()
  const workspace = params.workspace?.toLowerCase().trim() || getWorkspaceSlug(user)
  const userWorkspace = getWorkspaceSlug(user)

  if (!params.workspace) {
    return <Navigate to={`/${userWorkspace}/dashboard`} replace />
  }

  if (workspace !== userWorkspace) {
    return <Navigate to={`/${userWorkspace}/dashboard`} replace />
  }

  const dashboardLabel = getWorkspaceLabel(user)
  const Icon = workspaceIcons[workspace] ?? LayoutDashboard
  const modules = user?.modules ?? []
  const highlightedModules = modules.slice(0, 6)

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface to-surface-alt p-8 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              {dashboardLabel}
            </p>
            <h1 className="mt-3 text-3xl font-bold text-text">
              Welcome back, {user?.fullName ?? 'there'}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              Your sidebar and quick links now come from the database. This dashboard follows the
              logged-in user&apos;s workspace, and it will grow with new workspaces as we add them.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon size={22} />
            </div>
            <div>
              <div className="text-sm font-medium text-text">Active workspace</div>
              <div className="text-xs text-muted">{workspace}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {highlightedModules.map((module) => (
          <Link
            key={module.id}
            to={module.path}
            className="group rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LayoutDashboard size={20} />
              </div>
              <ArrowRight className="text-muted transition-transform group-hover:translate-x-1" size={18} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-text">{module.name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {module.description || 'Open this section to continue.'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="rounded-full border border-border px-2.5 py-1">
                {module.children?.length ?? 0} submodules
              </span>
              <span className="rounded-full border border-border px-2.5 py-1">
                {module.path}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {modules.length > highlightedModules.length && (
        <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
          {modules.length - highlightedModules.length} more modules are available in your sidebar.
        </div>
      )}

      {!modules.length && (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-muted">
          No modules are assigned yet. Once the database assignments are populated, the sidebar
          and dashboard shortcuts will appear here automatically.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          to={`/${workspace}/dashboard`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-white shadow-sm transition-colors hover:opacity-90"
        >
          <Sparkles size={18} />
          Stay on dashboard
        </Link>
      </div>
    </section>
  )
}

export default DashboardPage
