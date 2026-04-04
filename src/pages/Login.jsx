import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_REDIRECTS = {
  super_admin: '/admin',
  admin: '/admin',
  sales_officer: '/admin',
  verifier: '/admin',
  ci_officer: '/ci',
  approver: '/admin',
  loan_processing_officer: '/admin',
}

function getRedirect(roles) {
  for (const r of roles) {
    if (ROLE_REDIRECTS[r]) return ROLE_REDIRECTS[r]
  }
  return '/admin'
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, isAuthenticated, roles } = useAuth()
  const navigate = useNavigate()

  // If already authenticated, redirect
  if (isAuthenticated && roles.length) {
    navigate(getRedirect(roles), { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await login(email, password)
      const dest = getRedirect(user.roles || [])
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-2xl p-8">
          <div className="text-center mb-8">
            <img src="/gr8logo.png" alt="GR8 Lending" className="w-16 h-16 mx-auto mb-4 opacity-80" />
            <h1 className="text-2xl font-bold text-white">GR8 Lending</h1>
            <p className="text-muted text-sm mt-1">Staff Portal</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm text-muted mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                className="w-full bg-surface-alt border border-border rounded-lg px-4 py-3 text-white focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none"
                placeholder="you@company.com"
                autoFocus
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-muted mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                className="w-full bg-surface-alt border border-border rounded-lg px-4 py-3 text-white focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green hover:bg-green-hover disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
