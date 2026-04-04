import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'sales_officer', label: 'Sales Officer' },
  { value: 'verifier', label: 'Verifier' },
  { value: 'ci_officer', label: 'CI Officer' },
  { value: 'loan_processing_officer', label: 'Loan Processing Officer' },
]

export default function EditRoleModal({ user, getToken, onSuccess, onClose }) {
  const [fullName, setFullName] = useState(user.full_name || '')
  const [role, setRole] = useState(user.role || 'sales_officer')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Full name is required.')
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
        body: JSON.stringify({ full_name: fullName.trim(), role }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to update role.')
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
            <label className="block text-sm text-muted mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setError(null) }}
              className="w-full bg-surface-alt border border-border rounded-lg px-4 py-3 text-white focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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
              {submitting ? 'Saving…' : 'Save Changes'}
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
