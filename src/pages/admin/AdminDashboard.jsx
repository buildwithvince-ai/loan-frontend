import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import ApplicationsList from './ApplicationsList'
import ApplicationDetail from './ApplicationDetail'

const API_BASE = 'https://loan-backend-production-cd45.up.railway.app/api/admin'
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || ''

// Toast context
const ToastContext = createContext()
export const useToast = () => useContext(ToastContext)

// Admin API helper
export function adminFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': ADMIN_SECRET,
      ...options.headers,
    },
  })
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

// Login screen
function AdminLogin({ onLogin }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (code === ADMIN_SECRET) {
      localStorage.setItem('admin_authenticated', 'true')
      onLogin()
    } else {
      setError('Invalid access code')
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-2xl p-8">
          <div className="text-center mb-8">
            <img src="/gr8logo.png" alt="GR8 Lending" className="w-16 h-16 mx-auto mb-4 opacity-80" />
            <h1 className="text-2xl font-bold text-white">Admin Access</h1>
            <p className="text-muted text-sm mt-1">Staff-only area</p>
          </div>
          <form onSubmit={handleSubmit}>
            <label className="block text-sm text-muted mb-2">Enter admin access code</label>
            <input
              type="password"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError('') }}
              className="w-full bg-surface-alt border border-border rounded-lg px-4 py-3 text-white focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none"
              placeholder="Access code"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              className="w-full mt-4 bg-green hover:bg-green-hover text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem('admin_authenticated') === 'true'
  )
  const [view, setView] = useState('list') // 'list' | 'detail'
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

  const backToList = () => {
    setView('list')
    setSelectedAppId(null)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated')
    setAuthenticated(false)
  }

  if (!authenticated) {
    return <AdminLogin onLogin={() => setAuthenticated(true)} />
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
                    view === 'list'
                      ? 'bg-surface-alt text-green'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  Applications
                </button>
              </nav>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-muted hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {view === 'list' ? (
            <ApplicationsList onReview={openDetail} />
          ) : (
            <ApplicationDetail id={selectedAppId} onBack={backToList} />
          )}
        </main>
      </div>
    </ToastContext.Provider>
  )
}
