# GR8 Lending — Approver Loan Terms UI [FRONTEND]

**Context:** Backend is being updated to support approver-editable loan terms (amount, duration, interest rate, payment scheme) with discount tracking and Loandisk integration. This frontend task builds the UI for approvers to configure these fields during loan approval.

This builds on / extends the in-progress Issue 3 work (Tier A approver editing loan amount and term). Treat this as the full approval form for loan terms — same screen, same submit flow, with all the fields below.

---

## Business Rules (from ops)

- **Standard interest rate:** 5% per month, flat rate, applied across full loan term.
- **Same default for all products:** Personal, SME, SBL, Group, AKAP — all default to 5%.
- **Discounts allowed:** Approvers can lower the rate to a minimum of 3% on a case-by-case basis.
- **Documented discount cases (SBL):** Treasurer of borrower group, Barangay Captain, Group Leader. Approver discretion for other cases.
- **Required when discounting:** A `discount_reason` must be captured. Approver cannot submit a rate below 5% without one.
- **Loan fees are fixed:** 5% Service Processing Fee + 1% Insurance Charges, both deducted from principal at disbursement. Borrower receives `principal - 6%`. Not editable by approver in this iteration.
- **Loan duration:** 3 to 24 months only.
- **Payment schemes by product:**
  - Personal, SME, SBL, Group → Monthly OR 15–30 (semi-monthly)
  - AKAP → Weekly only

---

## Fix

### 1. Loan Amount Field

In the Tier A approver view (existing Issue 3 work):

- Numeric input labeled **"Loan Amount (₱)"**.
- Display the SA's original applied value alongside for diff comparison.
- Format with thousands separators on display (e.g., ₱70,000.00).
- Validation: must be a positive number greater than zero.

### 2. Loan Duration Field

- Numeric input labeled **"Loan Duration (Months)"**.
- Min: `3`, Max: `24`. Step: `1`.
- Display the SA's original applied value alongside.
- Helper text: *"Between 3 and 24 months."*

### 3. Payment Scheme Dropdown

- Select dropdown labeled **"Payment Scheme"**.
- Options shown depend on the loan product:

| Product | Available Options | Default |
|---|---|---|
| Personal, SME, SBL, Group | Monthly, 15th & 30th | Monthly |
| AKAP | Weekly | Weekly (locked, no other choice) |

