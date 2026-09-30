import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import AdminTabBar from './AdminTabBar'
import { getInitials } from '../lib/applicantName'
import ReportProblemChat from './ReportProblemChat'

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  sales_officer: 'Sales Officer',
  verifier: 'Verifier',
  ci_officer: 'CI Officer',
  approver: 'Approver',
  loan_processing_officer: 'Loan Processing',
}

// Staff app shell: desktop hover rail, mobile drawer + floating tab bar, and the
// Report a Problem chat. Each portal passes its own nav items.
export default function AppShell({ navItems, showTabBar = true, children }) {
  const { logout, roles, fullName } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const isActive = item => item.match(location.pathname)
  // A single section needs no tab bar; the drawer still carries it.
  const hasTabBar = showTabBar && navItems.length > 1

  const themeIcon = isDark ? (
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
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  ) : (
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
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    </svg>
  )

  const signOutIcon = (
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
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
      />
    </svg>
  )

  const themeLabel = isDark ? 'Light Mode' : 'Dark Mode'
  const roleLabel = roles.map(r => ROLE_LABEL[r] || r).join(', ')

  // Shared by the desktop rail (collapsed until hover/focus) and the mobile drawer.
  const panel = (
    <>
      <div className="x-brand">
        <img src="/gr8logo.png" alt="GR8" />
        <span className="x-reveal x-brand-name">GR8 Lending</span>
      </div>

      <nav className="x-nav" aria-label="Admin">
        {navItems.map(item => {
          const active = isActive(item)
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path)
                setSidebarOpen(false)
              }}
              aria-label={item.locked ? `${item.label} (restricted)` : item.label}
              aria-current={active ? 'page' : undefined}
              title={item.locked ? `${item.label}: restricted to admins` : item.label}
              className={`x-nav-item${active ? ' is-active' : ''}${item.locked ? ' is-locked' : ''}`}
            >
              {item.icon}
              <span className="x-reveal">{item.label}</span>
              {item.locked && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="x-reveal x-nav-lock"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
              )}
            </button>
          )
        })}
        <button
          onClick={() => {
            setReportOpen(true)
            setSidebarOpen(false)
          }}
          aria-label="Report a Problem"
          title="Report a Problem"
          className={`x-nav-item${reportOpen ? ' is-open' : ''}`}
        >
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
              d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
            />
          </svg>
          <span className="x-reveal">Report a Problem</span>
        </button>
        <button
          onClick={toggleTheme}
          aria-label={themeLabel}
          title={themeLabel}
          className="x-nav-item"
        >
          {themeIcon}
          <span className="x-reveal">{themeLabel}</span>
        </button>
      </nav>

      <div className="x-sidebar-foot">
        <button
          onClick={handleLogout}
          aria-label="Sign Out"
          title="Sign Out"
          className="x-nav-item"
        >
          {signOutIcon}
          <span className="x-reveal">Sign Out</span>
        </button>
        <div className="x-user" title={`${fullName || 'Staff'} · ${roleLabel}`}>
          <span className="x-avatar">{getInitials(fullName, 'ST')}</span>
          <span className="x-reveal x-user-name">{fullName || 'Staff'}</span>
        </div>
      </div>
    </>
  )

  return (
    <div className={`x-shell min-h-screen bg-canvas flex ${isDark ? '' : 'light-mode'}`}>
      {/* Desktop rail — 56px stays in the layout; the panel widens over the content. */}
      <aside className="x-rail">
        <div className="x-sidebar">{panel}</div>
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && <div className="x-drawer-backdrop" onClick={() => setSidebarOpen(false)} />}
      <aside
        className={`x-sidebar x-drawer${sidebarOpen ? ' is-open' : ''}`}
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
      >
        {panel}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="x-topbar lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="x-icon-btn"
            aria-label="Open navigation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <img src="/gr8logo.png" alt="GR8" className="w-6 h-6" />
          <span className="x-brand-name">GR8 Lending</span>
        </header>

        {/* Page content */}
        <main className={`x-main flex-1${hasTabBar ? ' x-main--tabbar' : ''}`}>{children}</main>
      </div>

      {reportOpen && <ReportProblemChat onClose={() => setReportOpen(false)} />}

      {hasTabBar && (
        <AdminTabBar
          items={navItems}
          activeIndex={navItems.findIndex(isActive)}
          onSelect={item => navigate(item.path)}
        />
      )}
    </div>
  )
}
