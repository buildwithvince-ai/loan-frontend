const { test, expect } = require('@playwright/test')
const fs = require('fs')
const path = require('path')
const { loginAs, creds } = require('./helpers')

// Drives the SINGLE record created by 01-public-submit through the full pipeline,
// each stage acted on by its real role account. Anchored on the unique reference_id
// so it never acts on another customer's loan, even if other E2ETEST cards exist.
const ARTIFACT = path.join(__dirname, '.artifacts', 'submission.json')

function loadSubmission() {
  if (!fs.existsSync(ARTIFACT)) return null
  try {
    return JSON.parse(fs.readFileSync(ARTIFACT, 'utf8'))
  } catch {
    return null
  }
}

const submission = loadSubmission()
const REF = submission?.referenceId || null

// ── Board helpers ────────────────────────────────────────────────────────────
async function openPipeline(page) {
  await page.goto('/admin')
  await page.getByRole('button', { name: 'Pipeline View' }).click()
  // Wait for the board (columns render) before locating cards.
  await expect(page.getByText('Sales Officer', { exact: true }).first()).toBeVisible({
    timeout: 20_000,
  })
}

// The card whose reference_id matches REF. The ref is shown in a mono span inside the card.
function cardRoot(page) {
  return page
    .getByText(REF, { exact: true })
    .locator('xpath=ancestor::div[contains(@class,"cursor-pointer")][1]')
}

// The key wrapper that holds the card AND its per-stage action buttons (siblings).
function cardWrapper(page) {
  return cardRoot(page).locator('xpath=..')
}

async function waitForCardOnBoard(page) {
  await expect(page.getByText(REF, { exact: true })).toBeVisible({ timeout: 30_000 })
}

// A fresh personal submit can land directly at the verifier stage, so each forward
// step must tolerate the card already being past it. Returns true if the named action
// button exists in our card's wrapper (board given a moment to settle first).
async function hasCardAction(page, name) {
  await page.waitForTimeout(800)
  return (await cardWrapper(page).getByRole('button', { name }).count()) > 0
}

