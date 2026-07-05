import { useTheme } from '../theme/ThemeProvider'

const highlights = [
  { label: '12k+', text: 'merchants trust FlowPOS' },
  { label: '99.9%', text: 'uptime across devices' },
  { label: '3 min', text: 'average setup time' },
]

const featureCards = [
  {
    title: 'Fast checkout',
    text: 'Keep queues moving with a cashier flow that is built for speed and clarity.',
  },
  {
    title: 'Inventory control',
    text: 'Track stock, catch low inventory early, and keep every location in sync.',
  },
  {
    title: 'Team-ready',
    text: 'Simple workflows, clear permissions, and quick onboarding for new staff.',
  },
]

const steps = [
  { step: '01', title: 'Choose your setup', text: 'Pick a template, connect your store, and define your brand colors.' },
  { step: '02', title: 'Load products', text: 'Add items, pricing, and inventory from one simple admin flow.' },
  { step: '03', title: 'Start selling', text: 'Launch in minutes and keep growing with live insights.' },
]

function LandingPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-text transition-colors duration-300">
      <section
        className="hero-radial relative overflow-hidden border-b border-border"
      >
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-28 lg:pt-10">
          <div className="flex items-center justify-between rounded-full border border-border bg-surface px-5 py-3 shadow-theme backdrop-blur">
            <div className="font-semibold tracking-wide">FlowPOS</div>
            <div className="hidden items-center gap-6 text-sm text-muted md:flex">
              <a href="#features" className="hover:text-text">Features</a>
              <a href="#steps" className="hover:text-text">How it works</a>
              <a href="#pricing" className="hover:text-text">Pricing</a>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-surface-alt"
              >
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </button>
              <a
                href="#pricing"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                Start free trial
              </a>
            </div>
          </div>

          <div className="mt-14 grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                #1 POS for growing teams
              </span>

              <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                One POS platform for sales, stock, and staff.
              </h1>

              <p className="mt-5 max-w-xl text-lg text-muted">
                Run your business from a single modern interface with a design system that adapts to both light and dark modes.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#pricing"
                  className="rounded-xl bg-primary px-6 py-3.5 font-semibold text-white transition hover:bg-primary-hover"
                >
                  Get started free
                </a>
                <a
                  href="#features"
                  className="rounded-xl border border-border bg-surface px-6 py-3.5 font-semibold transition hover:bg-surface-alt"
                >
                  See features
                </a>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border bg-surface p-4">
                    <div className="text-2xl font-bold">{item.label}</div>
                    <div className="mt-1 text-sm text-muted">{item.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-surface p-4 shadow-theme">
              <div className="hero-card-gradient rounded-[1.5rem] border border-border p-5">
                <div className="rounded-2xl bg-surface p-5">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <div className="text-sm text-muted">Today</div>
                      <div className="text-2xl font-bold">$14,250</div>
                    </div>
                    <div className="rounded-full bg-surface-alt px-3 py-1 text-sm font-medium text-primary">
                      +18.2%
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-background p-4">
                      <div className="text-sm text-muted">Orders</div>
                      <div className="mt-2 text-3xl font-bold">328</div>
                    </div>
                    <div className="rounded-2xl bg-background p-4">
                      <div className="text-sm text-muted">Low stock alerts</div>
                      <div className="mt-2 text-3xl font-bold">04</div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {['Coffee beans', 'Wireless scanner', 'Receipt paper'].map((item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-2xl border border-border px-4 py-3"
                      >
                        <span>{item}</span>
                        <span className="text-sm text-muted">Synced</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
          {['Stripe', 'Shopify', 'Square'].map((brand) => (
            <div
              key={brand}
              className="rounded-2xl border border-border bg-background px-6 py-5 text-center text-lg font-semibold text-muted"
            >
              {brand}
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Everything you need to sell with confidence</h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl border border-border bg-surface p-6 shadow-theme"
            >
              <div className="h-12 w-12 rounded-2xl bg-surface-alt" />
              <h3 className="mt-5 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-muted">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="steps" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Get set up in three simple steps</h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((item) => (
              <article
                key={item.step}
                className="rounded-3xl border border-border bg-background p-6"
              >
                <div className="text-sm font-semibold tracking-[0.3em] text-primary">
                  {item.step}
                </div>
                <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-muted">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-border bg-surface p-8 shadow-theme sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                Pricing
              </p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Simple pricing for modern retail teams</h2>
              <p className="mt-4 max-w-2xl text-muted">
                Start with the essentials, then scale up as you add locations, staff, and channels.
              </p>
            </div>

            <div className="rounded-3xl bg-background p-6">
              <div className="text-sm text-muted">Growth</div>
              <div className="mt-2 text-4xl font-bold">$59</div>
              <div className="mt-1 text-muted">per month</div>
              <a
                href="#"
                className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover"
              >
                Start trial
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <span>© 2026 FlowPOS. Built with theme tokens.</span>
          <span>Colors are controlled from one shared point.</span>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
