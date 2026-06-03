const { expect } = require('@playwright/test')

// Maps a logical role to its env var pair in e2e/.env.e2e (loaded by playwright.config.js).
const ROLE_ENV = {
  super_admin: ['SUPER_ADMIN_EMAIL', 'SUPER_ADMIN_PASSWORD'],
  ci_officer: ['CI_OFFICER_EMAIL', 'CI_OFFICER_PASSWORD'],
  sales_officer: ['SALES_OFFICER_EMAIL', 'SALES_OFFICER_PASSWORD'],
  verifier: ['VERIFIER_EMAIL', 'VERIFIER_PASSWORD'],
  approver: ['APPROVER_EMAIL', 'APPROVER_PASSWORD'],
}

/**
 * Returns { email, password } for a role, or null if creds are not configured.
 * Lets specs skip role-gated steps cleanly instead of failing on missing secrets.
 */
function creds(role) {
  const pair = ROLE_ENV[role]
  if (!pair) throw new Error(`Unknown role: ${role}`)
  const email = process.env[pair[0]]
  const password = process.env[pair[1]]
  if (!email || !password) return null
  return { email, password }
}

/**
 * Logs in through the real /login UI as the given role and waits for the
 * post-login redirect. Asserts the JWT landed in sessionStorage.
 * Throws if creds for the role are missing (call creds(role) first to skip).
 */
async function loginAs(page, role) {
  const c = creds(role)
  if (!c) throw new Error(`Missing credentials for role "${role}" in e2e/.env.e2e`)
  await page.goto('/login')
  await page.getByPlaceholder('you@company.com').fill(c.email)
  await page.getByPlaceholder('••••••••').fill(c.password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  // Login redirects to /admin (most roles) or /ci (ci_officer). Either way we leave /login.
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 15_000 })
  const token = await page.evaluate(() => sessionStorage.getItem('gr8_token'))
  expect(token, `JWT should be set after ${role} login`).toBeTruthy()
  return token
}

module.exports = { ROLE_ENV, creds, loginAs }
