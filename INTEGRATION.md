# Supabase Integration Guide

This guide turns the Kano Cooperative Society prototype into a production app backed by Supabase.

## Existing foundation

- `@supabase/supabase-js` and `@supabase/ssr` are installed.
- `lib/supabase/client.ts` provides the browser client.
- `lib/supabase/server.ts` provides the SSR server client.
- `lib/queries/` contains initial profile, transaction, loan, and member queries.
- `supabase/schema.sql` defines tables, RLS, and a private receipt bucket.
- `packages/finance-core` contains shared upload types, currency formatting, and receipt paths.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
# Supported legacy fallback:
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Set these in local, preview, and production environments. Never expose a service-role/secret key in client code.

## Supabase setup

1. Create/select the Supabase project.
2. Add the environment variables.
3. Apply [`supabase/schema.sql`](./supabase/schema.sql).
4. Confirm all application tables have RLS enabled.
5. Confirm `repayment-receipts` exists and is private.
6. Enable Auth email/password provider.
7. Configure local, preview, and production redirect URLs.
8. Create Auth users, then matching `profiles` rows using the same UUID.
9. Set the first trusted user's `profiles.role` to `admin` through a controlled admin process.

Move the current SQL into versioned Supabase migrations before production. Review every policy with a non-admin test account.

## Auth implementation

The current `auth-screen.tsx` and `role-router.tsx` are demo-only. Replace them with:

1. A sign-in server action/route calling `signInWithPassword`.
2. SSR cookie persistence through `createClient()`.
3. Server-side profile lookup after authentication.
4. Redirects to `/member` or `/admin` based on `profiles.role`.
5. Protected route handling for unauthenticated users.
6. An explicit sign-out action.

Recommended route structure:

```text
/sign-in
/member
/admin
```

Do not accept a role from the browser and do not infer admin status from email text.

## Data integration

Replace `lib/mock-data.ts` imports in user-facing flows with server-loaded data.

Suggested modules:

```text
lib/queries/accounts.ts
lib/queries/statements.ts
lib/queries/reports.ts
lib/mutations/transactions.ts
lib/mutations/loans.ts
lib/mutations/receipts.ts
```

For every member query: call `auth.getUser()`, return an empty/redirect response when unauthenticated, and filter by `user.id` even though RLS also protects the table.

## Savings import

Implement as a server-backed preview/confirm workflow:

1. Admin selects CSV/XLS/XLSX.
2. Server verifies admin role, file size, extension, and MIME type.
3. Parse and normalize `Member Number`, `Date`, `Type`, `Amount`, and `Description`.
4. Validate member existence, supported account type, date, and positive amount.
5. Return accepted rows, rejected rows, and totals for preview.
6. Confirm with an import ID/idempotency key.
7. Insert valid rows in a database transaction/batch.
8. Recalculate affected balances.
9. Write import audit metadata.
10. Revalidate/refresh the admin and member views.

The current `setRows` behavior is only a UI demonstration and must not be retained as the source of truth.

## Repayments and receipts

Use one authorized server mutation:

1. Confirm admin session.
2. Validate member, active loan, amount, date, and allocation.
3. Insert `loan_payments`.
4. Update `loans` totals atomically.
5. Upload the receipt to `repayment-receipts/{userId}/{receiptId}-{safeFileName}`.
6. Insert `repayment_receipts` metadata.
7. Return a success response only after both database and Storage operations succeed.
8. Serve receipts through short-lived signed URLs.

Handle partial failure with a compensating action or a durable outbox/job strategy. Clean up orphaned files.

## Statements and reports

Statement requests must validate account/date range, use the authenticated user's scope, calculate opening/closing balances from ordered transactions, and return printable/PDF data. Admin reports may aggregate across members only after server-side admin authorization. Record report filters and generation time for auditability.

## RLS review

Expected boundaries:

- Members read their own profile, accounts, transactions, loans, payments, and receipts.
- Admins can manage operational records.
- Members cannot change `role`, `member_number`, ownership IDs, or loan totals.
- Receipt files remain private and are accessible only to the owning member or admin.

Add/update policies for any profile editing or new audit tables. Never weaken RLS to fix an application query.

## Deployment

1. Add Supabase variables to Vercel Development, Preview, and Production scopes.
2. Add local and Vercel preview origins to Supabase Auth redirect allowlist.
3. Set the production site URL and redirect URL.
4. Deploy.
5. Test sign-in, sign-out, RLS, member isolation, admin imports, repayment recording, receipt access, and statements in production.
6. Confirm no production page imports `lib/mock-data.ts`.

## Test plan

### Authorization

- Unauthenticated users cannot access private routes.
- Members cannot access admin routes.
- Members cannot read another member's records or receipts.
- Admin role is read from the database, not client state.

### Financial correctness

- Amounts are positive and validated server-side.
- Dates and account types are valid.
- Duplicate imports are safe.
- Loan totals cannot become inconsistent or negative.
- Statements calculate correct opening and closing balances.

### Storage

- Invalid/oversized files are rejected.
- Bucket is private.
- Signed URLs expire.
- Orphan cleanup works.

### Browser acceptance path

1. Member sign-in.
2. Dashboard/account search.
3. Loan and repayment history.
4. Statement generation.
5. Sign-out.
6. Admin sign-in.
7. Member search.
8. Invalid and valid import preview.
9. Import confirmation and balance verification.
10. Repayment with receipt.
11. Member verification of updated data and receipt permissions.

## Production checklist

- [ ] Version SQL migrations.
- [ ] Generate accurate Supabase types.
- [ ] Replace mock data.
- [ ] Add protected routes and server mutations.
- [ ] Add import idempotency and audit logs.
- [ ] Add receipt validation, signed URLs, and cleanup.
- [ ] Add statement/PDF generation.
- [ ] Add rate limiting and monitoring.
- [ ] Review RLS with member/admin test accounts.
- [ ] Run `pnpm build` and browser QA.

## Troubleshooting

**Missing session:** Check SSR cookies, HTTPS/domain behavior, and Auth redirect URLs.

**Empty queries:** Confirm an Auth user has a matching `profiles` row with the same UUID, seed data exists, and RLS permits the operation.

**Admin denied:** Verify `profiles.role = 'admin'`; do not bypass RLS.

**Receipt upload fails:** Check private bucket name, Storage policies, object path, authenticated client, file size, and MIME type.

**Preview differs from production:** Check Vercel environment-variable scopes and ensure no mock-data imports remain.

![Kano Cooperative Society portal integration reference](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screen%20Shot%202026-05-06%20at%2011.32.23%20AM-2aS1xJwjp1n8h7hT0K5QqQxvP7Jm9.png)

Use the existing interface as the visual target while implementing the secure workflows above.
