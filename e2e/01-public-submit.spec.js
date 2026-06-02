const { test, expect } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

// ── Test data ──────────────────────────────────────────────────────────────
// Loud markers so ops can find + delete the resulting Loandisk borrower.
const MARKER = {
  firstName: 'E2ETEST',
  lastName: 'AUTOMATED',
  mobile: '09000000000',
  email: 'e2e-automated@gr8-test.invalid',
  dob: '1990-01-01', // age ~36, passes 21–65
}

const FIX = f => path.join(__dirname, 'fixtures', f)
const ARTIFACT = path.join(__dirname, '.artifacts', 'submission.json')

// The 6 required document slots, in DOM order (file inputs 0–5).
const REQUIRED_DOC_FILES = [
  FIX('sample.png'), // Barangay Clearance
  FIX('sample.png'), // Valid ID Front
  FIX('sample.jpg'), // Valid ID Back
  FIX('sample.pdf'), // 3 Months Payslip
  FIX('sample.jpg'), // Certificate of Employment
  FIX('sample.png'), // Proof of Billing
]

test('public personal-loan submission reaches a terminal result on live prod', async ({ page }) => {
  // Capture the real backend response directly — more reliable than scraping the DOM.
  const submitResponse = page.waitForResponse(
    res => res.url().includes('/api/application/submit') && res.request().method() === 'POST',
    { timeout: 45_000 },
  )

  await page.goto('/apply/personal')

  // ── Step 1: Loan Details ──
  await expect(page.getByRole('heading', { name: 'Loan Details' })).toBeVisible()
  // Sales Officer dropdown loads from prod; pick the first real officer (index 1, after placeholder).
  const soSelect = page.locator('select').first()
  await expect
    .poll(async () => soSelect.locator('option').count(), { timeout: 15_000 })
    .toBeGreaterThan(1)
  await soSelect.selectOption({ index: 1 })
  // Purpose is the 2nd select on this step.
  await page.locator('select').nth(1).selectOption('Medical')
  await page.getByRole('button', { name: 'Continue' }).click()

  // ── Step 2: Personal Info ──
  await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible()
  await page.getByPlaceholder('Juan', { exact: true }).fill(MARKER.firstName)
  await page.getByPlaceholder('Dela Cruz').fill(MARKER.lastName)
  await page.locator('input[type="date"]').fill(MARKER.dob)
  await page.locator('select').first().selectOption('Single') // Civil Status
  await page.getByPlaceholder('09XXXXXXXXX').fill(MARKER.mobile)
  await page.getByPlaceholder('juan@email.com').fill(MARKER.email)
  await page.getByRole('button', { name: 'Continue' }).click()

  // ── Step 3: Present Address ──
  await expect(page.getByRole('heading', { name: 'Present Address' })).toBeVisible()
  await page.getByPlaceholder('123 Rizal St.').fill('123 E2E Test St.')
  await page.getByPlaceholder('Brgy. San Pablo').fill('Brgy. Automated')
  await page.getByPlaceholder('Malolos').fill('Malolos')
  await page.getByPlaceholder('Bulacan').fill('Bulacan')
  await page.getByPlaceholder('3000').fill('3000')
  await page.getByPlaceholder('e.g. 5 years').fill('5 years')
  await page.getByRole('button', { name: 'Continue' }).click()

  // ── Step 4: Permanent Address (same as present) ──
  await expect(page.getByRole('heading', { name: 'Permanent Address' }).first()).toBeVisible()
  await page.getByText('Same as present address').click()
  await page.getByRole('button', { name: 'Continue' }).click()

  // ── Step 5: Employment ──
  await expect(
    page.getByRole('heading', { name: 'Employment & Financial Information' }),
  ).toBeVisible()
  await page.locator('select').first().selectOption('Employee') // Employment Status
  await page.getByPlaceholder('Company name').fill('E2E Test Employer Inc.')
  await page.getByPlaceholder('15000').fill('25000') // above ₱15k min
  await page.getByPlaceholder('e.g. 3 years').fill('4 years')
  await page.getByRole('button', { name: 'Continue' }).click()

  // ── Step 6: Spouse (skip) ──
  await expect(page.getByRole('heading', { name: /Spouse/ })).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()

  // ── Step 7: Documents (6 required) ──
  await expect(page.getByRole('heading', { name: 'Document Upload' })).toBeVisible()
  const fileInputs = page.locator('input[type="file"]')
  await expect(fileInputs).toHaveCount(8) // 6 required + 2 optional
  for (let i = 0; i < REQUIRED_DOC_FILES.length; i++) {
    await fileInputs.nth(i).setInputFiles(REQUIRED_DOC_FILES[i])
  }
  await page.getByRole('button', { name: 'Continue' }).click()

  // ── Step 8: Review + confirm ──
  await expect(page.getByRole('heading', { name: 'Review Your Application' })).toBeVisible()
  for (const cb of await page.locator('input[type="checkbox"]').all()) {
    await cb.check()
  }
  await page.getByRole('button', { name: 'Submit Application' }).click()

  // ── Assert the live backend returned a valid terminal outcome ──
  const res = await submitResponse
  const body = await res.json()
  expect(res.status(), 'submit HTTP status').toBeLessThan(500)
  expect(['success', 'declined', 'error']).toContain(body.status)

  // Persist for the lifecycle chain (refId on success; marker always, for admin search).
  fs.mkdirSync(path.dirname(ARTIFACT), { recursive: true })
  fs.writeFileSync(
    ARTIFACT,
    JSON.stringify(
      { status: body.status, referenceId: body.referenceId || null, marker: MARKER },
      null,
      2,
    ),
  )

  if (body.status === 'success') {
    expect(body.referenceId, 'referenceId on success').toBeTruthy()
    await expect(page.getByRole('heading', { name: 'Application Received' })).toBeVisible()
    await expect(page.getByText(body.referenceId)).toBeVisible()
    console.log(`\n  ✅ SUCCESS — referenceId: ${body.referenceId}`)
  } else if (body.status === 'declined') {
    await expect(page.getByRole('heading', { name: 'Application Declined' })).toBeVisible()
    console.log(
      `\n  ⚠️  DECLINED (valid backend outcome) — reasons: ${(body.reasons || []).join('; ')}`,
    )
  } else {
    await expect(page.getByRole('heading', { name: 'Something Went Wrong' })).toBeVisible()
    console.log(`\n  ⚠️  ERROR — message: ${body.message}`)
  }
})
