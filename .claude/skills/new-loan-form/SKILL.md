---
name: new-loan-form
description: Scaffold a new multi-step loan application form matching the 5 existing forms (state shape, per-step validation, shared UI helpers, slider+typable amount, FormData submit). Invoke when adding a new loan product form.
disable-model-invocation: true
---

# New Loan Form Scaffold

Use this to add loan form #6+ without copy-paste drift. The canonical template is
`src/pages/PersonalLoanForm.jsx` — it has the cleanest full structure. **Read it first**, then adapt.

## Inputs to collect before writing
1. **Loan type slug** (e.g. `vehicle`) → route `/apply/<slug>`, `fd.append('loanType', '<slug>')`.
2. **Amount range** — min, max, step.
3. **Terms** (months array, e.g. `[6, 12, 24]`).
4. **Min income**.
5. **Required + optional documents** (key + label list).
6. **Repayment schedule** + monthly rate (for the review step / disclosures).

## Steps to produce
1. Copy `PersonalLoanForm.jsx` structure: `initialForm`, per-step `StepN` components, `set` helper, validation per step, submit handler, result modal.
2. Swap in: `TOTAL_STEPS`, `TERMS`, amount min/max/step, `REQUIRED_DOCS` / `OPTIONAL_DOCS`, `MAX_FILE_SIZE` stays `10 * 1024 * 1024`.
3. Amount field = **slider + typable textbox**, clamped + onBlur rounded. Never card grids / preset tiles.
4. Submit: build `FormData`, prefer `import.meta.env.VITE_API_BASE_URL` for the base URL (not the hardcoded literal the older forms use), POST `/api/application/submit`.
5. Register the route in `src/App.jsx`.
6. Add a product card in `src/pages/SelectProduct.jsx` and `src/components/LoanProducts.jsx`.
7. Update `CLAUDE.md` "Loan Products Summary" + memory `project_loan_products`.

## Must match (see project-conventions skill)
- JS only, no semicolons, single quotes, `default export`.
- Shared UI helpers (`Label`/`Input`/`Select`/`FieldError`/`DocumentUpload`) defined **in-file**, not imported.
- Reuse `useSalesOfficers` hook and `BorrowerLookup` component for SO selection / borrower linking if the product needs them.

## Verify before done
- Each step's validation blocks "Next" on bad input; Back preserves data.
- Amount clamps to min/max; income check enforces the product minimum.
- Mobile `^09\d{9}$`, age 21–65, email regex all wired.
- Build passes: `npm run build`.
