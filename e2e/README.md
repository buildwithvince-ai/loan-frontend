# E2E Tests (Playwright) — live prod

End-to-end tests that drive the real SPA (local vite dev server) against the **live prod
backend** at `loan-backend-production-cd45.up.railway.app`.

> ⚠️ **These write to production.** A public submit creates a real **Loandisk borrower**.
> The lifecycle chain transitions a real application through the pipeline. All suite-created
> records use loud markers (`E2ETEST AUTOMATED`, mobile `09000000000`) so ops can find +
> delete them. **Clean up after each run.**

## Setup

1. Playwright + chromium are already installed (`@playwright/test`, `npx playwright install chromium`).
2. Create `e2e/.env.e2e` (gitignored — never commit). Fill the credentials you have;
   leave a role blank to skip its steps:

   ```
   # Optional frontend base URL override (defaults to local vite dev server)
   # E2E_BASE_URL=http://localhost:5173

   SUPER_ADMIN_EMAIL=
   SUPER_ADMIN_PASSWORD=

   CI_OFFICER_EMAIL=
   CI_OFFICER_PASSWORD=

   SALES_OFFICER_EMAIL=
   SALES_OFFICER_PASSWORD=

   VERIFIER_EMAIL=
   VERIFIER_PASSWORD=

   APPROVER_EMAIL=
   APPROVER_PASSWORD=
   ```

## Run

```bash
npm run test:e2e              # all specs
npm run test:e2e:public       # public submit only (no creds needed)
npx playwright test --ui      # interactive UI mode
npx playwright show-report e2e/.report
```

## Specs

| File | Needs creds | What it covers |
|------|-------------|----------------|
| `01-public-submit.spec.js` | no | Personal loan form, 8 steps, 6 doc uploads → live submit. Asserts a valid terminal outcome (success/declined/error). Persists `referenceId` to `.artifacts/submission.json`. |
| `02-lifecycle.spec.js` | all 5 roles | Chained journey on the submitted record (anchored on its `referenceId`): super_admin opens it → endorse (auto-skips, fresh submits start at Verifier) → verifier approves → ci_officer scores (auto-advances to Approver) → approver drags to Loan Processing (real dnd-kit drag + Loandisk push). Plus a standalone sales_officer board check. |

> **Not idempotent.** The chain advances the record forward each run. Once a record is
> past a stage, re-running that step is auto-skipped — but the CI-scoring step expects an
> un-assessed record. To re-test the full chain, run `01-public-submit` first to create a
> fresh record, then `02-lifecycle`. To finish a single stuck step, run it in isolation:
> `npx playwright test 02-lifecycle -g "approver drags"`.

## Notes

- Single worker, no retries — never duplicate-submit or race prod state.
- `helpers.loginAs(page, role)` logs in through the real `/login` UI and asserts the JWT
  lands in `sessionStorage.gr8_token`.
- The pipeline flow is button-driven per role (Endorse / Verifier approve / CI form /
  Approver); @dnd-kit drag is the alternative and requires manual
  `mouse.down → move → up` steps (Playwright's `dragTo` does not trip its pointer sensor).
