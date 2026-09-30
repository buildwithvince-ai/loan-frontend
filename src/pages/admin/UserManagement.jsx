import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import InviteUserModal from '../../components/users/InviteUserModal'
import EditRoleModal from '../../components/users/EditRoleModal'
import { getInitials } from '../../lib/applicantName'
import { ROLE_LABEL } from '../../constants/roles'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'

// Admin-level roles get the info tone; operational roles stay neutral.
const ROLE_TONE = {
  super_admin: 'x-chip--info',
  admin: 'x-chip--info',
}

// ─── Tiny reusables ───────────────────────────────────────────────────────────
function RoleBadges({ roles }) {
  const list = Array.isArray(roles) ? roles : roles ? [roles] : []
  return (
    <div className="flex flex-wrap gap-1">
      {list.map(r => (
        <span key={r} className={`x-chip ${ROLE_TONE[r] || 'x-chip--neutral'}`}>
          {ROLE_LABEL[r] || r}
        </span>
      ))}
    </div>
  )
}

function StatusBadge({ active }) {
  return (
    <span className={`x-chip ${active ? 'x-chip--positive' : 'x-chip--neutral'}`}>
      <span className="x-dot" aria-hidden="true" />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function UserAvatar({ user }) {
  return (
    <span className={`x-avatar-sm${user.is_active ? '' : ' opacity-50'}`}>
      {getInitials(user.full_name)}
    </span>
  )
}

function UsersSkeleton() {
  return (
    <div className="x-panel overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border/50">
          <div className="w-8 h-8 rounded-full x-skel animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-40 x-skel rounded animate-pulse" />
            <div className="h-3 w-52 x-skel rounded animate-pulse" />
          </div>
          <div className="h-5 w-24 x-skel rounded-full animate-pulse" />
          <div className="h-5 w-16 x-skel rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  )
}

// ─── Deactivate / Reactivate confirmation modal ───────────────────────────────
function ConfirmToggleModal({ user, onConfirm, onClose, loading }) {
  const deactivating = user.is_active

  return (
    <div
      className="x-modal-backdrop"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="x-modal max-w-sm" role="dialog" aria-modal="true">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-white font-medium text-lg">
            {deactivating ? 'Deactivate' : 'Reactivate'} {user.full_name}?
          </h2>
          {deactivating ? (
            <p className="mt-3 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2.5">
              This user will not be able to log in.
            </p>
          ) : (
            <p className="mt-2 text-muted text-sm">This user will regain access to the system.</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="x-btn text-muted hover:text-white">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`x-btn text-white ${
              deactivating ? 'bg-red-500 hover:bg-red-600' : 'bg-green hover:bg-green/90'
            }`}
          >
            {loading ? 'Please wait…' : deactivating ? 'Deactivate' : 'Reactivate'}
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
      <button onClick={onDismiss} className="text-white/70 hover:text-white">
        ✕
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const { getToken } = useAuth()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showInvite, setShowInvite] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // user obj for EditRoleModal
  const [toggleTarget, setToggleTarget] = useState(null) // user obj for confirm modal
  const [toggleLoading, setToggleLoading] = useState(false)
  const [toast, setToast] = useState(null) // { message, type }
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'inactive'
  const [roleFilter, setRoleFilter] = useState('all')

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
      const raw = Array.isArray(data) ? data : data.users || []
      // Normalize: ensure every user has a roles array
      setUsers(
        raw.map(u => ({
          ...u,
          roles: Array.isArray(u.roles) && u.roles.length ? u.roles : u.role ? [u.role] : [],
        })),
      )
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
      showToast(
        `${toggleTarget.full_name} has been ${toggleTarget.is_active ? 'deactivated' : 'reactivated'}.`,
      )
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
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}

      {/* Modals */}
      {showInvite && (
        <InviteUserModal
          getToken={getToken}
          onSuccess={() => {
            showToast('User created successfully.')
            fetchUsers()
          }}
          onClose={() => setShowInvite(false)}
        />
      )}
      {editTarget && (
        <EditRoleModal
          user={editTarget}
          getToken={getToken}
          onSuccess={() => {
            showToast('User updated.')
            fetchUsers()
          }}
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
      <div className="px-4 sm:px-6 py-6 max-w-7xl x-rise">
        {/* Page title + action */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-white font-medium text-2xl leading-tight">Users</h1>
            <p className="text-muted text-sm mt-0.5">Manage staff accounts and access levels.</p>
          </div>
          <button onClick={() => setShowInvite(true)} className="x-btn x-btn--primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Invite User
          </button>
        </div>

        {/* States */}
        {loading && <UsersSkeleton />}

        {!loading && error && (
          <div className="x-panel p-12 text-center">
            <p className="text-white font-medium mb-1">Failed to load users</p>
            <p className="text-muted text-sm mb-5">{error}</p>
            <button onClick={fetchUsers} className="x-pill">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <UsersView
            users={users}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            formatDate={formatDate}
            onEdit={setEditTarget}
            onToggle={setToggleTarget}
          />
        )}
      </div>
    </>
  )
}

// ─── Users list: status strip + toolbar + table (desktop) / cards (mobile) ────
function UsersView({
  users,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  roleFilter,
  setRoleFilter,
  formatDate,
  onEdit,
  onToggle,
}) {
  const activeCount = users.filter(u => u.is_active).length
  const tiles = [
    { label: 'All users', count: users.length, filter: 'all' },
    { label: 'Active', count: activeCount, filter: 'active', tone: 'positive' },
    { label: 'Inactive', count: users.length - activeCount, filter: 'inactive', tone: 'muted' },
  ]
  const rolesPresent = Object.keys(ROLE_LABEL).filter(r => users.some(u => u.roles.includes(r)))

  const q = search.trim().toLowerCase()
  const filtered = users.filter(u => {
    if (statusFilter === 'active' && !u.is_active) return false
    if (statusFilter === 'inactive' && u.is_active) return false
    if (roleFilter !== 'all' && !u.roles.includes(roleFilter)) return false
    if (q) {
      const hay = `${u.full_name || ''} ${u.email || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
  const filtersOn = statusFilter !== 'all' || roleFilter !== 'all' || q.length > 0
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setRoleFilter('all')
  }

  const actions = (u, wide) =>
    u.roles.includes('super_admin') ? (
      <span className="text-muted text-xs">Protected</span>
    ) : (
      <div className={`flex items-center gap-2${wide ? ' w-full' : ''}`}>
        <button
          onClick={() => onEdit(u)}
          className={`x-pill x-pill--sm${wide ? ' flex-1 justify-center' : ''}`}
        >
          Edit
        </button>
        <button
          onClick={() => onToggle(u)}
          className={`x-pill x-pill--sm ${u.is_active ? 'x-pill--danger' : 'x-pill--positive'}${
            wide ? ' flex-1 justify-center' : ''
          }`}
        >
          {u.is_active ? 'Deactivate' : 'Reactivate'}
        </button>
      </div>
    )

  return (
    <>
      <div className="x-stats mb-5 max-w-xl" role="group" aria-label="Filter by status">
        {tiles.map((t, i) => {
          const active = statusFilter === t.filter
          return (
            <button
              key={t.filter}
              onClick={() => setStatusFilter(t.filter)}
              aria-pressed={active}
              style={{ '--i': i }}
              className={`x-stat x-stagger${t.tone ? ` x-stat--${t.tone}` : ''}${
                active ? ' is-active' : ''
              }`}
            >
              <span className="x-stat-count">{t.count}</span>
              <span className="x-stat-label">{t.label}</span>
            </button>
          )
        })}
      </div>

      <div className="x-panel overflow-hidden">
        <div className="x-toolbar">
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email…"
              aria-label="Search users"
              className="x-control w-full pl-9"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            aria-label="Role"
            className="x-control flex-1 lg:flex-none min-w-[160px]"
          >
            <option value="all">All Roles</option>
            {rolesPresent.map(r => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3 lg:ml-auto">
            <span className="text-muted text-xs whitespace-nowrap" aria-live="polite">
              {filtered.length === users.length
                ? `${users.length} user${users.length !== 1 ? 's' : ''}`
                : `${filtered.length} of ${users.length}`}
            </span>
            {filtersOn && (
              <button onClick={clearFilters} className="x-pill x-pill--sm">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="x-table x-table--static">
            <thead>
              <tr>
                <th>User</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted">
                    {users.length === 0 ? 'No users found.' : 'No users match these filters.'}
                  </td>
                </tr>
              )}
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar user={u} />
                      <div className="min-w-0">
                        <p
                          className={`font-medium truncate leading-tight ${
                            u.is_active ? 'text-white' : 'text-muted'
                          }`}
                        >
                          {u.full_name}
                        </p>
                        <p className="text-muted text-xs truncate mt-0.5">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <RoleBadges roles={u.roles} />
                  </td>
                  <td>
                    <StatusBadge active={u.is_active} />
                  </td>
                  <td className="text-muted whitespace-nowrap">{formatDate(u.created_at)}</td>
                  <td>
                    <div className="flex justify-end">{actions(u, false)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3 mt-3">
        {filtered.length === 0 && (
          <div className="x-panel py-12 text-center text-muted text-sm">
            {users.length === 0 ? 'No users found.' : 'No users match these filters.'}
          </div>
        )}
        {filtered.map((u, i) => (
          <div
            key={u.id}
            style={{ '--i': Math.min(i, 8) }}
            className="x-panel x-stagger p-4 flex flex-col gap-3"
          >
            <div className="flex items-start gap-3">
              <UserAvatar user={u} />
              <div className="min-w-0 flex-1">
                <p
                  className={`font-medium truncate leading-tight ${
                    u.is_active ? 'text-white' : 'text-muted'
                  }`}
                >
                  {u.full_name}
                </p>
                <p className="text-muted text-xs truncate mt-0.5">{u.email}</p>
              </div>
              <StatusBadge active={u.is_active} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <RoleBadges roles={u.roles} />
              <span className="text-muted text-xs whitespace-nowrap">
                {formatDate(u.created_at)}
              </span>
            </div>
            {actions(u, true)}
          </div>
        ))}
      </div>
    </>
  )
}
