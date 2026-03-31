import { useState, useCallback, createContext, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ApplicationsList from './ApplicationsList'
import ApplicationDetail from './ApplicationDetail'
import KanbanBoard from '../../components/pipeline/KanbanBoard'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'
const ADMIN_API = `${API_BASE}/api/admin`

// Toast context
const ToastContext = createContext()
export const useToast = () => useContext(ToastContext)

// Admin API helper — uses JWT token for auth
let _getToken = () => null

export function adminFetch(path, options = {}) {
  const token = _getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return fetch(`${ADMIN_API}${path}`, { ...options, headers })
}

// Toast component
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
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

export default function AdminDashboard() {
  const { logout, getToken, role, fullName } = useAuth()
  const navigate = useNavigate()

  // Wire up the module-level _getToken so adminFetch can access JWT
  _getToken = getToken

  const [view, setView] = useState('list') // 'list' | 'detail'
  const [dashView, setDashView] = useState(
    () => localStorage.getItem('gr8_admin_view') || 'list'
  ) // 'list' | 'pipeline'
  const [selectedAppId, setSelectedAppId] = useState(null)
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const openDetail = (id) => {
    setSelectedAppId(id)
    setView('detail')
  }

  const openDetailFromCard = (app) => {
    const id = app.id || app._id || app.reference_id
    openDetail(id)
  }

  const backToList = () => {
    setView('list')
    setSelectedAppId(null)
  }

  const switchDashView = (v) => {
    setDashView(v)
    localStorage.setItem('gr8_admin_view', v)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <ToastContext.Provider value={addToast}>
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen bg-canvas">
        {/* Top nav */}
        <header className="bg-surface border-b border-border sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/gr8logo.png" alt="GR8" className="w-8 h-8 opacity-80" />
              <span className="text-white font-bold text-lg hidden sm:inline">GR8 Admin</span>
              <nav className="flex items-center gap-1 ml-4">
                <button
                  onClick={backToList}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    view !== 'detail'
                      ? 'bg-surface-alt text-green'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  Applications
                </button>
                {role === 'super_admin' && (
                  <button
                    onClick={() => navigate('/admin/users')}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-white transition-colors"
                  >
                    Users
                  </button>
                )}

                {/* View toggle — only show when not in detail */}
                {view !== 'detail' && (
                  <div className="flex items-center gap-0.5 ml-2 p-0.5 bg-canvas rounded-lg border border-border">
                    <button
                      onClick={() => switchDashView('list')}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        dashView === 'list'
                          ? 'bg-surface-alt text-green'
                          : 'text-muted hover:text-white'
                      }`}
                    >
                      List View
                    </button>
                    <button
                      onClick={() => switchDashView('pipeline')}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        dashView === 'pipeline'
                          ? 'bg-surface-alt text-green'
                          : 'text-muted hover:text-white'
                      }`}
                    >
                      Pipeline View
                    </button>
                  </div>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {fullName && (
                <span className="text-sm text-muted hidden sm:inline">{fullName}</span>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-muted hover:text-red-400 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className={`mx-auto px-4 sm:px-6 py-6 ${dashView === 'pipeline' && view !== 'detail' ? 'max-w-none' : 'max-w-7xl'}`}>
          {view === 'detail' ? (
            <ApplicationDetail id={selectedAppId} onBack={backToList} />
          ) : dashView === 'pipeline' ? (
            <KanbanBoard onCardClick={openDetailFromCard} />
          ) : (
            <ApplicationsList onReview={openDetail} />
          )}
        </main>
      </div>
    </ToastContext.Provider>
  )
}
