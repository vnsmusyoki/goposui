import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { ApiError } from '../../lib/api'
import { useAuth } from '../../auth/AuthProvider'

type FieldErrors = {
  email?: string
  password?: string
  form?: string
}

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email)
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()
  const demoEmail = import.meta.env.DEV ? 'admin@gmail.com' : ''
  const demoPassword = import.meta.env.DEV ? 'Password@123' : ''
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState(demoEmail)
  const [password, setPassword] = useState(demoPassword)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard'

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, from, navigate])

  const validate = () => {
    const nextErrors: FieldErrors = {}

    if (!email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!password) {
      nextErrors.password = 'Password is required.'
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    }

    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationErrors = validate()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please fix the highlighted fields.')
      return
    }

    setIsLoading(true)

    try {
      await login({
        email: email.trim(),
        password,
        rememberMe,
      })
      toast.success('Signed in successfully.')
      navigate(from, { replace: true })
    } catch (error) {
      const apiError = error as ApiError
      const responseErrors =
        apiError instanceof ApiError && apiError.data && typeof apiError.data === 'object'
          ? (apiError.data as { errors?: FieldErrors }).errors
          : undefined

      if (responseErrors) {
        setErrors(responseErrors)
      }

      toast.error(apiError.message || 'Unable to sign in.')
      setErrors((current) => ({
        ...current,
        form: apiError.message || 'Unable to sign in.',
      }))
    } finally {
      setIsLoading(false)
    }
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

      <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-text">Email address</span>
          <div
            className={`flex items-center gap-3 rounded-2xl border bg-background px-4 py-3 focus-within:border-primary ${
              errors.email ? 'border-danger-500' : 'border-border'
            }`}
          >
            <Mail className="h-4 w-4 text-muted" />
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setErrors((current) => ({ ...current, email: undefined, form: undefined }))
              }}
              placeholder="name@company.com"
              autoComplete="email"
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
            />
          </div>
          {errors.email && <p className="text-xs text-danger-500">{errors.email}</p>}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-text">Password</span>
          <div
            className={`flex items-center gap-3 rounded-2xl border bg-background px-4 py-3 focus-within:border-primary ${
              errors.password ? 'border-danger-500' : 'border-border'
            }`}
          >
            <Lock className="h-4 w-4 text-muted" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setErrors((current) => ({ ...current, password: undefined, form: undefined }))
              }}
              placeholder="••••••••"
              autoComplete="current-password"
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
          {errors.password && <p className="text-xs text-danger-500">{errors.password}</p>}
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

        {errors.form && (
          <div className="rounded-2xl border border-danger-100 bg-danger-100 px-4 py-3 text-sm text-danger-500">
            {errors.form}
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

      
    </div>
  )
}

export default Login
