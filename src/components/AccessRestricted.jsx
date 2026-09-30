import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABEL } from '../constants/roles'

// Shown in place of a page the signed-in role can't open. Follows the common
// "you don't have access" pattern: say what's restricted, who has it, how to get it.
export default function AccessRestricted({
  feature,
  allowedRoles,
  homePath = '/admin',
  homeLabel = 'Applications',
}) {
  const { roles, fullName } = useAuth()
  const navigate = useNavigate()
  const allowed = allowedRoles.map(r => `${ROLE_LABEL[r] || r}s`).join(' and ')
  const yours = roles.map(r => ROLE_LABEL[r] || r).join(', ') || 'no role'

  return (
    <div className="px-4 sm:px-6 py-10 x-rise">
      <section
        className="x-panel max-w-lg mx-auto px-6 py-10 sm:px-10 text-center"
        aria-labelledby="access-title"
      >
        <div className="w-14 h-14 mx-auto mb-5 rounded-full x-skel flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-6 h-6 text-muted"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>
        <p className="x-caption">Access restricted</p>
        <h1 id="access-title" className="mt-2 text-white font-medium text-xl leading-tight">
          You don&apos;t have access to {feature}
        </h1>
        <p className="mt-3 text-muted text-sm leading-relaxed">
          {feature} is available to {allowed} only. You&apos;re signed in as{' '}
          <span className="text-white">{fullName || 'this account'}</span> ({yours}).
        </p>
        <p className="mt-2 text-muted text-sm leading-relaxed">
          If you need it for your work, ask an administrator to update your role.
        </p>
        <button onClick={() => navigate(homePath)} className="x-btn x-btn--primary mt-7">
          Back to {homeLabel}
        </button>
      </section>
    </div>
  )
}