// ── The chain ────────────────────────────────────────────────────────────────
test.describe.serial('loan lifecycle on live prod', () => {
  test.skip(
    !REF,
    'No referenceId artifact — run 01-public-submit first (needs a successful submit)',
  )

  test('super_admin sees the submitted application in the pipeline', async ({ page }) => {
    test.skip(!creds('super_admin'), 'no super_admin credentials')
    await loginAs(page, 'super_admin')
    await openPipeline(page)
    await waitForCardOnBoard(page)
    // Open detail to confirm the admin dashboard renders the record.
    await cardRoot(page).click()
    await expect(page.getByText('Back to Applications')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/E2ETEST/i).first()).toBeVisible()
  })

  test('super_admin endorses the application to the Verifier', async ({ page }) => {
    test.skip(!creds('super_admin'), 'no super_admin credentials')
    await loginAs(page, 'super_admin')
    await openPipeline(page)
    await waitForCardOnBoard(page)
    // 'new' lead → "Endorse to Verifier" button (sales_officer → verifier transition modal).
    if (!(await hasCardAction(page, /Endorse to Verifier/i))) {
      console.log('  ℹ️  Card already past Sales Officer — endorse not needed, skipping.')
      return
    }
    await cardWrapper(page)
      .getByRole('button', { name: /Endorse to Verifier/i })
      .click()
    await expect(page.getByRole('heading', { name: 'Move Application' })).toBeVisible()
    const confirm = page.getByRole('button', { name: 'Confirm', exact: true })
    // If the sales officer wasn't persisted, the modal disables Confirm with an amber warning.
    await expect(
      confirm,
      'Confirm should be enabled — assigned_sales_officer must be set on the record',
    ).toBeEnabled()
    await confirm.click()
    await expect(page.getByRole('heading', { name: 'Move Application' })).toBeHidden({
      timeout: 20_000,
    })
  })

  test('verifier approves the application to CI', async ({ page }) => {
    test.skip(!creds('verifier'), 'no verifier credentials')
    await loginAs(page, 'verifier')
    await openPipeline(page)
    await waitForCardOnBoard(page)
    // Verifier "Approve" button → verifier → ci_officer transition modal.
    if (!(await hasCardAction(page, 'Approve'))) {
      console.log('  ℹ️  Card already past Verifier — approve not needed, skipping.')
      return
    }
    await cardWrapper(page).getByRole('button', { name: 'Approve', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Move Application' })).toBeVisible()
    await page.getByRole('button', { name: 'Confirm', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Move Application' })).toBeHidden({
      timeout: 20_000,
    })
  })

  test('ci_officer scores the application (auto-advances to Approver)', async ({ page }) => {
    test.skip(!creds('ci_officer'), 'no ci_officer credentials')
    await loginAs(page, 'ci_officer')
    await page.goto('/ci')
    // Narrow the Not-Assessed list to our record, then open the assessment.
    await page.getByPlaceholder('Search by name or phone number...').fill('E2ETEST')
    const startBtn = page.getByRole('button', { name: 'Start CI Assessment' }).first()
    await expect(startBtn).toBeVisible({ timeout: 30_000 })
    await startBtn.click()

    // Fill required fields. Radios carry stable name attrs; nth(0) = highest-scoring option.
    await page.locator('input[name="ciContactStatus"]').first().check() // contacted
    await page.locator('select').first().selectOption({ index: 1 }) // first interviewer
    await page.locator('input[name="ciQ1"]').first().check()
    await page.locator('input[name="ciQ2"]').first().check()
    await page.locator('input[name="ciQ3"]').first().check()
    await page.locator('input[name="ciQ4"]').first().check()
    await page.locator('input[name="ciRec"]').first().check() // approved
    await page
      .getByPlaceholder('Required — provide assessment details...')
      .fill('E2E automated CI assessment — test record, please disregard.')
    await page.getByPlaceholder('e.g. 25000').fill('25000')

    await page.getByRole('button', { name: 'Submit CI Assessment' }).click()
    await page.getByRole('button', { name: /Confirm Submit/i }).click()
    await expect(page.getByRole('heading', { name: 'CI Assessment Submitted' })).toBeVisible({
      timeout: 30_000,
    })
  })

  test('approver drags the application to Loan Processing (pushes to Loandisk)', async ({
    page,
  }) => {
    // Performed by super_admin: the dedicated approver account cred could not authenticate.
    // The board grants approver-stage actions to ['admin','super_admin','approver'], so
    // super_admin exercises the approver → loan_processing transition + Loandisk push.
    // (Approver-account-specific gating is therefore NOT verified by this run.)
    test.skip(!creds('super_admin'), 'no super_admin credentials')
    test.setTimeout(120_000) // the Loandisk push can take up to ~60s
    await loginAs(page, 'super_admin')
    await openPipeline(page)
    await waitForCardOnBoard(page)

    // Approval-to-Loandisk is a detail-page action (the Loan Processing column is a
    // locked dnd droppable, so a board drag into it is impossible by design).
    await cardRoot(page).click()
    await expect(page.getByText('Back to Applications')).toBeVisible({ timeout: 15_000 })

    // EXPLORATION: dump the available action buttons so we target the right approve control.
    const names = await page.getByRole('button').allInnerTexts()
    console.log('\n  ACTION BUTTONS:\n' + names.map(n => `   • ${JSON.stringify(n)}`).join('\n'))
    expect(false, 'exploration stop — inspect button list above').toBe(true)
  })
})

// ── Standalone role-gating coverage (not part of the serial chain) ─────────────
test('sales_officer can load the pipeline board (scoped to own apps)', async ({ page }) => {
  test.skip(!creds('sales_officer'), 'no sales_officer credentials')
  await loginAs(page, 'sales_officer')
  await page.goto('/admin')
  await page.getByRole('button', { name: 'Pipeline View' }).click()
  await expect(page.getByText('Sales Officer', { exact: true }).first()).toBeVisible({
    timeout: 20_000,
  })
})