- For AKAP loans: render the dropdown as **read-only / disabled** showing "Weekly" (since it's the only valid option).
- Display the SA's original applied scheme alongside.
- On scheme change, automatically recalculate and update the **Number of Repayments** display (see section 6).

### 4. Interest Rate Field

- Numeric input labeled **"Interest Rate (% per month)"**.
- Default: `5`. Min: `3`. Max: `5`. Step: `0.25`.
- Display helper text: *"Standard rate is 5%. Lower rates require a discount reason."*
- Show the SA's original applied rate alongside (will also default to 5%).

### 5. Conditional Discount Reason Field

- When `interest_rate < 5`, reveal a textarea labeled **"Discount Reason (required)"**.
  - Placeholder: *"e.g., Borrower is SBL group treasurer / Barangay Captain endorsement / Group leader discount"*
  - Min length: 10 characters (prevents single-word entries).
  - Max length: 500 characters.
  - Required when shown — block submit until filled.
- When `interest_rate === 5`, hide the field and clear any previously entered value from form state (so a discount reason isn't accidentally submitted on a non-discounted loan).

### 6. Live Loan Summary Panel

Below the form fields, show a **read-only summary panel** that updates live as the approver changes any input. This is the most important part of the screen — it makes the financial impact of every decision visible before approval.

Display:

```
LOAN SUMMARY
─────────────────────────────────────
Principal:                   ₱70,000.00
Service Processing Fee (5%): ₱3,500.00
Insurance Charges (1%):      ₱700.00
─────────────────────────────────────
Net Disbursement to Borrower: ₱65,800.00

Total Interest:              ₱42,000.00
Total Repayment:             ₱112,000.00
Number of Repayments:        12 (Monthly)
Repayment Amount:            ₱9,333.33 / month
```

**Calculations:**
- `service_fee = principal × 0.05`
- `insurance_fee = principal × 0.01`
- `net_disbursement = principal - service_fee - insurance_fee`
- `total_interest = principal × (rate/100) × duration_months`
- `total_repayment = principal + total_interest`
- `num_repayments`:
  - Monthly → `duration_months`
  - 15–30 (semi-monthly) → `duration_months × 2`
  - Weekly (AKAP) → `min(duration_months × 4, 24)`
- `repayment_amount = total_repayment / num_repayments`

**Formatting:**
- All currency values: thousands separators, 2 decimal places, ₱ prefix.
- Repayment amount: same formatting + suffix indicating frequency (`/ month`, `/ semi-monthly`, `/ week`).
- Use the same number formatting helper that's used elsewhere in the app — don't roll a new one.

**Why this matters:** An approver lowering the rate from 5% to 4% on a ₱100,000 / 12-month loan needs to see they're giving up ₱12,000 in interest. The summary creates honest friction without being obstructive.

### 7. Submit Flow Integration with Issue 3

The existing Issue 3 logic (compare approver values vs SA original values, route to `pending_sa_confirmation` if changed) extends to all four editable fields:

- If approver's `loan_amount`, `loan_duration`, `interest_rate`, OR `payment_scheme` differs from the SA's submitted value → trigger SA confirmation flow.
- The diff display in the SA confirmation email/banner must include all four fields with original vs modified values.
- Discount reason (if present) must be visible to the SA in the confirmation view so they understand why the rate was lowered.

### 8. Validation Summary

Submit button stays disabled until:
- `loan_amount` is a positive number
- `loan_duration` is between 3 and 24 (inclusive)
- `payment_scheme` is valid for the product
- `interest_rate` is between 3 and 5 (inclusive)
- If `interest_rate < 5`, `discount_reason` is at least 10 characters
- All other Issue 3 validations pass

On submit attempt with invalid state, show inline errors next to the offending field — don't use generic toast errors.

---

## Backend Contract

The approval submit endpoint payload should include:

```json
{
  "loan_amount": 70000,
  "loan_duration": 12,
  "payment_scheme": "monthly",
  "interest_rate": 5,
  "discount_reason": null
}
```

`payment_scheme` values: `"monthly"` | `"semi_monthly_15_30"` | `"weekly"`
`discount_reason` is required if `interest_rate < 5`, null otherwise.

Backend will:
- Validate ranges and discount reason presence.
- Calculate fees, interest, and repayments server-side as the source of truth.
- Persist both the SA's original values and the approver's values.
- Pass through to the Loandisk `add_loan` flow on final approval.

---

## Testing Requirements

**Default state:**
- Personal loan, ₱70,000 / 12 months / Monthly / 5% → summary shows ₱65,800 net, ₱42,000 interest, ₱112,000 total, ₱9,333.33/month, 12 repayments.

**Payment scheme switching:**
- Switch from Monthly to 15–30 on a 12-month loan → repayments updates to 24, repayment amount halves.
- Try to set AKAP to Monthly → should be impossible (dropdown locked to Weekly).

**Interest rate + discount:**
- Lower rate to 4.5: discount reason field appears, submit blocked until reason entered.
- Lower rate to 4.5, enter reason, then raise rate back to 5: discount reason field hides AND the value is cleared from form state.
- Try to submit rate of 2 or 6: blocked with inline validation error.
- Try to submit rate of 4 with empty discount reason: blocked.
- Try to submit rate of 4 with 5-character discount reason: blocked (min 10 chars).

**Live summary:**
- 70,000 principal × 5% × 12 months = ₱42,000 total interest, ₱112,000 total repayment (matches the production sample loan from Loandisk).
- 70,000 × 5% fee = ₱3,500, 70,000 × 1% insurance = ₱700, net = ₱65,800.
- AKAP weekly cap: 12-month AKAP loan should show 24 repayments, not 48 (cap behavior).

**Diff flow:**
- Change rate from 5 to 4.5 → submit → verify the Issue 3 SA confirmation modal triggers and shows the rate change in the diff alongside any other modified fields.

**Edge cases:**
- 3-month loan: minimum duration accepted, all calculations work.
- 24-month loan: maximum duration accepted, all calculations work.
- 25-month attempt: blocked.
- AKAP 6-month weekly: shows 24 repayments (6×4=24 exactly).
- AKAP 12-month weekly: shows 24 repayments (12×4=48, capped at 24). Display a small note: *"AKAP loans are capped at 24 weekly repayments."*

---

## Notes

- Reuse existing form components (numeric input, textarea, select) from the codebase. Don't introduce new form libraries.
- Match the styling of existing form fields — same spacing, label styles, helper text patterns.
- The Loan Summary panel should visually distinguish itself from the input fields (subtle background tint, border, or card styling) so it reads as output not input.
- Keep the form layout sensible on mobile — the summary panel should stack below inputs on narrow screens, not float beside them.
- Calculation logic should live in a shared helper (e.g., `lib/loanCalculations.js`) so it can be unit-tested independently and matches backend logic exactly. If the backend exposes a `/calculate-loan-preview` endpoint, prefer calling that over duplicating the math — single source of truth.

---

## Out of Scope

- Backend validation and persistence (separate task — see BLOCKER.md).
- Fee override capability (fees are fixed in this iteration).
- Disbursement method UI (handled manually by ops, not part of this system).
- Reporting on discount frequency (future ops dashboard work).
- New Loan vs Renewal selector on the application form (separate task — Issue 1 from the earlier batch).
