# Project Memory — GR8 Lending Frontend

> Read this file at the start of every session. Append key decisions, discoveries, and context as we work.

---

## Architecture & Stack
- React 19 + JavaScript (NOT TypeScript) + Tailwind CSS 4 + Vite 6 + React Router DOM 7
- No state management library — React hooks only
- Frontend: Cloudflare Pages | Backend: Railway
- Live: https://gr8lendingcorporation.com

## What's Built (as of 2026-03-25)
- **5 loan application forms:** Personal (9 steps), SME (10 steps), AKAP (8 steps), Group (3 steps), SBL (3 steps)
- **Landing page:** Hero, LoanProducts (5 cards), LoanCalculator (5 tabs), HowItWorks, TrustSignals, Footer
- **SelectProduct page** (`/apply`): All 5 loan products listed
- **Admin dashboard** (`/admin`): ApplicationsList (filterable table with Finscore + Final Score + Tier columns), ApplicationDetail (full review + approve/decline)
- **CI portal** (`/ci`): CiApplicationsList (assessed/not-assessed split), CiAssessmentForm (scoring matrices per loan type)
- **Scoring system** (`src/pages/admin/scoring.js`): FinScore normalized 300–999→0–100, CI 0–50, Final = 50/50 weighted, Tiers: ≥85 approved, 70–84 tier_b, <70 declined

## Loan Products
| Product | Amount | Terms | Rate | Min Income |
|---------|--------|-------|------|------------|
| Personal | ₱10K–₱30K | 3/6/12 mo | 3.5% | ₱15K |
| SME | ₱50K–₱300K | 3/6/12/24 mo | 3% | ₱30K |
| AKAP | ₱5K–₱40K | 3/4/5/6 mo | 4% | ₱10K |
| Group | ₱10K–₱50K | 3/6/12 mo | 5% | ₱15K |
| SBL | ₱5K–₱100K | 6/12 mo | 5% | ₱2K |

## Key Decisions & Patterns
- **All loan forms must have slider + typable number input** for amount (synced, clamped to min/max)
- **Shared UI components are defined per form** (Label, Input, Select, FieldError) — not extracted to shared files
- **Admin auth:** `VITE_ADMIN_SECRET` env var, `x-admin-secret` header, localStorage flag
- **CI auth:** `VITE_CI_SECRET` env var, `x-ci-secret` header, localStorage flag
- **Document uploads:** JPG/PNG/PDF only, 5MB max, drag-drop zone, in-memory FormData
- **Barangay** is always a required field (maps to `custom_field_26904` in Loandisk)
- **borrower_description** stores personal references as formatted text in Loandisk
- **SBL** restricted to elected/appointed Barangay Officials
- **Group/SBL** support leader + up to 3 members with individual doc uploads

## Known Issues / Sync Gaps
- Backend SME max is still ₱100K — needs update to ₱300K to match frontend

## Session Log

### 2026-03-25
- Added Group Loan and SBL to SelectProduct page (was only showing 3 products)
- Added typable number input alongside slider on Personal, SME, AKAP forms (Group/SBL already had it)
- Added Finscore column to admin ApplicationsList (desktop table + mobile cards)
- Rewrote CLAUDE.md with full project documentation
- Hosting changed from Netlify to Cloudflare Pages
