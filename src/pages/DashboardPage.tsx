function Dashboard() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20">
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300">
        App Shell
      </p>
      <h1 className="mt-4 text-3xl font-bold text-white">Dashboard</h1>
      <p className="mt-3 max-w-2xl text-slate-300">
        This route is wrapped by the shared layout, so you can build authenticated pages under
        `/dashboard` while keeping the landing page at `/`.
      </p>
    </section>
  )
}

export default Dashboard
