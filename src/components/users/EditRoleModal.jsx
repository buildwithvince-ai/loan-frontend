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

function initRoles(user) {
  if (Array.isArray(user.roles) && user.roles.length) return user.roles
  if (user.role) return [user.role]
  return ['sales_officer']
}

export default function EditRoleModal({ user, getToken, onSuccess, onClose }) {
  const [fullName, setFullName] = useState(user.full_name || '')
  const [roles, setRoles] = useState(initRoles(user))
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const toggleRole = (value) => {
    setError(null)
    setRoles((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }
    if (roles.length === 0) {
      setError('Select at least one role.')
      return
    }
    setSubmitting(true)
    setError(null)

    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ full_name: fullName.trim(), roles }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to update user.')
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
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6 shadow-2xl">
        <h2 className="text-white font-bold text-lg mb-1">Edit User</h2>
        <p className="text-muted text-sm mb-5 truncate">{user.email}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-muted mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setError(null) }}
              className="w-full bg-surface-alt border border-border rounded-lg px-4 py-3 text-white focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none"
              placeholder="Enter full name"
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
              {submitting ? 'Saving...' : 'Save Changes'}
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
