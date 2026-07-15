import { Link, Outlet } from 'react-router-dom'
import { ArrowLeft, Building2, Clock, CreditCard, Globe, Sparkles, Star, Store, Users } from 'lucide-react'

function AuthLayout() {
  return (
    <div className="min-h-screen bg-background text-text">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden overflow-hidden border-r border-border bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-[-5rem] top-20 h-72 w-72 rounded-full bg-primary-700/15 blur-3xl" />
            <div className="absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-info-500/10 blur-3xl" />
          </div>

          <div className="space-y-10 text-white">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 ring-1 ring-inset ring-primary/30">
                <Store className="h-6 w-6 text-primary-200" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.25em] text-primary-200 uppercase">
                  POS UI
                </p>
                <p className="text-sm text-slate-300">Authenticated workspace</p>
              </div>
            </Link>

            <div className="max-w-md space-y-5">
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-400">
                Retail operations
              </p>
              <h1 className="font-serif text-5xl font-bold leading-tight text-white">
                One place for sales, stock, and supplier workflows.
              </h1>
              <p className="text-base leading-7 text-slate-300">
                Keep purchasing, returns, inventory, and reporting in one calm workspace built for busy counters.
              </p>
            </div>

            <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { icon: CreditCard, title: 'Fast checkout', text: 'Move from cart to payment without extra clicks.' },
                { icon: Building2, title: 'Supplier tracking', text: 'Manage supplier records and purchase flows together.' },
                { icon: Clock, title: 'Real-time updates', text: 'See inventory and history stay in sync as you work.' },
                { icon: Globe, title: 'Multi-location ready', text: 'Keep branches, stock, and settings aligned.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-primary-200" />
                  <h2 className="mt-3 text-sm font-semibold text-white">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 text-slate-300">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-primary-200" />
              <div>
                <p className="text-sm font-medium text-white">Designed for everyday work</p>
                <p className="text-sm">Simple screens, visible actions, and fewer surprises.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Users className="h-4 w-4 text-primary-200" />
              <span>Trusted by your team, available wherever you sign in.</span>
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
