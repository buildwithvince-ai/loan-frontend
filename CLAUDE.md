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
- Admin: `GET/POST /api/admin/applications[/:id]` — requires `x-admin-secret` header
- CI: `GET/POST /api/ci/applications[/:id]` — requires `x-ci-secret` header

## Environment Variables
- `VITE_ADMIN_SECRET` — Admin dashboard password
- `VITE_CI_SECRET` — CI portal password

## Pages & Routes

### Public
- `/` — Landing page (Hero, LoanProducts, LoanCalculator, HowItWorks, TrustSignals)
- `/apply` — SelectProduct (choose from 5 loan types)
- `/apply/personal` — Personal Loan form (9 steps)
- `/apply/sme` — SME Loan form (10 steps)
- `/apply/akap` — AKAP Loan form (8 steps)
- `/apply/group` — Group Loan form (3 steps)
- `/apply/sbl` — SBL form (3 steps)

### Admin (no navbar/footer, password-protected)
- `/admin` — AdminDashboard → ApplicationsList + ApplicationDetail

### CI Portal (no navbar/footer, password-protected)
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
- `adminFetch(path)` — prepends admin base URL + secret header
- `ciFetch(path)` — prepends CI base URL + secret header
- Public forms: direct `fetch()` to backend URL

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
