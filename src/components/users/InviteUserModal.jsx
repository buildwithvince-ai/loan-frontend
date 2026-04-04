import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'sales_officer', label: 'Sales Officer' },
  { value: 'verifier', label: 'Verifier' },
  { value: 'ci_officer', label: 'CI Officer' },
  { value: 'approver', label: 'Approver' },
  { value: 'loan_processing_officer', label: 'Loan Processing Officer' },
]

export default function InviteUserModal({ getToken, onSuccess, onClose }) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
  })
  const [roles, setRoles] = useState(['sales_officer'])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const toggleRole = (value) => {
    setError(null)
    setRoles((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) return setError('Full name is required.')
    if (!form.email.trim()) return setError('Email is required.')
    if (!form.password.trim()) return setError('Password is required.')
    if (roles.length === 0) return setError('Select at least one role.')

    setSubmitting(true)
    setError(null)

    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, roles }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to create user.')
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6 shadow-2xl">
        <h2 className="text-white font-bold text-lg mb-5">Invite User</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-muted mb-1.5">Full Name</label>
            <input
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Juan dela Cruz"
              className="w-full bg-surface-alt border border-border rounded-lg px-4 py-3 text-white focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="juan@gr8lending.com"
              className="w-full bg-surface-alt border border-border rounded-lg px-4 py-3 text-white focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Roles</label>
            <div className="bg-surface-alt border border-border rounded-lg p-3 flex flex-col gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={roles.includes(opt.value)}
                    onChange={() => toggleRole(opt.value)}
                    className="w-4 h-4 rounded border-border bg-surface text-green focus:ring-green/30 focus:ring-offset-0 cursor-pointer accent-[#5CB85C]"
                  />
                  <span className="text-sm text-white group-hover:text-green transition-colors">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Temporary password"
              className="w-full bg-surface-alt border border-border rounded-lg px-4 py-3 text-white focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green hover:bg-green/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border text-muted hover:text-white rounded-lg py-3 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
