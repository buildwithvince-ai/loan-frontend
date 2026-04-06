import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  sales_officer: 'Sales Officer',
  verifier: 'Verifier',
  ci_officer: 'CI Officer',
  approver: 'Approver',
  loan_processing_officer: 'Loan Processing Officer',
}

const ROLE_BADGE = {
  super_admin: 'bg-purple-500/20 text-purple-400',
  admin: 'bg-blue/20 text-blue',
  sales_officer: 'bg-teal-500/20 text-teal-400',
  verifier: 'bg-amber-500/20 text-amber-400',
  ci_officer: 'bg-green/20 text-green',
  approver: 'bg-indigo-500/20 text-indigo-400',
  loan_processing_officer: 'bg-pink-500/20 text-pink-400',
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-border/50 last:border-0">
      <span className="text-muted text-sm w-40 shrink-0 mb-1 sm:mb-0">{label}</span>
      <span className="text-white text-sm">{value || '—'}</span>
    </div>
  )
}

export default function MyAccount() {
  const { user, roles, fullName, getToken } = useAuth()
  const [showPwModal, setShowPwModal] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState(null)
  const [pwSuccess, setPwSuccess] = useState(false)

  const handlePwChange = async () => {
    setPwError(null)
    if (pwForm.new.length < 6) return setPwError('New password must be at least 6 characters.')
    if (pwForm.new !== pwForm.confirm) return setPwError('Passwords do not match.')

    setPwLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          current_password: pwForm.current,
          new_password: pwForm.new,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to change password')
      setPwSuccess(true)
      setPwForm({ current: '', new: '', confirm: '' })
    } catch (err) {
      setPwError(err.message)
    } finally {
      setPwLoading(false)
    }
  }

  const closePwModal = () => {
    setShowPwModal(false)
    setPwForm({ current: '', new: '', confirm: '' })
    setPwError(null)
    setPwSuccess(false)
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-white font-bold text-2xl">My Account</h1>
        <p className="text-muted text-sm mt-0.5">Your profile and session details.</p>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Avatar + name header */}
        <div className="px-6 py-5 border-b border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center">
            <span className="text-green font-bold text-lg">
              {(fullName || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white font-semibold">{fullName || '—'}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {roles.map((r) => (
                <span key={r} className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[r] || 'bg-surface-alt text-muted'}`}>
                  {ROLE_LABEL[r] || r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Info fields */}
        <div className="px-6">
          <InfoRow label="Full Name" value={fullName} />
          <InfoRow label="Email" value={user?.email} />
          <InfoRow label="User ID" value={user?.id} />
          <InfoRow label="Role(s)" value={roles.map((r) => ROLE_LABEL[r] || r).join(', ')} />
          {user?.created_at && (
            <InfoRow
              label="Account Created"
              value={new Date(user.created_at).toLocaleDateString('en-PH', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            />
          )}
          {user?.last_login_at && (
            <InfoRow
              label="Last Login"
              value={new Date(user.last_login_at).toLocaleString('en-PH', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            />
          )}
        </div>

        {/* Change Password */}
        <div className="px-6 py-4 border-t border-border">
          <button
            onClick={() => setShowPwModal(true)}
            className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Change Password
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm shadow-2xl shadow-black/60" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-white font-bold text-lg">Change Password</h2>
            </div>

            <div className="px-6 py-4 space-y-4">
              {pwSuccess ? (
                <div className="p-3 bg-green/10 border border-green/30 rounded-lg">
                  <p className="text-green text-sm">Password changed successfully.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-muted mb-1.5">Current Password</label>
                    <input
                      type="password"
                      value={pwForm.current}
                      onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                      className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted/50 focus:border-green/50 focus:ring-1 focus:ring-green/20 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1.5">New Password</label>
                    <input
                      type="password"
                      value={pwForm.new}
                      onChange={(e) => setPwForm({ ...pwForm, new: e.target.value })}
                      className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted/50 focus:border-green/50 focus:ring-1 focus:ring-green/20 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                      className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted/50 focus:border-green/50 focus:ring-1 focus:ring-green/20 outline-none transition-colors"
                    />
                  </div>
                  {pwError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-sm">{pwError}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                onClick={closePwModal}
                disabled={pwLoading}
                className="px-4 py-2 text-sm text-muted hover:text-white transition-colors disabled:opacity-50"
              >
                {pwSuccess ? 'Close' : 'Cancel'}
              </button>
              {!pwSuccess && (
                <button
                  onClick={handlePwChange}
                  disabled={pwLoading || !pwForm.current || !pwForm.new || !pwForm.confirm}
                  className="px-5 py-2 rounded-lg text-sm font-semibold bg-green/10 text-green border border-green/30 hover:bg-green/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {pwLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : 'Update Password'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
