import { Link, Outlet } from 'react-router-dom'
import { ArrowLeft, Building2, Clock, CreditCard, Globe, Sparkles, Star, Store, Users } from 'lucide-react'

function AuthLayout() {
  return (
    <div className="min-h-screen bg-background text-text">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden overflow-hidden border-r border-border bg-gradient-to-b from-neutral-950 to-neutral-900 p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-[-5rem] top-20 h-72 w-72 rounded-full bg-primary-700/15 blur-3xl" />
            <div className="absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-info-500/10 blur-3xl" />
          </div>

          <div className="space-y-10">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-700/15 ring-1 ring-inset ring-primary-300/30">
                <Store className="h-6 w-6 text-primary-300" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.25em] text-primary-200 uppercase">
                  POS UI
                </p>
                <p className="text-sm text-neutral-400">Authenticated workspace</p>
              </div>
            </Link>

            <div className="max-w-lg space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-300/20 bg-primary-400/10 px-4 py-1 text-sm text-primary-100">
                <Sparkles className="h-4 w-4" />
                Welcome back to your POS workspace
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-text">
                Access your dashboard, manage inventory, process orders, and grow your business in
                one unified platform.
              </h1>
              <p className="text-base leading-7 text-neutral-400">
                Built for retail teams that need a secure, fast login flow with a focused workspace
                on the other side.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Active Stores', value: '50,000+' },
                { label: 'Transactions', value: '2.4M+' },
                { label: 'Uptime', value: '99.99%' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-2xl font-bold text-text">{stat.value}</div>
                  <div className="mt-1 text-xs text-neutral-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Users, label: 'Staff Login', color: 'from-primary-500 to-info-500' },
                { icon: Building2, label: 'Multi-Location', color: 'from-primary-600 to-primary-400' },
                { icon: CreditCard, label: 'Secure Payments', color: 'from-success-500 to-success-100' },
                { icon: Globe, label: 'Global Access', color: 'from-warning-500 to-danger-500' },
              ].map((action) => (
                <div
                  key={action.label}
                  className="group rounded-xl border border-border bg-surface p-4 transition hover:border-primary/50 hover:bg-surface-alt"
                >
                  <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${action.color} transition group-hover:scale-110`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-sm font-medium text-text">{action.label}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="mb-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-3.5 w-3.5 fill-current text-warning-500" />
                ))}
                <span className="ml-2 text-sm text-neutral-400">(4.9/5)</span>
              </div>
              <div className="space-y-2">
                <p className="italic text-neutral-400">
                  "Processing sales has never been faster. Our team loves the intuitive interface."
                </p>
                <div>
                  <p className="text-sm font-medium text-primary">Sarah Johnson</p>
                  <p className="text-xs text-neutral-400">Store Manager</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 rounded-full ${index === 0 ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-3xl border border-border bg-surface p-5 backdrop-blur">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm text-neutral-400">
                Secure access, faster checkout flow, and a private workspace for your team.
              </span>
            </div>
          </div>
        </aside>

        <section className="relative flex items-center justify-center px-6 py-10 lg:px-10">
          <Link
            to="/"
            className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition hover:text-text lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>

          <div className="w-full max-w-xl">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  )
}

export default AuthLayout
