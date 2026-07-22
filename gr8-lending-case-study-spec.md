---
title: "Loan origination & credit-scoring platform for GR8 Lending Corporation"
slug: "gr8-lending-loan-origination-platform"
client_type: "GR8 Lending Corporation — regional lending company (Malolos, Bulacan, Philippines)"
timeline: "March 2026 – July 2026 (in production since April 2026)"
status: "live"
stack:
  - "React 19"
  - "Tailwind CSS 4"
  - "Vite 6"
  - "React Router 7"
  - "Supabase (auth, storage, Postgres)"
  - "@dnd-kit (pipeline board)"
  - "Playwright (E2E)"
  - "Express 5 (backend)"
  - "FinScore API (telco credit scoring)"
  - "Loandisk API (loan management system of record)"
  - "Cloudflare Pages / Railway (hosting)"
---

## Problem
GR8 Lending Corporation, a lender based in Malolos, Bulacan, was originating loans the
field-sales way — agents canvassing
neighborhoods for borrowers, with applications collected through a patchwork of Google Forms
and Google Sheets. Two things were bleeding money: a high rate of defaulted (unpaid) loans
driven by poor lead quality, and a loan-origination journey scattered across spreadsheets with
no single system of record. There was no structured way to assess a borrower's creditworthiness
before money went out the door, and no reliable audit trail of who reviewed what.

## Constraint
The build had to integrate with the client's existing loan-management system (Loandisk) and a
third-party telco credit-scoring provider, both mid-flight — the backend contract was still
being hardened while the frontend was built against it. The system also had to be operated
day-to-day by non-technical lending staff across several distinct roles, so complexity had to
stay behind a simple interface.

## Approach
The core move was to insert a review-and-scoring layer *between* application intake and the loan
system of record. Every application now stages in the platform first; a borrower is only created
in the loan system once staff approve it — so a bad application can be caught and declined before
origination, not after default. On top of that staging layer sits an automated credit-scoring
engine: a telco-derived FinScore (normalized to a 0–100 scale) is blended 50/50 with a field
Credit-Investigation score to produce a single tiered decision, replacing eyeballing spreadsheet
rows. The delivery consolidated three surfaces into one product: public multi-step application
forms for five distinct loan products, a staff admin dashboard with a drag-and-drop review
pipeline, and a dedicated Credit-Investigation portal — all behind role-based access so each
staff role (sales, verifier, credit investigator, approver, processor, admin) sees only their
part of the workflow.

## Key tradeoff
The decisive call was staging every application in the platform before it ever touches the loan
system of record, instead of the faster path of pushing applications straight through on intake
(essentially what the old Google Forms flow did). That upfront review-and-scoring gate is the
whole point — it's what makes declining a weak applicant *before* origination possible — but it
meant building an entire approval pipeline, scoring engine, and role model rather than a thin
intake form.

## Outcome
The scattered Google Forms + Sheets origination flow was replaced by a single production system:
five loan products, a six-stage review pipeline, and six staff roles, with every applicant now
receiving an automated 0–100 credit score before a human decision. Concretely, the platform moved
loan assessment from unstructured manual review to a repeatable, auditable scoring gate that
declines weak applicants before money is disbursed. No hard default-rate reduction figure was
tracked post-launch, so none is claimed here — the measurable change is qualitative (structured
credit gating and a consolidated system of record) plus the delivered scope above.

## Status note
Live in production since April 2026. Built over roughly four months (~100 frontend commits), with
continued post-launch iteration through mid-2026 — a full admin-dashboard UX revamp, a Sales-Officer
assignment and renewal flow, a Super-Admin loan-terms confirmation loop, and hardening of the public
submission flow to eliminate false "submission failed" warnings that risked duplicate applications.
