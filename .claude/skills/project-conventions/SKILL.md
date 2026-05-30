---
name: project-conventions
description: Background coding conventions for the GR8 Lending loan frontend — code style, auth model, form patterns, and banned UI patterns. Loaded automatically as context; not user-invocable.
user-invocable: false
---

# GR8 Lending Frontend — Conventions

Apply these without being asked. They encode decisions already made on this codebase.

## Language & style (match existing files exactly)
- **JavaScript only — never TypeScript.** All files are `.jsx` / `.js`.
- **No semicolons.** Single quotes for strings. 2-space indent.
- One component per file, `default export`.
- No state library — React hooks only (`useState`, `useEffect`, `useRef`, `useContext`).
- Pages in `src/pages/`, components in `src/components/`, admin in `src/pages/admin/`, CI in `src/pages/ci/`.

## Auth (current — JWT, not secrets)
- Auth is **JWT Bearer** via `AuthContext` (`useAuth().getToken`), multi-role (`hasRole`/`hasAnyRole`).
- Admin/CI/pipeline calls go through `adminFetch` / `ciFetch` / `pipelineFetch`, which attach `Authorization: Bearer <token>` automatically.
- **Do not** reintroduce `VITE_ADMIN_SECRET` / `VITE_CI_SECRET` or `x-admin-secret` / `x-ci-secret` headers — that model is retired.
- Env vars in use: `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Loan form pattern (all 5 forms follow this)
- State: `form`, `docs`, `errors`, `step`, `result`, `submitting`.
- Each step is a separate `Step1`…`StepN` function component; per-step validation gates "Next"; Back preserves data.
- Shared UI helpers (`Label`, `Input`, `Select`, `FieldError`, `DocumentUpload`) and utils (`formatPeso`, `getAge`, `validMobile`, `validEmail`) are **defined per-form, intentionally not extracted**. Match that — don't refactor them into a shared module unless explicitly asked.
- Submit builds `FormData`, POSTs to `/api/application/submit`, renders a result modal from `{ status, referenceId?, reasons?, message? }`.
- File upload: JPG/PNG/PDF, **10MB** max (`MAX_FILE_SIZE = 10 * 1024 * 1024`).

## Amount input — hard rule
- Loan amount is a **plain typable textbox** (synced with a slider, clamped to min/max, rounded onBlur).
- **Never** use card grids, button selectors, or preset-amount tiles for amount entry. This is a standing user preference.

## Validation
- Age 21–65 from DOB. Mobile `^09\d{9}$`. Standard email regex. Income ≥ product minimum. Amount within product min/max.

## Known inconsistency (fix-it, don't propagate)
- Public forms **hardcode** the backend URL in their `fetch()` call; admin/CI use `import.meta.env.VITE_API_BASE_URL`. Prefer `VITE_API_BASE_URL` when touching submit code — do not copy the hardcoded literal into new code.

## Reference
- Loan product amounts/terms/rates: see `CLAUDE.md` "Loan Products Summary" and memory `project_loan_products`.
- Loandisk field maps (barangay → `custom_field_26904`, references in `borrower_description`, etc.): memory `project_field_mapping`.
