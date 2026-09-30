import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../lib/applicantName'
import { ROLE_LABEL } from '../../constants/roles'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'

// Admin-level roles get the info tone; operational roles stay neutral (matches Users).
const ROLE_TONE = {
  super_admin: 'x-chip--info',
  admin: 'x-chip--info',
}

function DetailField({ label, value, mono }) {
  return (
    <div className="x-field-card">
      <span className="x-field-label">{label}</span>
      <span className={`text-white text-sm break-all${mono ? ' font-mono text-xs' : ''}`}>
        {value || '—'}
      </span>
    </div>
  )
}

function PasswordField({ label, value, onChange, autoComplete }) {
  return (
    <label className="block">
      <span className="x-field-label mb-1.5">{label}</span>
      <input
        type="password"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="x-control w-full"
      />
    </label>
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
          Authorization: `Bearer ${getToken()}`,
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

  const created = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-PH', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null
  const lastLogin = user?.last_login_at
    ? new Date(user.last_login_at).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl x-rise">
      <div className="mb-6">
        <h1 className="text-white font-medium text-2xl leading-tight">My Account</h1>
        <p className="text-muted text-sm mt-0.5">Your profile and session details.</p>
      </div>

      {/* Profile */}
      <header className="x-hero">
        <div className="flex items-center gap-4 min-w-0">
          <span className="x-avatar-lg">{getInitials(fullName, 'U')}</span>
          <div className="min-w-0">
            <p className="x-kicker">Signed in as</p>
            <h2 className="x-hero-name !mt-1 truncate">{fullName || '—'}</h2>
            <p className="text-sm truncate" style={{ color: 'var(--x-on-deep-muted)' }}>
              {user?.email || '—'}
            </p>
          </div>
        </div>
        <div className="x-hero-chips">
          {roles.map(r => (
            <span key={r} className={`x-chip ${ROLE_TONE[r] || 'x-chip--neutral'}`}>
              {ROLE_LABEL[r] || r}
            </span>
          ))}
        </div>
      </header>

      {/* Details */}
      <section className="x-panel x-section mt-5">
        <div className="x-section-head">
          <h3 className="x-section-title">Account details</h3>
        </div>
        <div className="x-section-body pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <DetailField label="Full Name" value={fullName} />
          <DetailField label="Email" value={user?.email} />
          <DetailField label="Role(s)" value={roles.map(r => ROLE_LABEL[r] || r).join(', ')} />
          {created && <DetailField label="Account Created" value={created} />}
          {lastLogin && <DetailField label="Last Login" value={lastLogin} />}
          <DetailField label="User ID" value={user?.id} mono />
        </div>
      </section>

      {/* Security */}
      <section className="x-panel x-section mt-5">
        <div className="x-section-head">
          <div className="min-w-0">
            <h3 className="x-section-title">Password</h3>
            <p className="text-muted text-xs mt-0.5">Change the password you use to sign in.</p>
          </div>
          <button onClick={() => setShowPwModal(true)} className="x-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Change Password
          </button>
        </div>
      </section>

      {/* Change Password Modal */}
      {showPwModal && (
        <div className="x-modal-backdrop">
          <div
            className="x-modal max-w-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Change Password"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-white font-medium text-lg">Change Password</h2>
            </div>

            <div className="px-6 py-5 space-y-4">
              {pwSuccess ? (
                <div className="p-3 bg-green/10 border border-green/30 rounded-md">
                  <p className="text-green text-sm">Password changed successfully.</p>
                </div>
              ) : (
                <>
                  <PasswordField
                    label="Current Password"
                    value={pwForm.current}
                    onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
                    autoComplete="current-password"
                  />
                  <PasswordField
                    label="New Password"
                    value={pwForm.new}
                    onChange={e => setPwForm({ ...pwForm, new: e.target.value })}
                    autoComplete="new-password"
                  />
                  <PasswordField
                    label="Confirm New Password"
                    value={pwForm.confirm}
                    onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                    autoComplete="new-password"
                  />
                  {pwError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                      <p className="text-red-400 text-sm">{pwError}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
              <button
                onClick={closePwModal}
                disabled={pwLoading}
                className="x-btn text-muted hover:text-white"
              >
                {pwSuccess ? 'Close' : 'Cancel'}
              </button>
              {!pwSuccess && (
                <button
                  onClick={handlePwChange}
                  disabled={pwLoading || !pwForm.current || !pwForm.new || !pwForm.confirm}
                  className="x-btn x-btn--primary"
                >
                  {pwLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    'Update Password'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
