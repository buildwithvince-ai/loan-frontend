# Decision Log — GR8 Lending Corporation Frontend

Chronological record of major architectural decisions, pivots, and trade-offs made during development.

---

## 1. Initial Tech Stack: React + Vite + Tailwind (No TypeScript)

**Date:** Early March 2026
**Decision:** Build with React 19, Vite 6, Tailwind CSS 4, plain JavaScript (JSX).
**Why:** Speed of delivery over type safety. Small team, single developer — TypeScript overhead wasn't justified for a form-heavy app with no shared component library.
**Trade-off:** No compile-time type checking. Mitigated by consistent patterns and per-form validation.

---

## 2. One Component Per Form (No Shared Form Library)

**Date:** Early March 2026
**Decision:** Each of the 5 loan forms (Personal, SME, AKAP, Group, SBL) is a self-contained file with its own step components, validation, and submission logic. Shared UI primitives (Label, Input, Select, DocumentUpload) are defined per form, not extracted.
**Why:** Each loan product has different fields, steps, validation rules, and document requirements. Extracting a generic form framework would add complexity without saving much code. Easier to copy-paste and adapt than to build abstractions that need to handle 5 different shapes.
**Trade-off:** Some duplication across forms. Accepted as manageable for 5 forms.

---

## 3. Loan Amount Input: Slider → Grid Buttons → Textbox

**Date:** March 2026 (iterated 3 times)
**Decision:** Started with slider input, tried selectable grid buttons (₱10K increments), settled on plain textbox with onBlur rounding.
**Why:** Slider was imprecise on mobile. Grid buttons looked good but were clunky for large ranges (₱50K–₱300K SME). Plain textbox with smart clamping/rounding on blur was the simplest and most usable.
**Trade-off:** Less visual flair, but direct and functional.
**Rule going forward:** Always use plain textbox for amount inputs. Never card grids or button selectors.

---

## 4. Secret-Based Auth → JWT Auth with Role-Based Access

**Date:** March 31, 2026
**Decision:** Replaced `VITE_ADMIN_SECRET` / `VITE_CI_SECRET` localStorage checks with JWT-based authentication. Added Login page, AuthContext, ProtectedRoute, and role-based routing.
**Why:** Needed granular role-based access for pipeline stages — different staff roles see different actions. Shared secrets don't support per-user identity or audit trails.
**Trade-off:** JWT is memory-only (no refresh token persistence). Users must re-login on page refresh. Accepted for security — no tokens in localStorage.

---

## 5. Admin Layout: Top Tabs → Left Sidebar

**Date:** April 1, 2026
**Decision:** Replaced horizontal tab navigation with a fixed left sidebar (AdminLayout component).
**Why:** Growing number of admin pages (Applications, Users, My Account, Pipeline) — horizontal tabs don't scale. Sidebar provides persistent navigation and user info footer.
**Trade-off:** Takes horizontal space on desktop. Collapses to hamburger on mobile.

---

## 6. Pipeline: Table View → Kanban Board with Drag-and-Drop

**Date:** March 31, 2026
**Decision:** Built a Kanban-style pipeline board using @dnd-kit for drag-and-drop. 6 stages: Sales Officer → Verifier → CI Officer → Approver → Loan Processing Officer → Declined.
**Why:** Visual pipeline management matches the lending workflow. Staff can see application flow at a glance and move cards between stages.
**Trade-off:** More complex than a simple status dropdown. Locked stages (LPO, Declined) prevent accidental drags. Transition modals require confirmation before committing moves.

---

## 7. View Toggle: Pipeline vs. Table as Top Filter

**Date:** April 1, 2026
**Decision:** Added a toggle at the top of the admin dashboard to switch between Pipeline (Kanban) and Table (list) views. Both views share the same data and filters.
**Why:** Some staff prefer list view for searching/filtering, others prefer visual pipeline. Both need to coexist.
**Trade-off:** Two rendering paths for the same data. Manageable since they share the same fetch and filter logic.

---

## 8. Sales Officer Integration: Dropdown + Pipeline Actions

**Date:** April 2, 2026
**Decision:** Added SO selector dropdown to all 5 loan forms (fetched from `/api/public/sales-officers`). Added pipeline features: SO confirmation button, return-to-SO flow with reason, SO decision tracking.
**Why:** Loan officers (SOs) are the front-line — they need to be linked to applications from submission through approval. Confirmation flow prevents approving loans the SO didn't verify in person.
**Trade-off:** Extra API call on every form load to fetch SO list. Cached via `useSalesOfficers` hook.

---

## 9. Single Role → Multi-Role Per User

**Date:** April 4, 2026
**Decision:** Changed from single `role` string to `roles[]` array across the entire frontend. Edit and invite modals now use checkbox groups. AuthContext exposes `hasRole()` and `hasAnyRole()` helpers.
**Why:** Team is lean — one person may need to act as verifier, approver, and sales officer simultaneously. Single role assignment was blocking this.
**Trade-off:** More complex role checks throughout the app. Mitigated by centralized helpers in AuthContext. Smart SO filtering: users with SO + elevated role see all apps (not restricted to their own).
**Backend contract:** Frontend sends `roles: []` array. Backend must accept `roles` array on user create/update endpoints and return `roles[]` on login response (falls back gracefully to `role` string).

---

## 10. File Upload Limit: 5MB → 10MB

**Date:** March 2026
**Decision:** Raised client-side file upload limit from 5MB to 10MB across all loan forms.
**Why:** Borrowers were hitting the limit with phone camera photos of documents. Backend compresses images via `sharp` before storage, so larger uploads are acceptable.
**Trade-off:** Slightly longer upload times on slow connections. Acceptable given the use case.

---

## 11. Barangay as Required Field with Custom Loandisk Mapping

**Date:** March 2026
**Decision:** Made barangay a required address field on all forms. Maps to `custom_field_26904` in Loandisk.
**Why:** Barangay is a standard address component in the Philippines and required for CI (Credit Investigation) — investigators need it to locate borrowers.
**Trade-off:** Extra field not natively supported by Loandisk, required custom field mapping.

---

## 12. CI Portal: Separate Route, Shared Backend

**Date:** March 2026
**Decision:** CI officers access a separate `/ci` route (no admin sidebar) with their own assessment form. CI scoring is also accessible inline from the admin ApplicationDetail view.
**Why:** CI officers work in the field and need a focused interface. Admin staff need to review CI scores alongside application details without switching portals.
**Trade-off:** Two entry points to scoring functionality. CiAssessmentForm and CiScoringForm share scoring logic but have different UX contexts.

---

## 13. No State Management Library

**Decision:** React hooks only — useState, useEffect, useRef, useContext. No Redux, Zustand, or similar.
**Why:** App state is mostly local to pages/forms. Only auth state is truly global (via AuthContext). Adding a state library for a form-heavy app would be over-engineering.
**Trade-off:** No dev tools for state debugging. Acceptable at current complexity.

---

## 14. Hosting: Cloudflare Pages + Railway

**Decision:** Frontend on Cloudflare Pages (client's account, custom domain with SSL). Backend on Railway.
**Why:** Cloudflare Pages gives free, fast global CDN with automatic deploys. Railway provides simple container hosting for the Node.js backend with easy env var management.
**Trade-off:** Two separate hosting providers to manage. SPA routing handled via `_redirects` file.
