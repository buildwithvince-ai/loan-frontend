import { useState, useCallback, createContext, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import CiApplicationsList from './CiApplicationsList'
import CiAssessmentForm from './CiAssessmentForm'
import AppShell from '../../components/AppShell'
import ReportingIcon from '../../components/ReportingIcon'
import { INSIGHT_ROLES } from '../../constants/roles'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'
const CI_API = `${API_BASE}/api/ci`

// CI menu. The shell adds theme, Report a Problem and Sign Out.
const ASSESSMENTS_ITEM = {
  label: 'Assessments',
  path: '/ci',
  icon: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75"
      />
    </svg>
  ),
  match: p => p === '/ci',
}

/**
 * CI portal menu items for the signed-in user. Reporting is listed for everyone:
 * admins go to the real page, CI officers to a locked access-restricted page.
 * @returns {Array<object>} nav items for AppShell
 */
export function useCiNav() {
  const { hasAnyRole } = useAuth()
  const canSee = hasAnyRole(INSIGHT_ROLES)
  return [
    ASSESSMENTS_ITEM,
    {
      label: 'Reporting',
      path: canSee ? '/admin/reporting' : '/ci/reporting',
      icon: <ReportingIcon />,
      match: p => p === '/ci/reporting',
      locked: !canSee,
    },
  ]
}

const ToastContext = createContext()
export const useCiToast = () => useContext(ToastContext)

// CI API helper — attaches the backend-issued JWT as a Bearer token on every
// /api/ci/* call. On a 401 (missing/expired/invalid session) it fires the wired
// auth-expiry handler so the user is sent to re-login instead of hitting a
// dead-end "Invalid or missing authentication token" error.
let _getToken = () => null
let _onAuthExpired = () => {}
// Guards against a burst of concurrent 401s (e.g. submit + the 60s list poll)
// each triggering a redirect. Re-armed by any successful CI call.
let _authExpiryHandled = false

export async function ciFetch(path, options = {}) {
  const token = _getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${CI_API}${path}`, { ...options, headers })
  if (res.status === 401) {
    if (!_authExpiryHandled) {
      _authExpiryHandled = true
      _onAuthExpired()
    }
  } else if (res.ok) {
    _authExpiryHandled = false
  }
  return res
}

function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in-up flex items-center gap-2 max-w-sm ${
            t.type === 'success'
              ? 'bg-green/90 text-white'
              : t.type === 'error'
                ? 'bg-red-500/90 text-white'
                : 'bg-surface-alt text-white'
          }`}
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="text-white/70 hover:text-white">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

export default function CiPortal() {
  const { logout, getToken } = useAuth()
  const ciNav = useCiNav()
  const navigate = useNavigate()

  // Wire up module-level _getToken so ciFetch can access JWT
  _getToken = getToken

  const [view, setView] = useState('list')
  const [selectedApp, setSelectedApp] = useState(null)
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const openForm = app => {
    setSelectedApp(app)
    setView('form')
  }

  const backToList = () => {
    setView('list')
    setSelectedApp(null)
  }

  // Wire up the auth-expiry handler so a 401 on any CI call clears the expired
  // session and sends the user back to re-login (role redirect returns a
  // ci_officer to /ci) instead of dead-ending on the raw 401 error.
  _onAuthExpired = async () => {
    addToast('Your session has expired. Please log in again.', 'error')
    await logout()
    navigate('/login', { replace: true, state: { reason: 'session_expired' } })
  }

  return (
    <ToastContext.Provider value={addToast}>
      <Toast toasts={toasts} removeToast={removeToast} />
      {/* No tab bar: the assessment form owns the bottom edge (score + Submit bar). */}
      <AppShell navItems={ciNav} showTabBar={false}>
        <div className="max-w-5xl px-4 sm:px-6 py-6">
          <div key={view} className="x-rise">
            {view === 'list' ? (
              <CiApplicationsList onStartAssessment={openForm} />
            ) : (
              <CiAssessmentForm app={selectedApp} onBack={backToList} />
            )}
          </div>
        </div>
      </AppShell>
    </ToastContext.Provider>
  )
}
