import { useState, useCallback, createContext, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ApplicationsList from './ApplicationsList'
import ApplicationDetail from './ApplicationDetail'
import KanbanBoard from '../../components/pipeline/KanbanBoard'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'
const ADMIN_API = `${API_BASE}/api/admin`

// Toast context
const ToastContext = createContext()
export const useToast = () => useContext(ToastContext)

// Admin API helper — attaches the backend-issued JWT as a Bearer token. On a
// 401 (missing/expired/invalid session) it fires the wired auth-expiry handler
// so the user is sent to re-login instead of dead-ending on the raw error.
let _getToken = () => null
let _onAuthExpired = () => {}
// Guards against a burst of concurrent 401s (e.g. list poll + kanban poll) each
// triggering a redirect. Re-armed by any successful admin/pipeline call.
let _authExpiryHandled = false

function buildFetch(baseUrl) {
  return async function ({ timeoutMs, ...options } = {}, path) {
    const token = _getToken()
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const init = { ...options, headers }
    let res
    if (!timeoutMs) {
      res = await fetch(`${baseUrl}${path}`, init)
    } else {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        res = await fetch(`${baseUrl}${path}`, { ...init, signal: controller.signal })
      } finally {
        clearTimeout(timer)
      }
    }
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
}

const _adminFetchInner = buildFetch(ADMIN_API)
const _pipelineFetchInner = buildFetch(`${API_BASE}/api/pipeline`)

export function adminFetch(path, options = {}) {
  return _adminFetchInner(options, path)
}

export function pipelineFetch(path, options = {}) {
  return _pipelineFetchInner(options, path)
}

// Toast component
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in-up flex items-center gap-2 max-w-sm ${
            t.type === 'success'
              ? 'bg-green/60 text-white'
              : t.type === 'error'
                ? 'bg-red-500/70 text-white'
                : 'bg-surface-alt text-white'
          }`}
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="text-white/70 hover:text-white">
            x
          </button>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const { getToken, logout } = useAuth()
  const navigate = useNavigate()

  // Wire up the module-level _getToken so adminFetch can access JWT
  _getToken = getToken

  const [view, setView] = useState('list') // 'list' | 'detail'
  const [dashView, setDashView] = useState(() => localStorage.getItem('gr8_admin_view') || 'list') // 'list' | 'pipeline'
  const [selectedAppId, setSelectedAppId] = useState(null)
  const [toasts, setToasts] = useState([])
  const [lastRefreshed, setLastRefreshed] = useState(null)

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Wire up the auth-expiry handler so a 401 on any admin/pipeline call clears
  // the expired session and sends the user back to re-login (role redirect
  // returns them to /admin) instead of dead-ending on the raw 401 error.
  _onAuthExpired = async () => {
    addToast('Your session has expired. Please log in again.', 'error')
    await logout()
    navigate('/login', { replace: true, state: { reason: 'session_expired' } })
  }

  const openDetail = id => {
    setSelectedAppId(id)
    setView('detail')
  }

  const openDetailFromCard = app => {
    const id = app.id || app._id || app.reference_id
    openDetail(id)
  }

  const backToList = () => {
    setView('list')
    setSelectedAppId(null)
  }

  const switchDashView = v => {
    setDashView(v)
    localStorage.setItem('gr8_admin_view', v)
  }

  const handleDataRefreshed = useCallback(ts => {
    setLastRefreshed(ts)
  }, [])

  function formatRefreshed(ts) {
    if (!ts) return null
    const diff = Math.floor((Date.now() - ts) / 1000)
    if (diff < 5) return 'just now'
    if (diff < 60) return `${diff}s ago`
    const mins = Math.floor(diff / 60)
    return `${mins}m ago`
  }

  return (
    <ToastContext.Provider value={addToast}>
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="px-4 sm:px-6 py-6">
        {/* Top header bar */}
        {view !== 'detail' && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-white font-medium text-2xl leading-tight">Applications</h1>
              {lastRefreshed && dashView === 'list' && (
                <p className="text-muted text-xs mt-0.5">
                  Updated {formatRefreshed(lastRefreshed)}
                </p>
              )}
            </div>
            {/* Segmented toggle — one sliding thumb */}
            <div
              className="x-seg"
              role="tablist"
              aria-label="Dashboard view"
              style={{ '--n': 2, '--idx': dashView === 'pipeline' ? 1 : 0 }}
            >
              <span className="x-seg-thumb" aria-hidden="true" />
              <button
                role="tab"
                aria-selected={dashView === 'list'}
                onClick={() => switchDashView('list')}
                className={`x-seg-btn${dashView === 'list' ? ' is-active' : ''}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
                List
              </button>
              <button
                role="tab"
                aria-selected={dashView === 'pipeline'}
                onClick={() => switchDashView('pipeline')}
                className={`x-seg-btn${dashView === 'pipeline' ? ' is-active' : ''}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z"
                  />
                </svg>
                Pipeline
              </button>
            </div>
          </div>
        )}

        <div key={view === 'detail' ? 'detail' : dashView} className="x-rise">
          {view === 'detail' ? (
            <ApplicationDetail id={selectedAppId} onBack={backToList} />
          ) : dashView === 'pipeline' ? (
            <KanbanBoard onCardClick={openDetailFromCard} />
          ) : (
            <ApplicationsList onReview={openDetail} onDataRefreshed={handleDataRefreshed} />
          )}
        </div>
      </div>
    </ToastContext.Provider>
  )
}
