# Project: GR8 Lending Corporation — Loan Application Frontend

## Project Overview
Online loan application system for GR8 Lending Corporation, a lending company based in
Malolos, Bulacan, Philippines. This is the frontend that collects borrower information
and submits it to the backend API.

## Backend
- Live URL: https://loan-backend-production-cd45.up.railway.app
- Submit endpoint: POST /api/application/submit (multipart/form-data)
- Response types:
  - { status: 'success', referenceId: '123456' }
  - { status: 'declined', reasons: ['reason1', 'reason2'] }
  - { status: 'error', message: 'Something went wrong' }

## Tech Stack
- React + TypeScript
- Tailwind CSS
- Vite
- React Router DOM

## Design Direction
- Dark theme (dark navy/slate background)
- Professional, trustworthy look appropriate for a lending company
- Mobile-first, fully responsive
- Clean, minimal UI — no clutter

## Pages & Routes
- / — Landing page
- /apply/personal — Personal Loan application form
- /apply/sme — SME Loan application form
- /apply/akap — AKAP Loan application form

## Landing Page Sections
1. Hero — headline: "Get Your Loan Approved Faster — Apply Online in Minutes"
         subheadline: "No long lines. No paperwork. Get a decision without leaving home."
2. Loan calculator widget (amount slider + payment term dropdown)
3. Loan products (Personal Loan, SME Loan, AKAP Loan) with links to respective form pages
4. How it works (3 steps: Apply Online, Get Reviewed, Receive Funds)
5. Trust signals (Local Lender, Fast Processing, Secure & Confidential)
6. Footer with contact information placeholders

## Loan Products

### Personal Loan (/apply/personal)
- Min: ₱10,000 | Max: ₱30,000
- Terms: 3, 6, 12 months
- Min income: ₱15,000/month
- Fields: borrower info, present + permanent address, financial info,
  spouse info (optional), 3 personal references, document upload
- Documents: Barangay Clearance, Valid ID, 3 months payslip + COE,
  Company ID, Proof of Billing

### SME Loan (/apply/sme)
- Min: ₱50,000 | Max: ₱100,000
- Terms: 3, 6, 12, 24 months
- Min income: ₱30,000/month
- Fields: business info, 3 major suppliers, 3 major customers,
  borrower info, present + permanent address, spouse info (optional),
  document upload
- Documents: DTI/SEC Registration, Business Permit (Barangay + City),
  Barangay Clearance, Suppliers/Customers list, 2 Valid IDs,
  Proof of Billing, 3 months bank statement, GIS (optional), ITR & AFS

### AKAP Loan (/apply/akap)
- Min: ₱5,000 | Max: ₱40,000
- Terms: 3, 4, 5, 6 months
- Min income: ₱10,000/month
- Fields: business info, borrower info, present + permanent address,
  co-borrower info (optional), document upload
- Documents: DTI (optional), Business Permit (Barangay),
  Barangay Clearance, Suppliers/Customers list, 2 Valid IDs,
  Proof of Billing

## Form Requirements (All Forms)
- Multi-step with progress indicator
- Validate each step before proceeding
- Back button on every step without losing data
- Mobile responsive
- Permanent address: include "Same as present address" checkbox to auto-fill
- Spouse/co-borrower sections are optional
- File uploads: JPG, PNG, PDF only, max 5MB per file
- On success: show reference ID + "Your application has been received.
  Our team will review it within 2-3 business days."
- On declined: show reasons clearly
- On error: show retry message

## Validation Rules
- Age: 21-65 years old based on date of birth
- Mobile: Philippine format (09XXXXXXXXX)
- Income: must meet minimum per product
- Loan amount: must be within min/max per product

## Skills & Guidelines
Read and strictly follow all instructions in these files before writing any code:

- ~/Desktop/frontend-design/SKILL.md
- ~/Desktop/frontend-patterns/SKILL.md
- ~/Desktop/continuous-learning-v2/SKILL.md

## Key Notes
- borrower_description field in Loandisk stores personal references as formatted text
- borrower_business_name is a native Loandisk field
- Barangay is a required field (maps to custom_field_26904 in Loandisk)
- Group Loan and SBL forms are deferred — do not build these yet

## Live URL
https://gr8lendingcorporation.com

## Hosting
Netlify (client account) — free tier
Custom domain with Let's Encrypt SSL enabled
