# DE-BLOSSOM — Cooperative Financial Management Platform

A modern, production-grade fintech cooperative management platform built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS**.

---

## 🏛️ System Overview

DE-BLOSSOM is engineered specifically for cooperative societies, providing dedicated portals for **Members** and **Administrators** with realistic financial workflows, ledger immutability, payment proof verification, and strict role governance.

### Core Roles
- **`member`**: Manages personal profile, regular savings equity, interest-free special savings, payment slip submissions, loan applications, and principal repayments.
- **`admin`**: Verifies bank transfers against official statements, reviews loan applications, authorizes disbursements, manages the immutable general ledger, configures receiving bank accounts, and audits all cooperative activity.

---

## 🔒 Financial Integrity Requirements (Non-Negotiable)

The platform strictly implements the 16 financial integrity rules:

1. **Pending contributions never affect balances.**
2. **Rejected contributions never affect balances.**
3. **Only administrator-approved contributions enter the financial ledger.**
4. **Financial approval posts to the ledger exactly once**, with safeguards preventing duplicate postings.
5. **Loan approval and loan disbursement are strictly separate operations** (Approval reserves the facility; Disbursement initiates the funds outflow and ledger posting).
6. **Repayments cannot exceed outstanding principal** (Overpayment validation is enforced).
7. **Members cannot approve their own contributions, loans, or repayments.**
8. **Members cannot assign themselves administrative privileges** (Role provisioning occurs exclusively through trusted server-side Auth workflows).
9. **Ordinary users and administrators cannot edit or delete ledger transactions** (Transactions are immutable; adjustments must be separate journal entries).
10. **All financial actions are logged to an audit trail** (`who`, `what`, `target`, `timestamp`, and `remarks`).
11. **Balances are derived dynamically from ledger entries**, rather than manual editable balance fields.
12. **Regular Savings and Special Savings remain strictly distinct**:
    - **Regular Savings**: Long-term member equity determining loan eligibility; non-withdrawable on demand.
    - **Special Savings**: Voluntary, interest-free deposits withdrawable on demand via review.
13. **Special savings withdrawals require administrative authorization** before ledger deduction.
14. **No fabricated interest policies**: The cooperative's loan interest policy is currently pending formal ratification by the General Assembly. Rather than generating arbitrary interest percentages or formulas, loan workflows operate in **Principal-Only** mode and explicitly display cooperative policy notices.
15. **Dynamic Cooperative Bank Details**: Official bank details displayed to members are derived dynamically from `cooperativeSettings` rather than hardcoded in the frontend.

---

## 🚀 Application Route Structure

### Public Routes
- `/`: Landing page highlighting cooperative services, security, and savings benefits.
- `/auth`: Unified authentication page with seamless Sign In and Member Registration tabs.
- `/forgot-password`: Password recovery request workflow.
- `/reset-password`: Password update interface with password strength validation.

### Member Portal (`/member`)
- `/member`: Overview dashboard with savings cards, growth charts, active loan summaries, upcoming repayments, and recent ledger activity.
- `/member/savings`: Dual-view savings management (Regular Savings equity history & Special Savings withdrawal request workflow).
- `/member/contributions`: Complete history of payment submissions with status badges and detail modals.
- `/member/contributions/new`: Bank transfer evidence submission form featuring live official bank account details and receipt upload.
- `/member/loans`: Loan facilities tracker, active amortizations, and historical requests.
- `/member/loans/apply`: Application form displaying real-time member savings health and credit policy notices.
- `/member/loans/[id]`: Detailed view of a loan facility, repayment ledger, and amortization progress.
- `/member/repayments`: Repayment dashboard and installment submission modal (principal-only amortization).
- `/member/transactions`: Immutable personal transaction journal with search, filtering, and statement export.
- `/member/profile`: Member identity profile with restricted editing (immutable ID/email/role).
- `/member/settings`: Password change and communication preference toggles.

### Admin Console (`/admin`)
- `/admin`: Operations dashboard with 6 key executive KPI cards, monthly contribution charts, member growth analytics, and verification queues.
- `/admin/members`: Filterable member directory with live regular and special savings balances.
- `/admin/members/[id]`: Complete 360° member view with tabs for profile, contributions, loans, and ledger activity, plus account suspension controls.
- `/admin/contributions`: Payment verification queue (Pending, Approved, Rejected) with search and status filtering.
- `/admin/contributions/[id]`: Dedicated verification workbench to inspect transfer receipts, match reference numbers, and post to the ledger.
- `/admin/loan-applications`: Credit committee review queue to assess savings, set approved amounts, add conditions, or decline.
- `/admin/loans`: Active loan register tracking disbursed principal, outstanding debt, and repayment statuses.
- `/admin/loans/[id]`: Facility detail page with separate **"Disburse Loan Funds"** trigger that logs the outflow transaction.
- `/admin/repayments`: Installment verification queue with principal reduction logic and overpayment safeguards.
- `/admin/transactions`: Authoritative general ledger with search, multi-category filters, and CSV export.
- `/admin/reports`: Executive reporting center with portfolio breakdown (PieChart), growth metrics, liquidity reserves, and CSV download.
- `/admin/settings`: Cooperative identity, financial framework settings, and official receiving bank account configuration.
- `/admin/administrators`: Administrator roster and server-side provisioning governance.

---

## 🛠️ Architecture & Supabase Integration Pathway

The application uses a centralized data-access and mock data abstraction layer in `src/lib/mock-data.ts` and `src/lib/types.ts`. All totals and balances are computed mathematically from records:

```typescript
// Example: Balance calculation derived strictly from approved records
export function getMemberSavings(memberId: string) {
  const approved = contributions.filter(
    (c) => c.memberId === memberId && c.status === 'approved'
  );
  const regular = approved
    .filter((c) => c.type === 'regular')
    .reduce((sum, c) => sum + c.amount, 0);
  const special = approved
    .filter((c) => c.type === 'special')
    .reduce((sum, c) => sum + c.amount, 0);
  const withdrawals = withdrawalRequests
    .filter((w) => w.memberId === memberId && (w.status === 'approved' || w.status === 'completed'))
    .reduce((sum, w) => sum + w.amount, 0);

  return {
    memberId,
    regularSavings: regular,
    specialSavings: special - withdrawals,
    totalSavings: regular + special - withdrawals,
  };
}
```

### Future Supabase Integration
When ready to connect to the reviewed database schema:
1. Replace mock functions in `src/lib/mock-data.ts` with Supabase client calls (`@supabase/ssr`).
2. Authentication uses `supabase.auth.signInWithPassword()` and reads the trusted claim `data.user.app_metadata.role`.
3. File uploads will target Supabase Storage buckets (e.g., `receipts`).
4. Financial ledger operations will be executed via database RPC functions or transactions with row-level security (RLS) enforcement.

---

## 💻 Demo Credentials

For testing the prototype interface:
- **Member Account**: `adaeze.okafor@email.com` (Any password) → Redirects to `/member`
- **Admin Account**: `admin@deblossom.coop` (Any password) → Redirects to `/admin`

*(Both navigation layouts also feature convenient quick-switch links in the sidebar for seamless evaluation.)*
