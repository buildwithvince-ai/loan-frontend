# Project: GR8 Lending Corporation — Loan Application Frontend

## Project Overview
Online loan application system for GR8 Lending Corporation, a lending company based in
Malolos, Bulacan, Philippines. This is the frontend that collects borrower information
and submits it to the backend API. Includes a staff admin dashboard and CI (Credit
Investigation) portal.

## Live URL
https://gr8lendingcorporation.com

## Hosting
- **Frontend:** Cloudflare Pages (client account), custom domain with Cloudflare SSL
- **Backend:** Railway — https://loan-backend-production-cd45.up.railway.app

## Tech Stack
- React 19 (JavaScript, NOT TypeScript)
- Tailwind CSS 4
- Vite 6
- React Router DOM 7
- No state management library — React hooks only (useState, useEffect, useRef, useContext)

## Backend API
- Base URL: `https://loan-backend-production-cd45.up.railway.app`
- Public: `POST /api/application/submit` (multipart/form-data)
  - Response: `{ status: 'success'|'declined'|'error', referenceId?, reasons?, message? }`
- Admin: `GET/POST /api/admin/applications[/:id]` — requires `Authorization: Bearer <JWT>` header
- CI: `GET/POST /api/ci/applications[/:id]` — requires `Authorization: Bearer <JWT>` header
- Auth: JWT-based via `AuthContext` (`useAuth().getToken`), multi-role (`hasRole`/`hasAnyRole`).
  `adminFetch`/`ciFetch`/`pipelineFetch` attach the Bearer token automatically.

## Environment Variables
- `VITE_API_BASE_URL` — Backend base URL (falls back to Railway URL if unset)
- `VITE_SUPABASE_URL` — Supabase project URL (file storage / signed URLs)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key

## Pages & Routes

### Public
- `/` — Landing page (Hero, LoanProducts, LoanCalculator, HowItWorks, TrustSignals)
- `/apply` — SelectProduct (choose from 5 loan types)
- `/apply/personal` — Personal Loan form (9 steps)
- `/apply/sme` — SME Loan form (10 steps)
- `/apply/akap` — AKAP Loan form (8 steps)
- `/apply/group` — Group Loan form (3 steps)
- `/apply/sbl` — SBL form (3 steps)

### Admin (no navbar/footer, JWT-protected via AuthContext)
- `/admin` — AdminDashboard → ApplicationsList + ApplicationDetail

### CI Portal (no navbar/footer, JWT-protected via AuthContext)
- `/ci` — CiPortal → CiApplicationsList + CiAssessmentForm

## Key File Paths

### Config & Entry
- `vite.config.js` — Vite + React + Tailwind plugins
- `src/main.jsx` — React entry point (BrowserRouter)
- `src/App.jsx` — All route definitions
- `src/index.css` — Design tokens (@theme), animations, custom form styles
- `public/_redirects` — SPA routing for Cloudflare/Netlify
- `public/gr8logo.png` — Brand logo
- `public/fonts/` — Method font family (Light through Black)

### Components (Landing Page)
- `src/components/Navbar.jsx` — Fixed header with mobile hamburger
- `src/components/Hero.jsx` — Hero section with floating orbs, stats grid
- `src/components/LoanProducts.jsx` — 5 product cards with apply links
- `src/components/LoanCalculator.jsx` — Tabbed calculator with slider + typable input
- `src/components/HowItWorks.jsx` — 3-step flow
- `src/components/TrustSignals.jsx` — 3 trust cards
- `src/components/Footer.jsx` — 4-column footer with contact info
- `src/pages/LandingPage.jsx` — Composes all landing sections

### Application Forms
- `src/pages/SelectProduct.jsx` — Product picker (all 5 loans)
- `src/pages/PersonalLoanForm.jsx` — ₱10K–₱30K, 3/6/12 months, min income ₱15K
- `src/pages/SmeLoanForm.jsx` — ₱50K–₱300K, 3/6/12/24 months, min income ₱30K
- `src/pages/AkapLoanForm.jsx` — ₱5K–₱40K, 3/4/5/6 months, min income ₱10K
- `src/pages/GroupLoanForm.jsx` — ₱10K–₱50K, 3/6/12 months, multi-member (leader + 3)
- `src/pages/SblLoanForm.jsx` — ₱5K–₱100K, 6/12 months, Barangay Officials only

