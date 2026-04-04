import { useAuth } from '../../context/AuthContext'

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
  const { user, roles, fullName } = useAuth()

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
      </div>
    </div>
  )
}
