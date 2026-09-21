# De blossom Cooperative Society Portal

A member and administrator financial portal for tracking cooperative savings, shares, special savings, loans, repayments, statements, and repayment evidence.

> **Project status:** The UI is a working prototype. It currently uses `lib/mock-data.ts` and client-only demo role selection. Supabase schema, RLS, clients, and query helpers are present as the production foundation. The remaining implementation is documented below.

## What the product does

### Member experience

- Sign in and view a personalized dashboard.
- Review savings, shares, and special savings balances.
- Search transaction history.
- View active loans, payment history, and loan statements.
- Generate statements for a selected account and date range.
- Manage profile/settings after those screens are connected to Auth.

### Administrator experience

- View cooperative-level totals.
- Search the member directory.
- Review member balances and loan status.
- Import savings records from CSV/XLS/XLSX.
- Record loan repayments.
- Attach private payment receipts.
- Produce reports and maintain an audit trail.

## Current architecture

```text
app/page.tsx                 Entry point.
app/admin/page.tsx           Admin route entry point.
components/auth-screen.tsx   Prototype sign-in.
components/role-router.tsx   Prototype role switcher.
components/cooperative-portal.tsx Member/admin portal UI.
components/admin-portal.tsx  Import/receipt prototype.
lib/mock-data.ts             Demo data; remove from production flows.
lib/supabase/client.ts       Browser Supabase client.
lib/supabase/server.ts       Server Supabase client.
lib/queries/                 Existing server query helpers.
packages/finance-core/       Shared finance types/utilities.
supabase/schema.sql         Tables, RLS, and private receipt bucket.
```

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn-style primitives, pnpm workspaces, Supabase Auth/Postgres/Storage, and Vercel Analytics.

## Setup

```bash
pnpm install
pnpm dev
```

Create `.env.local` using the variables in [`INTEGRATION.md`](./INTEGRATION.md), apply [`supabase/schema.sql`](./supabase/schema.sql), then open `http://localhost:3000`.

```bash
pnpm build
pnpm start
```

## Complete workflow map

### 1. Authentication and routing

**Prototype:** `AuthScreen` accepts any non-empty credentials and treats emails containing `admin` as administrators.

**Production:** Sign in with Supabase email/password, persist the SSR session cookie, load `profiles.role`, and redirect to member/admin routes. Protect routes on the server, implement sign-out, and never infer role from an email address or client state.

### 2. Member dashboard

Authenticate the user, load their profile, savings accounts, recent transactions, active loan, and payments. Calculate totals from live records on the server, then render cards, recent activity, account status, and notices. Every query must be scoped to `auth.uid()`.

### 3. Savings, shares, and special savings

When a member selects an account tab, query the matching `savings_accounts` row and `transactions` for that account type. Support search, date filters, credits/debits, balances, pagination, loading, empty, and error states.

### 4. Loans and repayments

Load the member's active `loans` record and related `loan_payments`. Display principal, interest, total payable, amount paid, outstanding balance, due date, and progress. Create payments through a server mutation that recalculates totals atomically and marks the loan completed at zero balance.

### 5. Statements

Accept account type and date range, validate the range, query only authorized rows, calculate opening balance/credits/debits/closing balance, and return a printable or downloadable PDF. Member statements must never accept an arbitrary user ID from the browser.

### 6. Admin member directory

Verify the session user is an admin on the server, query profiles and aggregates, and support safe search by name, email, or member number. Add a member detail route with the same authorization boundary.

### 7. Savings import

Upload the file to a server endpoint, validate size/type, parse and normalize headers (`Member Number`, `Date`, `Type`, `Amount`, `Description`), resolve member numbers, reject invalid rows, show a preview, then confirm an atomic batch insert. Update balances, prevent duplicate imports with an idempotency key, and record an import audit entry.

### 8. Repayment receipt

Admin selects a member and active loan, enters a validated payment, and attaches a receipt. Insert the payment and update the loan atomically, upload the file to private Storage at `repayment-receipts/{userId}/{receiptId}-{safeFileName}`, save metadata, and provide only short-lived signed URLs to authorized users. Do not report success if storage or metadata creation fails.

### 9. Profile and settings

Read the profile through the authenticated server client. Allow only approved fields to change. Never let a browser update `id`, `role`, or `member_number` without a dedicated authorized admin workflow.

### 10. Reports and audit

Admin selects a report type/date range, the server aggregates authorized records, and the response includes filters and generation time. Add audit records for imports, payment changes, receipt access, and exports.

## Data model

- `profiles`: Auth-linked identity, member number, and role.
- `savings_accounts`: One balance per user/account type.
- `transactions`: Savings/share/special-savings credits and debits.
- `loans`: Principal, interest, totals, status, and due date.
- `loan_payments`: Payment and principal/interest breakdown.
- `repayment_receipts`: Private Storage object metadata.

## Security rules

- Use Supabase Auth and server-side `auth.getUser()`.
- Keep RLS enabled and scope every query by the current user.
- Keep receipts private; use signed URLs.
- Validate all money, dates, enum values, file types, file sizes, and imports server-side.
- Never expose service-role secrets in client code.
- Add rate limiting and audit logging before launch.

## Completion checklist

- [ ] Replace demo auth and `RoleRouter` state with Supabase Auth/protected routes.
- [ ] Replace all production `mock-data` reads with live queries.
- [ ] Add server mutations for imports, transactions, loans, and repayments.
- [ ] Add validated import preview and idempotency.
- [ ] Add private receipt upload/download and cleanup.
- [ ] Add statement generation.
- [ ] Add audit tables and admin history.
- [ ] Add loading, error, empty, and permission-denied states.
- [ ] Add RLS, financial calculation, import, and authorization tests.
- [ ] Configure preview/production Auth redirects.
- [ ] Run `pnpm build` and browser-test every workflow above.

See [`INTEGRATION.md`](./INTEGRATION.md) for Supabase setup, environment variables, migration guidance, and testing.

## License

No license has been declared yet. Add one before distribution.

![Kano Cooperative Society portal visual reference](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screen%20Shot%202026-05-06%20at%2011.32.23%20AM-2aS1xJwjp1n8h7hT0K5QqQxvP7Jm9.png)

The screenshot above is the visual handoff reference for the current portal UI.

![Kano Cooperative Society portal visual reference](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screen%20Shot%202026-05-06%20at%2011.32.23%20AM-2aS1xJwjp1n8h7hT0K5QqQxvP7Jm9.png)

Use the reference alongside the workflow map when completing the live implementation.

![Kano Cooperative Society portal visual reference](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screen%20Shot%202026-05-06%20at%2011.32.23%20AM-2aS1xJwjp1n8h7hT0K5QqQxvP7Jm9.png)

Preserve the existing emerald, amber, and slate visual language while prioritizing privacy and correctness.

![Kano Cooperative Society portal visual reference](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screen%20Shot%202026-05-06%20at%2011.32.23%20AM-2aS1xJwjp1n8h7hT0K5QqQxvP7Jm9.png)

This is the intended product direction for the implementation owner.

![Kano Cooperative Society portal visual reference](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screen%20Shot%202026-05-06%20at%2011.32.23%20AM-2aS1xJwjp1n8h7hT0K5QqQxvP7Jm9.png)

End of project handoff.