### Admin Dashboard
- `src/pages/admin/AdminDashboard.jsx` — Auth gate, layout, exports `adminFetch`
- `src/pages/admin/ApplicationsList.jsx` — Filterable table (status, type, search)
- `src/pages/admin/ApplicationDetail.jsx` — Full application review + approve/decline
- `src/pages/admin/CiScoringForm.jsx` — Inline CI scoring from admin view
- `src/pages/admin/scoring.js` — normalizeFinScore, computeFinalScore, getTier, TIER_CONFIG

### CI Portal
- `src/pages/ci/CiPortal.jsx` — Auth gate, layout, exports `ciFetch`
- `src/pages/ci/CiApplicationsList.jsx` — Not Assessed / Assessed split view
- `src/pages/ci/CiAssessmentForm.jsx` — Full CI scoring form with question matrices

## Loan Products Summary

| Product | Amount | Terms | Rate/mo | Min Income | Repayment |
|---------|--------|-------|---------|------------|-----------|
| Personal | ₱10K–₱30K | 3, 6, 12 mo | 3.5% | ₱15K | Bimonthly |
| SME | ₱50K–₱300K | 3, 6, 12, 24 mo | 3% | ₱30K | Monthly w/ PDCs |
| AKAP | ₱5K–₱40K | 3, 4, 5, 6 mo | 4% | ₱10K | Weekly |
| Group | ₱10K–₱50K | 3, 6, 12 mo | 5% | ₱15K | Bimonthly |
| SBL | ₱5K–₱100K | 6, 12 mo | 5% | ₱2K | Monthly |

## Design System
- **Theme:** Dark navy/slate background, green primary, blue secondary
- **Colors:** canvas `#0A0F1E`, surface `#111827`, surface-alt `#1A2235`, green `#5CB85C`, blue `#5BC0DE`, muted `#94A3B8`, border `#1E2D45`
- **Font:** Method (custom, loaded from `/public/fonts/`)
- **Mobile-first**, breakpoints: sm (640), md (768), lg (1024)
- **Animations:** fadeInUp, slideInLeft/Right, scaleIn, shimmer (gradient text), float (orbs)

## Conventions & Patterns

### File Organization
- One component per file, default export
- Pages in `src/pages/`, components in `src/components/`
- Admin files in `src/pages/admin/`, CI files in `src/pages/ci/`
- No TypeScript — all `.jsx` and `.js` files

### Form Pattern (all 5 loan forms follow this)
- State: `useState` for `form`, `docs`, `errors`, `step`, `result`, `submitting`
- Each step is a separate function component (`Step1`, `Step2`, etc.)
- Per-step validation before advancing
- Back button preserves data
- Slider + typable number input for loan amount (synced, clamped to min/max)
- "Same as present address" checkbox for permanent address
- Document upload: JPG/PNG/PDF, 5MB max, drag-drop zone
- Submit builds `FormData`, POSTs to backend, shows result modal

### Shared UI Components (defined per form, not extracted)
- `Label`, `Input`, `Select`, `FieldError`, `DocumentUpload`
- `formatPeso(n)`, `getAge(dob)`, `validMobile(v)`, `validEmail(v)`

### API Pattern
- `adminFetch(path)` — prepends admin base URL + attaches `Authorization: Bearer <JWT>`
- `ciFetch(path)` — prepends CI base URL + attaches `Authorization: Bearer <JWT>`
- `pipelineFetch(path)` — prepends `/api/pipeline` base URL + attaches `Authorization: Bearer <JWT>`
- Token comes from `AuthContext` (`useAuth().getToken`); all three are built by `buildFetch` in `AdminDashboard.jsx`
- Public forms: direct `fetch()` to backend URL (no auth)

### Scoring System
- FinScore: raw 300–999 normalized to 0–100
- CI Score: 0–50 from field assessment
- Final Score: 50/50 weighted average of normalized FinScore + CI total
- Tiers: ≥85 approved, 70–84 tier_b, <70 declined

## Validation Rules
- Age: 21–65 years old (from DOB)
- Mobile: Philippine format `09XXXXXXXXX` (regex: `/^09\d{9}$/`)
- Email: standard email regex
- Income: must meet minimum per product
- Loan amount: must be within min/max per product

## Key Notes
- `borrower_description` field in Loandisk stores personal references as formatted text
- `borrower_business_name` is a native Loandisk field
- Barangay is a required field (maps to `custom_field_26904` in Loandisk)
- Group/SBL forms support leader + up to 3 members with individual doc uploads
- SBL is restricted to elected/appointed Barangay Officials
- Watermark: Fixed gr8logo.png at 4% opacity behind all public pages

