import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Mail,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'

function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1200))

    if (email && password) {
      setSuccess('Login successful! Redirecting...')
      setTimeout(() => navigate('/app/dashboard'), 800)
    } else {
      setError('Please enter both email and password.')
    }

    setIsLoading(false)
  }

  return (
    <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
          Welcome back
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">
          Sign in to your POS workspace
        </h1>
        <p className="max-w-lg text-sm leading-6 text-muted sm:text-base">
          Use your staff credentials to access the dashboard and manage sales.
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

        <label className="block space-y-2">
          <span className="text-sm font-medium text-text">Password</span>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 focus-within:border-primary">
            <Lock className="h-4 w-4 text-muted" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="text-muted transition hover:text-text"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-border bg-transparent text-primary"
            />
            Remember me
          </label>

          <Link to="/forgot-password" className="text-sm font-medium text-primary transition hover:text-primary-hover">
            Forgot password?
          </Link>
        </div>

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
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6 border-t border-white/10 pt-6">
        <Link
          to="/register"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text transition hover:bg-surface-alt"
        >
          Need an account? Create one
        </Link>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-info-100 bg-info-100 px-4 py-3 text-sm text-info-500">
        <ShieldCheck className="h-4 w-4" />
        <span>Session access stays isolated from the public landing experience.</span>
      </div>
    </div>
  )
}

export default Login
