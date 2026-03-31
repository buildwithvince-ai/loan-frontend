import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import InviteUserModal from '../../components/users/InviteUserModal'
import EditRoleModal from '../../components/users/EditRoleModal'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'

// ─── Role badge config ────────────────────────────────────────────────────────
const ROLE_BADGE = {
  super_admin:             'bg-purple-500/20 text-purple-400',
  admin:                   'bg-blue/20 text-blue',
  sales_officer:           'bg-teal-500/20 text-teal-400',
  verifier:                'bg-amber-500/20 text-amber-400',
  ci_officer:              'bg-green/20 text-green',
  loan_processing_officer: 'bg-pink-500/20 text-pink-400',
}

const ROLE_LABEL = {
  super_admin:             'Super Admin',
  admin:                   'Admin',
  sales_officer:           'Sales Officer',
  verifier:                'Verifier',
  ci_officer:              'CI Officer',
  loan_processing_officer: 'Loan Processing Officer',
}

// ─── Tiny reusables ───────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${ROLE_BADGE[role] || 'bg-surface-alt text-muted'}`}>
      {ROLE_LABEL[role] || role}
    </span>
  )
}

function StatusBadge({ active }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green/20 text-green' : 'bg-red-500/20 text-red-400'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-green border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ─── Deactivate / Reactivate confirmation modal ───────────────────────────────
function ConfirmToggleModal({ user, onConfirm, onClose, loading }) {
  const deactivating = user.is_active

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6 shadow-2xl">
        <h2 className="text-white font-bold text-lg mb-2">
          {deactivating ? 'Deactivate' : 'Reactivate'} {user.full_name}?
        </h2>
        {deactivating && (
          <p className="text-amber-400 text-sm mb-5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5">
            This user will not be able to log in.
          </p>
        )}
        {!deactivating && (
          <p className="text-muted text-sm mb-5">
            This user will regain access to the system.
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 font-semibold rounded-lg py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white ${
              deactivating ? 'bg-red-500 hover:bg-red-600' : 'bg-green hover:bg-green/90'
            }`}
          >
            {loading ? 'Please wait…' : deactivating ? 'Deactivate' : 'Reactivate'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-border text-muted hover:text-white rounded-lg py-3 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDismiss }) {
  if (!message) return null
  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 max-w-sm ${
        type === 'success' ? 'bg-green/90 text-white' : 'bg-red-500/90 text-white'
      }`}
    >
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="text-white/70 hover:text-white">✕</button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const { getToken } = useAuth()

  const [users, setUsers]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [showInvite, setShowInvite]     = useState(false)
  const [editTarget, setEditTarget]     = useState(null)   // user obj for EditRoleModal
  const [toggleTarget, setToggleTarget] = useState(null)   // user obj for confirm modal
  const [toggleLoading, setToggleLoading] = useState(false)
  const [toast, setToast]               = useState(null)   // { message, type }

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/api/users`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || data.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : data.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleToggleStatus = async () => {
    if (!toggleTarget) return
    setToggleLoading(true)
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/api/users/${toggleTarget.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !toggleTarget.is_active }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to update status.')
      showToast(`${toggleTarget.full_name} has been ${toggleTarget.is_active ? 'deactivated' : 'reactivated'}.`)
      setToggleTarget(null)
      fetchUsers()
    } catch (err) {
      showToast(err.message, 'error')
      setToggleTarget(null)
    } finally {
      setToggleLoading(false)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <>
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {/* Modals */}
      {showInvite && (
        <InviteUserModal
          getToken={getToken}
          onSuccess={() => { showToast('User created successfully.'); fetchUsers() }}
          onClose={() => setShowInvite(false)}
        />
      )}
      {editTarget && (
        <EditRoleModal
          user={editTarget}
          getToken={getToken}
          onSuccess={() => { showToast('Role updated.'); fetchUsers() }}
          onClose={() => setEditTarget(null)}
        />
      )}
      {toggleTarget && (
        <ConfirmToggleModal
          user={toggleTarget}
          loading={toggleLoading}
          onConfirm={handleToggleStatus}
          onClose={() => setToggleTarget(null)}
        />
      )}

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 max-w-7xl">
        {/* Page title + action */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white font-bold text-2xl">User Management</h1>
            <p className="text-muted text-sm mt-0.5">Manage staff accounts and access levels.</p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="bg-green hover:bg-green/90 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Invite User
          </button>
        </div>

        {/* States */}
        {loading && <Spinner />}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={fetchUsers} className="text-green hover:text-green/80 text-sm transition-colors">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-muted text-sm mb-4">
              {users.length} user{users.length !== 1 ? 's' : ''}
            </p>

            {/* Desktop table */}
            <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted uppercase text-xs bg-surface-alt">
                      <th className="px-4 py-3 font-medium">Full Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted">
                          No users found.
                        </td>
                      </tr>
                    )}
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className={`border-t border-border/50 hover:bg-surface-alt/30 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}
                      >
                        <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{u.full_name}</td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap">{u.email}</td>
                        <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                        <td className="px-4 py-3"><StatusBadge active={u.is_active} /></td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap">{formatDate(u.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {u.role !== 'super_admin' && (
                              <button
                                onClick={() => setEditTarget(u)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted hover:text-white hover:border-muted transition-colors whitespace-nowrap"
                              >
                                Edit Role
                              </button>
                            )}
                            {u.role !== 'super_admin' && (
                              <button
                                onClick={() => setToggleTarget(u)}
                                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                                  u.is_active
                                    ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                                    : 'border-green/40 text-green hover:bg-green/10'
                                }`}
                              >
                                {u.is_active ? 'Deactivate' : 'Reactivate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden flex flex-col gap-3">
              {users.length === 0 && (
                <p className="text-muted text-sm text-center py-12">No users found.</p>
              )}
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`bg-surface border border-border rounded-xl p-4 ${!u.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-white font-semibold text-sm">{u.full_name}</p>
                      <p className="text-muted text-xs mt-0.5">{u.email}</p>
                    </div>
                    <StatusBadge active={u.is_active} />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <RoleBadge role={u.role} />
                    <span className="text-muted text-xs">{formatDate(u.created_at)}</span>
                  </div>
                  {u.role !== 'super_admin' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditTarget(u)}
                        className="flex-1 text-xs px-3 py-2 rounded-lg border border-border text-muted hover:text-white hover:border-muted transition-colors"
                      >
                        Edit Role
                      </button>
                      <button
                        onClick={() => setToggleTarget(u)}
                        className={`flex-1 text-xs px-3 py-2 rounded-lg border transition-colors ${
                          u.is_active
                            ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                            : 'border-green/40 text-green hover:bg-green/10'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