## Skills & Guidelines
Read and strictly follow all instructions in these files before writing any code:

- ~/Desktop/frontend-design/SKILL.md
- ~/Desktop/frontend-patterns/SKILL.md
- ~/Desktop/continuous-learning-v2/SKILL.md

## Session Log — 2026-06-02
- Built: CI address fields (House/Unit Number, Street Name/Number — required, inline-validated),
  Payment Frequency dropdown (one_time/two_times), Salary Payout 1–31 calendar picker, read-only
  Repayment Cycle (derived), and Approver-stage Loan Release Date (required, gates Approve button).
  Added across all 3 CI surfaces (CI Portal form, admin CI scoring form, post-submit read-only view).
- New files: `src/lib/repaymentCycle.js` (deriveRepaymentCycle), `src/components/ci/SalaryPayoutPicker.jsx`.
- Payload: CI submit now sends `payment_frequency`, `salary_payout_dates` (int[]), `repayment_cycle`
  (nested in `ci_form_data` + flat in PATCH body); approve sends `loan_release_date` (ISO string).
- Decisions made: Extracted only the stateful payout picker to a shared component; kept Payment
  Frequency select + address inputs inline per form. Loan Release Date wired to DecisionSection
  `/approve` body (not the board TransitionModal). CI scoring form role-gated to
  ci_officer/approver/super_admin in ApplicationDetail.
- Assumptions introduced:
  - [ASSUMPTION] Part 7 "editable by Approver/Super Admin" = editable while app sits in CI stage
    (before CI submit). After submission the form is read-only by existing architecture.
  - [ASSUMPTION] New CI fields stored nested in `ci_form_data` AND flat in PATCH body (mirrors
    existing ci_recommendation dual-send) — backend support for these keys is UNVERIFIED.
  - [ASSUMPTION] Extracting the payout picker deviates from "components defined per form, not
    extracted" — justified because duplicating stateful selection logic is a correctness risk.
- Scope candidates deferred:
  - [SCOPE CANDIDATE] Board "Approve & Process" (TransitionModal approver→loan_processing) is a
    SECOND path to Loandisk that does NOT collect/require Loan Release Date. Part 5's gate only
    covers the ApplicationDetail approve.
- Open items / next session: Verify backend persists the 4 new keys (may silently drop unknown
  keys). Manual UAT of picker on 375px mobile.

## Session Log — 2026-06-03
- Built: AKAP/SME gating for the salary-payout feature (Parts 2–4). Added `isAkap` +
  `hidePayout = isAkap || isSme` to both editable CI surfaces (`CiAssessmentForm`, `CiScoringForm`).
  When hidePayout: the Payment Frequency + Salary Payout Date Picker block is hidden, its
  validation is skipped, and `payment_frequency`/`salary_payout_dates`/`repayment_cycle` are
  omitted from BOTH `ci_form_data` and the flat PATCH body (conditional spread). CiScoringForm
  read-only summary (`CiFormReadOnly`) drops the 3 payout rows when `loan_product` is akap/sme
  (gated on `hidePayoutRO`).
- Verified (FOUND, no change): Parts 1–6 + Loan Release Date all pre-existed from 2026-06-02.
  Address fields required+inline-validated on both CI surfaces. Part 7 role gate intact —
  `canScoreCi = hasAnyRole(['ci_officer','approver','super_admin'])` (ApplicationDetail.jsx:1916)
  wraps editable CiScoringForm vs read-only CiFormReadOnly. Loan Release Date required for ALL
  types incl. AKAP/SME at approver stage (correctly NOT gated). Grep confirmed the kanban board /
  transition modals render none of these fields, so they need no gating.
- Decisions made: Payload omits the 3 keys entirely for AKAP/SME (vs sending nulls) — matches
  Part 6 "skip" wording. Read-only rows null-filtered out (existing `.filter(f => f !== null)`).
- Assumptions introduced: none beyond 2026-06-02's. Backend persistence of the keys still UNVERIFIED.
- Open items / next session: Manual UAT — confirm AKAP & SME apps show no payout UI and still
  submit; confirm Personal/Group/SBL unchanged. Backend key persistence still unverified.

