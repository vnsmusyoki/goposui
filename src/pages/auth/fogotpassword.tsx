import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mail, RefreshCcw, ShieldCheck, Loader2 } from 'lucide-react'

function FogotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (!email) {
      setError('Please enter your email address.')
    } else {
      setSuccess('Reset link sent. Check your inbox.')
    }

    setIsLoading(false)
  }

  return (
    <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
          Reset access
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">
          Recover your password
        </h1>
        <p className="max-w-lg text-sm leading-6 text-muted sm:text-base">
          We’ll send a reset link to the email address on your account.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-text">Email address</span>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 focus-within:border-primary">
            <Mail className="h-4 w-4 text-muted" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
            />
          </div>
        </label>

        {error && (
          <div className="rounded-2xl border border-danger-100 bg-danger-100 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-success-100 bg-success-100 px-4 py-3 text-sm text-success-500">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {isLoading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted">
        <div>Protected by your workspace credentials.</div>
        <Link to="/login" className="font-medium text-primary transition hover:text-primary-hover">
          Back to sign in
        </Link>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-info-100 bg-info-100 px-4 py-3 text-sm text-info-500">
        <ShieldCheck className="h-4 w-4" />
        <span>Session access stays isolated from the public landing experience.</span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
        <RefreshCcw className="h-4 w-4" />
        <span>Reset links can be added to your backend flow later.</span>
      </div>
    </div>
  )
}

export default FogotPassword
