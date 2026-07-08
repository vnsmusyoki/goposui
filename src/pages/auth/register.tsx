import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Mail, Lock, User, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react'

function Register() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1200))

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.')
    } else if (password !== confirmPassword) {
      setError('Passwords do not match.')
    } else if (!agreeTerms) {
      setError('Please agree to the terms and privacy policy.')
    } else {
      setSuccess('Account created successfully! Redirecting...')
      setTimeout(() => navigate('/login'), 800)
    }

    setIsLoading(false)
  }

  return (
    <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
          Create an account
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">
          Set up your staff profile
        </h1>
        <p className="max-w-lg text-sm leading-6 text-muted sm:text-base">
          Create access for your team with only the essentials. You can complete the rest after
          login.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-text">Full name</span>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 focus-within:border-primary">
            <User className="h-4 w-4 text-muted" />
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Jane Doe"
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
            />
          </div>
        </label>

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

        <label className="block space-y-2">
          <span className="text-sm font-medium text-text">Confirm password</span>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 focus-within:border-primary">
            <Lock className="h-4 w-4 text-muted" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="text-muted transition hover:text-text"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4 text-sm text-muted">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(event) => setAgreeTerms(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border bg-transparent text-primary"
          />
          <span>
            I agree to the terms and privacy policy for this POS workspace.
          </span>
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
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="mt-6 border-t border-border pt-6">
        <Link
          to="/login"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text transition hover:bg-surface-alt"
        >
          Already have an account? Log in
        </Link>
      </div>

      
    </div>
  )
}

export default Register