## Session Log — 2026-06-03 (SBL honorarium date)
- Built: SBL now skips the salary payout block (payment frequency + multi-date picker) and shows a
  single **required** Honorarium Date field (day-of-month 1–31). Applied to both editable CI
  surfaces (`CiAssessmentForm`, `CiScoringForm`) and the admin read-only summary (`CiFormReadOnly`).
  Folded SBL into `hidePayout` (`isAkap || isSme || isSbl`) so the salary block + its 3 payload keys
  (`payment_frequency`/`salary_payout_dates`/`repayment_cycle`) are dropped for SBL; added
  `honorarium_date` (int) sent nested in `ci_form_data` AND flat in the `/ci-score` PATCH body, gated
  on `isSbl`. Read-only drops the 3 salary rows for SBL (`hidePayoutRO` now includes sbl) and adds an
  "Honorarium Date" row.
- Reused the shared `SalaryPayoutPicker` with two new additive props: `hideCycle` (suppress the
  derived Repayment Cycle box) and `helperText` (override). SBL honorarium passes `frequency="one_time"`
  + `hideCycle`. Defaults preserve existing salary-block behavior (verified: build green, 2 salary
  callers unchanged).
- Decisions made: `repayment_cycle` is intentionally dropped for SBL (SBL is monthly-fixed; backend
  ignores SBL salary fields). Honorarium stored as a single day-of-month int, not an ISO date — matches
  SBL monthly honorarium cycle and reuses existing picker infra (operator-confirmed).
- Assumptions introduced:
  - [ASSUMPTION] Honorarium key is `honorarium_date`, value = day-of-month int (1–31). Relayed from
    backend, operator-confirmed; UNVERIFIED until first real SBL submit (wrong key = silent drop +
    server-side required failure). Commented at the `hidePayout` definition in both forms.
- Scope candidates deferred: none. Backend confirmed SBL may keep sending salary fields (ignored), so
  no public `SblLoanForm` change needed — this is CI-surface only.
- Open items / next session: Verify backend persists `honorarium_date` on first real SBL CI submit.
  Manual UAT on 375px — SBL shows Honorarium block (no freq dropdown, no Repayment Cycle box), required
  gate fires when unset; confirm Personal/Group still show full salary block unchanged.

## Session Log — 2026-06-10
- Built: Interest rate locked at 5%/month UI-side to match backend commit afb8d96 (backend clamps
  /approve + /confirm-terms interest_rate into 5..5 band). `src/lib/loanCalculations.js`: removed
  `DEFAULT_RATE_BY_TYPE` (personal 3.5 / sme 3.0 / akap 4.0 / group 5.0 / sbl 5.0), added
  `LOCKED_INTEREST_RATE = 5`; `defaultRate()` now returns 5 unconditionally (signature kept so the
  SA-confirmation caller is unchanged). `ApplicationDetail.jsx` DecisionSection: rate is no longer
  state — editable number input replaced with display-only "5% / month" box; Discount Reason
  textarea, its state, validation (3–5 band + min-10-chars), and `discount_reason` payload key all
  removed. Approve body now sends `interest_rate: LOCKED_INTEREST_RATE`.
- Decisions made: Kept `hasDiff()` rate comparison against `app.interest_rate || 5` — old apps with
  a stored sub-5 rate correctly trigger the "Modified Loan Terms → send to SA" confirmation, since
  approval genuinely changes their rate to 5. Historical `app.discount_reason` display in the SA
  confirmation read-only section left intact (shows past data, not an input).
- Assumptions introduced: none — backend behavior stated in work order (clamp, default 5).
- Scope candidates deferred:
  - [SCOPE CANDIDATE] Public-facing rates NOT updated: `LoanCalculator.jsx` PRODUCTS still uses
    0.035/0.03/0.04 for Personal/SME/AKAP, and the CLAUDE.md Loan Products table + product cards
    still advertise 3.5%/3%/4%. With backend locked at 5%, public calculator quotes understate real
    repayment. Needs operator decision (marketing copy), not silently changed.
- Open items / next session: Manual UAT — approve dialog shows fixed "5% / month", Loan Summary
  computes with 5%, old sub-5-rate apps show "Rate: X% → 5%" in the modified-terms modal.

## Session Log — 2026-06-10 (confirm-terms flow change)
- Built: UI updates for backend commit 713f480 — confirm-terms no longer pushes to Loandisk; it
  adopts proposed amount/term as official loan_amount/loan_term and returns the app to pending @
  approver. Changes: (1) SA confirm toast now says "returned to Approver for final approval"
  (was "proceeding to Loandisk"); (2) ActivityLog renders `stage_history` entries of type
  'sa_confirmation' (shows meta.confirmed_amount/confirmed_term) and 'sa_rejection' (shows note);
  (3) DecisionSection now keyed on `${status}-${loan_amount}-${loan_term}` so adjusted-terms
  useState re-seeds after confirm-terms adopts new values — without this, stale inputs re-trigger
  the modified-terms → SA loop on same-session approve.
