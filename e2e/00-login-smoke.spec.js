const { test } = require('@playwright/test')
const { loginAs, creds } = require('./helpers')

// Validates each role's credentials independently before the lifecycle chain runs,
// so an auth failure is never mistaken for a flow bug.
for (const role of ['super_admin', 'ci_officer', 'sales_officer', 'verifier', 'approver']) {
  test(`login works: ${role}`, async ({ page }) => {
    test.skip(!creds(role), `no credentials for ${role}`)
    await loginAs(page, role)
  })
}
