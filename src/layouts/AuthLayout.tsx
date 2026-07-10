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

             
          </div>

          <div className="space-y-4">
            
 
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