- Verified (no change needed): handleConfirm already sends an empty PATCH body, so
  interest_rate/payment_scheme_id/discount_reason removal (item 4) was already satisfied;
  loan_release_date override not sent. Final approve path unchanged — sends adjusted_* seeded
  from adopted values, hasDiff() false → normal approve → Loandisk push.
- Assumptions introduced:
  - [ASSUMPTION] stage_history entry timestamp field unknown — reads `at || timestamp ||
    created_at` defensively; date hidden if none match. Rejection note read from `note ||
    meta.note`.
- Scope candidates deferred: none.
- Open items / next session: Verify stage_history field names against a real sa_confirmation
  entry. UAT full loop: approver modifies terms → SA confirms → app back at pending/approver
  with adopted terms → normal Approve pushes to Loandisk.

## Session Log — 2026-06-10 (admin dashboard revamp branch)
- Built: `feat/admin-dashboard-revamp` (commit 434e68b) — ui-designer agent + design-taste-frontend
  skill (dashboard = out of skill's core scope; applied only consistency/contrast/density/UI-state
  rules, Redesign-Preserve mode). Changed: AdminLayout (accent bar, initials avatar, lockup),
  AdminDashboard (raised segmented toggle w/ icons, last-refreshed line, optional onDataRefreshed
  prop), ApplicationsList (clickable stat tiles, 13→10 col table w/ merged Applicant + Scoring
  cells, sticky thead, row click, filter bar w/ clear-all, skeleton loaders, designed empty/error
  states). ApplicationDetail intentionally untouched (logic-heavy).
- Decisions made: reverted agent's CSV consent-string edit (compliance data, not UI copy);
  renamed misleading "SA Confirmed" tile → "Awaiting SA".
- Assumptions introduced: "Awaiting CI" tile maps to the plain 'pending' filter (no dedicated
  status) — tile count and filtered rows can disagree; flagged for operator review.
- Open items / next session: operator eyeball at localhost:5173 (login → /admin), both themes,
  375px mobile; PR if approved.

## Session Log — 2026-06-23 (public-form submission false warnings)
- Context: all 5 public loan forms (Personal/SME/AKAP/Group/SBL) already carried a prior
  uncommitted change that hardened `handleSubmit` — 90s AbortController timeout, parse the body
  defensively, and branch on `res.ok && data` (trust backend) / `res.ok` no body (uncertain) /
  `!res.ok` (error) / AbortError (uncertain) / network throw (error). New `status:'uncertain'`
  result screen ("Submission Pending Confirmation" + "Back to Home" Link, no retry button) plus
  result-icon CSS animations in `index.css`. This session continued the hunt for remaining false
  warnings in that flow.
- Probed live backend `/api/application/submit` to pin the status-code↔body contract:
  - Validation rejection → **HTTP 200** with `{status:'declined', reasons:[…]}`.
  - Handled error (e.g. bad upload) → **HTTP 400** with `{status:'error', message}`.
  - => Handled outcomes are 200/400; therefore any **5xx is an UNHANDLED exception** (state unknown).
- Built: split the `!res.ok` branch in all 5 forms. New `else if (res.status >= 500 &&
  ![502,503,504].includes(res.status))` → `status:'uncertain'` (app reached, may have partially
  saved — do NOT promise "nothing saved", no retry button). Remaining `else` (4xx validation +
  502/503/504 gateway, which never reach the app) keeps the safe-retry "error" path with the
  backend message. Group/SBL get a member-aware uncertain message ("some members may already be
  on file") since they create borrowers in a server-side loop — a mid-loop 500 is a partial save.
- Verified (no change needed): all 5 submit buttons are `disabled={submitting}` + show
  "Submitting…", so the rapid double-click → duplicate-borrower path is already guarded.
  `Link` already imported in all 5 forms. `npx vite build` green.
- Decisions made: 502/503/504 stay on the safe-retry path (Railway cold-start/gateway errors never
  reach app logic → nothing saved → retry is correct and friendlier than a "contact us" scare).
  Only genuine app-5xx flips to uncertain. Bias throughout: a false "contact us" (mild ops
  friction) beats a false "retry" (duplicate loan application).
- Assumptions introduced:
  - [ASSUMPTION] Backend keeps the observed coupling: handled outcomes 200/400, unhandled = 5xx.
    If the backend ever returns `declined` under a 4xx, it would wrongly hit the safe-retry error
    branch (losing the reasons list). Probe showed declined@200 today — UNVERIFIED for future.
  - [ASSUMPTION] A `Failed to fetch` network throw = request never completed → "wasn't submitted".
    Edge cases (CORS-rejected response, connection drop mid-response after a server save) are not
    distinguished; left as-is to keep the common offline case from being scary. Low likelihood.
- Scope candidates deferred:
  - [SCOPE CANDIDATE] Group/SBL partial-save under a 200/4xx body carrying `failedMember` still
    renders a "Try Again" button — retrying re-creates already-saved members. Only the 5xx path is
    now guarded. Needs the backend's group/partial-failure contract (status code + whether retry
    dedupes) before changing.
