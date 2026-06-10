import { useState, useCallback, createContext, useContext } from 'react'
import { useAuth } from '../../context/AuthContext'
import ApplicationsList from './ApplicationsList'
import ApplicationDetail from './ApplicationDetail'
import KanbanBoard from '../../components/pipeline/KanbanBoard'
import ReportProblemButton from '../../components/ReportProblemButton'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'
const ADMIN_API = `${API_BASE}/api/admin`

// Toast context
const ToastContext = createContext()
export const useToast = () => useContext(ToastContext)

// Admin API helper — uses JWT token for auth
let _getToken = () => null

function buildFetch(baseUrl) {
  return function ({ timeoutMs, ...options } = {}, path) {
    const token = _getToken()
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const init = { ...options, headers }
    if (!timeoutMs) return fetch(`${baseUrl}${path}`, init)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    return fetch(`${baseUrl}${path}`, { ...init, signal: controller.signal }).finally(() =>
      clearTimeout(timer),
    )
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
  const { getToken } = useAuth()

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-white font-bold text-xl leading-tight">Applications</h1>
              {lastRefreshed && dashView === 'list' && (
                <p className="text-muted text-xs mt-0.5">
                  Updated {formatRefreshed(lastRefreshed)}
                </p>
              )}
            </div>
            {/* Segmented toggle */}
            <div className="flex items-center gap-0 p-1 bg-surface-alt border border-border rounded-lg">
              <button
                onClick={() => switchDashView('list')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  dashView === 'list'
                    ? 'bg-surface text-white shadow-sm border border-border'
                    : 'text-muted hover:text-white'
                }`}
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
                onClick={() => switchDashView('pipeline')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  dashView === 'pipeline'
                    ? 'bg-surface text-white shadow-sm border border-border'
                    : 'text-muted hover:text-white'
                }`}
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

        {/* Back button when in detail */}
        {view === 'detail' && (
          <button
            onClick={backToList}
            className="mb-4 flex items-center gap-2 text-sm text-muted hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Applications
          </button>
        )}

        {/* Content */}
        {view === 'detail' ? (
          <ApplicationDetail id={selectedAppId} onBack={backToList} />
        ) : dashView === 'pipeline' ? (
          <KanbanBoard onCardClick={openDetailFromCard} />
        ) : (
          <ApplicationsList onReview={openDetail} onDataRefreshed={handleDataRefreshed} />
        )}
      </div>
      <ReportProblemButton />
    </ToastContext.Provider>
  )
}