- Open items / next session: UAT the uncertain screen copy on 375px; confirm a real declined still
  renders the reasons list (declined@200 path). Nothing committed yet — operator review then PR.

## Session Log — 2026-06-24 (public-form submit: duplicate-loop + 5xx contract correction)
- Context: Backend engineer confirmed the exact `/api/application/submit` + `/submit-group` contract
  — single/bulk insert is ATOMIC, NO per-member loop, Loandisk borrowers created only at admin
  approval. This corrected two false assumptions from 2026-06-23 that were producing bad UX in all
  5 public forms. The `failedMember` SCOPE CANDIDATE from 2026-06-23 is now RESOLVED.
- Built (all 5 forms — Personal/SME/AKAP/Group/SBL):
  - Bug A (duplicate-submit loop): a 200 `{status:'error'}` ("already under review" — duplicate
    pending phone, caught via partial unique index `applications_pending_phone_uniq`) was hitting
    `setResult(data)` → "Something Went Wrong" + **Try Again**, looping the user on a submit that
    already landed. Now mapped to a new `status:'info'` → "Already Under Review" title + **Back to
    Home** (no retry); backend message passed through.
  - Bug B (mislabeled 5xx): removed the `res.status >= 500 && ![502,503,504]` → `uncertain` branch
    in every form. Per the confirmed contract every handled outcome is a 200, so a genuine app-5xx
    is an unhandled exception that commits ZERO rows. 5xx now falls through to the safe-retry
    `error` path ("Try Again"). Reverses the 2026-06-23 caution that assumed partial saves.
  - Bug C (Group/SBL only): deleted the `failedMember` result key + the "Issue with Member N" modal
    block — provably never fires (no per-member loop on the endpoint = dead code).
  - Modal (3-way result actions): `error` → "Try Again" (setResult(null)); `uncertain` → "Back to
    Home"; `info` → primary "Try another application" (setResult(null), returns to the form with
    entries preserved so the applicant can change the phone + resubmit) + secondary "Back to Home"
    link. `info` styled with a calm blue badge (`bg-blue/10 border-blue/30`, info-circle icon,
    `result-badge` pop only — NOT the `result-badge-warn` pulse) vs the yellow alert kept for
    error/uncertain.
- Decisions made:
  - Scope expanded to all 5 forms (operator-confirmed). Prompt §4 confirmed the 5xx contract holds
    for all 5; bugs A+B were identical in the 3 single forms, not just Group/SBL.
  - 502/503/504 stay on the safe-retry path (unchanged) — gateway errors never reach app logic.
  - Treat ALL 200 `{status:'error'}` as do-not-retry: per contract the only `error` at 200 is the
    duplicate/already-pending case (declined=`declined`, success=`success`).
- Assumptions introduced:
  - [ASSUMPTION] 200 `{status:'error'}` is ALWAYS the duplicate/"already under review" case (never
    a retry-able error at 200). Matches the stated contract; a future transient error returned at
    200 would wrongly render the no-retry info screen.
- Scope candidates deferred: none. (2026-06-23's Group/SBL `failedMember` partial-save SCOPE
  CANDIDATE is RESOLVED — dead code removed, contract confirms no partial saves possible.)
- Open items / next session: Manual UAT on 375px — duplicate phone → blue "Already Under Review"
  screen with "Try another application" (returns to form, entries kept) + "Back to Home"; real
  `declined@200` still lists reasons; a forced app-5xx shows "Try Again". `npx vite build` green.
  Landed on main via PR #3 (merge commit).
